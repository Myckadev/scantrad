from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[str] = None
    pseudo: str
    created_at: Optional[datetime] = None

class PageInitial(BaseModel):
    page_id: str
    batch_id: str  # Référence à Batch._id
    filename: str
    status: str  # pending, processing, done
    original_image: Optional[str] = None  # base64
    translated_image: Optional[str] = None  # base64
    original_url: Optional[str] = None
    translated_url: Optional[str] = None

# Alias pour la compatibilité
PageData = PageInitial

class Batch(BaseModel):
    id: Optional[str] = None
    user_id: str
    pages_ids: List[str]  # ← Revenir à pages_ids pour correspondre à votre implémentation
    created_at: Optional[datetime] = None
    status: str = "pending"

class TranslatedPage(BaseModel):
    id: Optional[str] = None
    page_id: str  # Référence à PageData.page_id
    user_id: str  # Référence à User._id
    batch_id: str  # Référence à Batch._id
    filename: str
    original_image: str  # base64
    translated_image: str  # base64
    original_url: str
    translated_url: str

# Modèles pour les requêtes API
class LoginRequest(BaseModel):
    pseudo: str

class LoginResponse(BaseModel):
    pseudo: str
    message: str

class UploadBatchResponse(BaseModel):
    batchId: str

class StatusResponse(BaseModel):
    pages: List[PageData]

class UserBatchesResponse(BaseModel):
    batches: List[Batch]

class TranslatedPagesResponse(BaseModel):
    translated_pages: List[TranslatedPage]

class PageUploadRequest(BaseModel):
    filename: str
    image_base64: str  # Image déjà encodée en base64

class UploadBatchRequest(BaseModel):
    pages: List[PageUploadRequest]