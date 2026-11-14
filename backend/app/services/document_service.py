import os
from typing import List, Tuple
from datetime import datetime, timezone
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import fitz  # PyMuPDF
import docx
import pandas as pd
from backend.app.models.document import InternalDocument
from backend.app.models.company import Company
from backend.app.services.rag_engine import RAGEngine
from backend.app.core.config import settings
from backend.app.core.errors import FileUploadValidationError, ResourceNotFoundError
from backend.app.core.logging import logger

class DocumentService:
    @staticmethod
    async def upload_document(
        session: AsyncSession,
        company_id: str,
        file: UploadFile
    ) -> InternalDocument:
        # Validate company existence
        stmt = select(Company).where(Company.id == company_id)
        company = (await session.execute(stmt)).scalar_one_or_none()
        if not company:
            raise ResourceNotFoundError("Company", company_id)

        # Validate filename and extension
        filename = file.filename or "uploaded_doc"
        _, ext = os.path.splitext(filename.lower())
        if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise FileUploadValidationError(
                f"File extension '{ext}' is not allowed. Allowed: {settings.ALLOWED_UPLOAD_EXTENSIONS}"
            )

        # Create target storage directory
        company_dir = os.path.join(settings.UPLOAD_DIR, company_id)
        os.makedirs(company_dir, exist_ok=True)
        dest_path = os.path.join(company_dir, f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{filename}")

        # Read content and enforce size check
        content = await file.read()
        file_size = len(content)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise FileUploadValidationError(
                f"File size ({file_size / (1024*1024):.2f}MB) exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit."
            )

        # Save to disk
        with open(dest_path, "wb") as f:
            f.write(content)

        # Extract text & calculate chunk count
        extracted_text = ""
        chunk_count = 1
        try:
            if ext == ".pdf":
                with fitz.open(dest_path) as pdf_doc:
                    pages = [page.get_text() for page in pdf_doc]
                    extracted_text = "\n".join(pages)
                    chunk_count = max(1, len(pages))
            elif ext == ".docx":
                doc = docx.Document(dest_path)
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                extracted_text = "\n".join(paragraphs)
                chunk_count = max(1, len(paragraphs) // 5)
            elif ext in [".csv", ".xlsx"]:
                df = pd.read_csv(dest_path) if ext == ".csv" else pd.read_excel(dest_path)
                extracted_text = df.to_string(max_rows=100)
                chunk_count = max(1, len(df) // 20)
            else:
                extracted_text = content.decode("utf-8", errors="ignore")
                chunk_count = max(1, len(extracted_text) // 500)
        except Exception as e:
            logger.warning(f"Text extraction warning for {filename}: {e}")
            extracted_text = f"Raw document uploaded ({filename})"

        summary = extracted_text[:300].replace("\n", " ").strip() if extracted_text else "Document parsed successfully."

        internal_doc = InternalDocument(
            company_id=company_id,
            filename=filename,
            file_type=ext.lstrip(".").upper(),
            file_path=dest_path,
            file_size_bytes=file_size,
            chunk_count=chunk_count,
            status="INDEXED",
            summary=summary,
            uploaded_at=datetime.now(timezone.utc)
        )
        session.add(internal_doc)
        await session.flush()

        # Index extracted text into ChromaDB vector store
        try:
            indexed_chunks = RAGEngine.index_document(
                company_id=company_id,
                doc_id=internal_doc.id,
                title=filename,
                text=extracted_text,
                source_url=f"internal://documents/{filename}",
                doc_type="INTERNAL"
            )
            if indexed_chunks > 0:
                internal_doc.chunk_count = indexed_chunks
        except Exception as e:
            logger.warning(f"ChromaDB indexing note for {filename}: {e}")

        await session.commit()
        await session.refresh(internal_doc)
        return internal_doc

    @staticmethod
    async def list_documents(session: AsyncSession, company_id: str) -> List[InternalDocument]:
        stmt = (
            select(InternalDocument)
            .where(InternalDocument.company_id == company_id)
            .order_by(InternalDocument.uploaded_at.desc())
        )
        return list((await session.execute(stmt)).scalars().all())
