from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    filename: str
    file_type: str
    file_path: str
    file_size_bytes: int
    chunk_count: int
    status: str
    summary: Optional[str] = None
    uploaded_at: datetime
    created_at: datetime
