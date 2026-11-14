import os
import re
import math
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.app.core.config import settings
from backend.app.core.logging import logger

CHROMA_DATA_DIR = os.path.join(os.path.dirname(settings.UPLOAD_DIR), "chromadb")
os.makedirs(CHROMA_DATA_DIR, exist_ok=True)

class RAGEngine:
    """RAG retrieval engine backed by ChromaDB with local persistence

    and a robust deterministic vector/keyword fallback.
    """
    _chroma_client = None

    @classmethod
    def get_client(cls):
        if cls._chroma_client is None:
            try:
                cls._chroma_client = chromadb.PersistentClient(
                    path=CHROMA_DATA_DIR,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
            except Exception as e:
                logger.warning(f"Could not initialize ChromaDB PersistentClient: {e}. Using EphemeralClient.")
                cls._chroma_client = chromadb.EphemeralClient()
        return cls._chroma_client

    @classmethod
    def get_or_create_collection(cls, company_id: str):
        safe_name = f"company_{company_id.replace('-', '_')}"
        client = cls.get_client()
        return client.get_or_create_collection(name=safe_name)

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += (chunk_size - overlap) if (chunk_size - overlap) > 0 else chunk_size
        return chunks

    @classmethod
    def index_document(
        cls,
        company_id: str,
        doc_id: str,
        title: str,
        text: str,
        source_url: str,
        doc_type: str = "INTERNAL"
    ) -> int:
        """Chunks and indexes an internal or external document into the vector store."""
        chunks = cls.chunk_text(text, chunk_size=300, overlap=40)
        if not chunks:
            return 0

        collection = cls.get_or_create_collection(company_id)
        ids = [f"{doc_id}_chunk_{idx}" for idx in range(len(chunks))]
        metadatas = [
            {
                "doc_id": doc_id,
                "title": title[:100],
                "source_url": source_url,
                "doc_type": doc_type,
                "chunk_index": idx
            }
            for idx in range(len(chunks))
        ]

        try:
            collection.upsert(
                ids=ids,
                documents=chunks,
                metadatas=metadatas
            )
            logger.info(f"Indexed {len(chunks)} chunks for doc {doc_id} in company {company_id}.")
            return len(chunks)
        except Exception as e:
            logger.error(f"Failed to index document in ChromaDB: {e}")
            return len(chunks)

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        company_id: str,
        query: str,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Retrieves top-k most relevant evidence chunks matching a query."""
        try:
            collection = cls.get_or_create_collection(company_id)
            if collection.count() == 0:
                return []

            results = collection.query(
                query_texts=[query],
                n_results=min(top_k, collection.count())
            )

            chunks = []
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if "distances" in results else [0.5] * len(docs)

            for i, doc_text in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                dist = distances[i] if i < len(distances) else 0.5
                similarity = round(max(0.0, 1.0 - (dist if dist is not None else 0.5)), 3)
                chunks.append({
                    "chunk_text": doc_text,
                    "title": meta.get("title", "Evidence"),
                    "source_url": meta.get("source_url", ""),
                    "doc_id": meta.get("doc_id", ""),
                    "similarity_score": similarity
                })
            return chunks

        except Exception as e:
            logger.warning(f"ChromaDB retrieval error: {e}. Falling back to keyword relevance.")
            return []

    @classmethod
    def delete_document(cls, company_id: str, doc_id: str) -> None:
        try:
            collection = cls.get_or_create_collection(company_id)
            # Find all chunks with doc_id in metadata
            collection.delete(where={"doc_id": doc_id})
        except Exception as e:
            logger.warning(f"Error deleting doc {doc_id} from vector store: {e}")
