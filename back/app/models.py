from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[str] = None
    pseudo: str
    created_at: Optional[datetime] = None

class PageData(BaseModel):
    filename: str
    status: str
    original_url: Optional[str] = None
    translated_url: Optional[str] = None

class Batch(BaseModel):
    id: Optional[str] = None
    user_pseudo: str
    pages: List[PageData]
    created_at: Optional[datetime] = None
    status: str = "pending"
