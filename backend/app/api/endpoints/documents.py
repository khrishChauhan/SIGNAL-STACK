from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.document_service import DocumentService
from backend.app.schemas.document import DocumentResponse
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Internal Documents (RAG)"])

@router.post("/companies/{id}/documents/upload", response_model=APIResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def upload_internal_document(
    id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db)
):
    """Uploads and indexes internal strategy files (PDF, DOCX, CSV, XLSX, TXT) for RAG briefing grounding."""
    document = await DocumentService.upload_document(session, id, file)
    return APIResponse(
        data=document,
        message=f"File '{document.filename}' ingested, validated, and indexed ({document.chunk_count} chunks)."
    )

@router.get("/companies/{id}/documents", response_model=APIResponse[List[DocumentResponse]])
async def list_internal_documents(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Lists all uploaded internal strategy files for the company."""
    docs = await DocumentService.list_documents(session, id)
    return APIResponse(data=docs)
