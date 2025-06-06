from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from .mock_data import MOCK_BATCH_STATUS, MOCK_BATCH_RESULT, MOCK_UPLOAD_BATCH_RESPONSE
from .models import (
    User, Batch, PageInitial, TranslatedPage,
    LoginRequest, LoginResponse, 
    UploadBatchResponse, StatusResponse,
    UserBatchesResponse, TranslatedPagesResponse,
    PageUploadRequest, UploadBatchRequest,
    PageData
)

from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import base64
import io
from PIL import Image
import asyncio
# Importation des modules de transformation - VERSION SIMPLIFIÉE pour Docker
import sys
import os
from pathlib import Path

# Correction : ajouter le parent du dossier courant (/app) et /app/transformer dans le sys.path
base_dir = str(Path(__file__).resolve().parent.parent)  # /app
transformer_dir = os.path.join(base_dir, "transformer") # /app/transformer

#afficher les chemins pour le débogage
print(f"Base directory: {base_dir}")
print(f"Transformer directory: {transformer_dir}")

for p in [base_dir, transformer_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

transformer_imported = False
try:
    from transformer.herlpers.script_for_app import process_image
    print(f"Module de transformation importé depuis: {transformer_dir}")
    transformer_imported = True
except ImportError as e:
    print(f"Erreur import transformer: {e}")

if not transformer_imported:
    print("Impossible d'importer le module de transformation, utilisation du fallback")
    #afficher les chemins pour le débogage
    print(f"Base directory: {base_dir}")
    print(f"Transformer directory: {transformer_dir}")
    # Fonction de fallback qui renvoie juste l'image originale
    def process_image(input_image):
        print("Utilisation de la fonction de fallback - aucune transformation appliquée")
        return input_image

app = FastAPI()

# CORS pour le frontend - Configuration corrigée pour Codespaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://urban-goggles-vw9vq5w6g5x245-3000.app.github.dev",
        "https://urban-goggles-vw9vq5w6g5x245-3001.app.github.dev", 
        "https://urban-goggles-vw9vq5w6g5x245-5173.app.github.dev",
        "http://localhost:3000",
        "http://localhost:5173",
        "*"  # Fallback permissif pour le développement
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.mongodb = app.mongodb_client["scantrad_db"]
    
    # Forcer la création des collections avec indexes
    await app.mongodb.users.create_index("pseudo", unique=True)
    await app.mongodb.batches.create_index("user_id")
    await app.mongodb.pages.create_index([("batch_id", 1), ("page_id", 1)])
    await app.mongodb.pages.create_index("page_id", unique=True)
    await app.mongodb.translated_pages.create_index([("user_id", 1), ("batch_id", 1)])
    await app.mongodb.translated_pages.create_index("page_id", unique=True)
    print("MongoDB connected and collections initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Authentication helper
async def get_user_by_pseudo(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        # Create user if doesn't exist
        new_user = {
            "_id": str(uuid.uuid4()),
            "pseudo": pseudo,
            "created_at": datetime.utcnow()
        }
        await app.mongodb.users.insert_one(new_user)

        return new_user 
    return user

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.post("/auth/login")
async def login(request: LoginRequest):
    if not request.pseudo or len(request.pseudo) < 2:
        raise HTTPException(status_code=400, detail="Pseudo must be at least 2 characters")
    
    user = await get_user_by_pseudo(request.pseudo.strip())
    return LoginResponse(pseudo=user["pseudo"], message="Login successful")


@app.post("/upload-batch", response_model=UploadBatchResponse)
async def upload_batch(
    background_tasks: BackgroundTasks,
    request: UploadBatchRequest,  
    x_user_pseudo: Optional[str] = Header(None)
):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required in X-User-Pseudo header")

    user = await get_user_by_pseudo(x_user_pseudo)
    batch_id = str(uuid.uuid4())
    page_ids = []
    
    # Créer chaque page séparément dans la collection pages
    for page_request in request.pages:  
        page_id = str(uuid.uuid4())
        
        # Créer la page avec le nouveau modèle PageInitial
        page_data = PageInitial(
            page_id=page_id,
            batch_id=batch_id,
            filename=page_request.filename,
            status="pending",
            original_image=page_request.image_base64,
            translated_image=None,
            original_url=f"data:image/jpeg;base64,{page_request.image_base64}",
            translated_url=None
        )
        
        # Sauvegarder la page dans la collection pages
        page_dict = page_data.dict()
        page_dict["_id"] = page_id
        await app.mongodb.pages.insert_one(page_dict)
        
        page_ids.append(page_id)
    
    # Créer le batch avec les IDs des pages
    batch = Batch(
        id=batch_id,
        user_id=user["_id"],
        pages_ids=page_ids,
        created_at=datetime.utcnow(),
        status="processing"
    )
    
    # Sauvegarder le batch
    batch_dict = batch.dict()
    batch_dict["_id"] = batch_dict.pop("id")
    await app.mongodb.batches.insert_one(batch_dict)
    
    background_tasks.add_task(transform_processing, batch_id, user["_id"])
    
    return UploadBatchResponse(batchId=batch_id)

async def transform_processing(batch_id: str, user_id: str):
    """Traitement réel des images avec le modèle YOLO et traduction"""
    batch = await app.mongodb.batches.find_one({"_id": batch_id})
    if not batch:
        return
    
    # Traiter chaque page par son ID
    for page_id in batch.get("pages_ids", []):
        # Récupérer la page
        page = await app.mongodb.pages.find_one({"_id": page_id})
        if not page:
            continue
            
        # Attendre 5 seconde avant de commencer le traitement
        await asyncio.sleep(5)
        
        # Changer le statut à "processing"
        await app.mongodb.pages.update_one(
            {"_id": page_id},
            {"$set": {"status": "processing"}}
        )
        
        # Broadcaster l'update via WebSocket
        await manager.broadcast(f"Page {page['filename']} is processing")
        
        try:
            # Décoder l'image base64
            image_data = base64.b64decode(page['original_image'])
            original_image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Traitement réel avec le modèle
            translated_image = process_image(original_image)
            
            # Convertir l'image traduite en base64
            buffer = io.BytesIO()
            translated_image.save(buffer, format="PNG")
            translated_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            translated_url = f"data:image/png;base64,{translated_base64}"
            
            # Mettre à jour la page avec la traduction
            await app.mongodb.pages.update_one(
                {"_id": page_id},
                {"$set": {
                    "status": "done",
                    "translated_image": translated_base64,
                    "translated_url": translated_url
                }}
            )
            
            # Sauvegarder la page traduite dans une collection séparée
            translated_page = {
                "_id": str(uuid.uuid4()),
                "page_id": page_id,
                "user_id": user_id,
                "batch_id": batch_id,
                "filename": page["filename"],
                "original_image": page["original_image"],
                "translated_image": translated_base64,
                "original_url": page["original_url"],
                "translated_url": translated_url,
                "translation_completed_at": datetime.utcnow(),
                "processing_time_seconds": 3
            }
            
            await app.mongodb.translated_pages.insert_one(translated_page)
            
            # Broadcaster l'update via WebSocket
            await manager.broadcast(f"Page {page['filename']} is done")
            
        except Exception as e:
            # En cas d'erreur, marquer la page comme échouée
            await app.mongodb.pages.update_one(
                {"_id": page_id},
                {"$set": {"status": "error", "error_message": str(e)}}
            )
            await manager.broadcast(f"Page {page['filename']} failed: {str(e)}")
    
    # Mettre à jour le statut du batch à "completed"
    await app.mongodb.batches.update_one(
        {"_id": batch_id},
        {"$set": {"status": "completed"}}
    )

@app.get("/result/{batch_id}")
async def get_result(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required")
    
    user = await app.mongodb.users.find_one({"pseudo": x_user_pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    batch = await app.mongodb.batches.find_one({"_id": batch_id, "user_id": user["_id"]})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Récupérer toutes les pages du batch
    pages = []
    for page_id in batch.get("pages_ids", []):
        page = await app.mongodb.pages.find_one({"_id": page_id})
        if page:
            pages.append(page)
    
    return {"pages": pages}

@app.get("/user/{pseudo}/batches")
async def get_user_batches(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    batches_data = await app.mongodb.batches.find({"user_id": user["_id"]}).to_list(100)
    
    # Garder _id tel quel et ajouter les pages pour le calcul du statut
    batches = []
    for batch_data in batches_data:
        # Récupérer les pages pour calculer le statut
        pages = []
        for page_id in batch_data.get("pages_ids", []):
            page = await app.mongodb.pages.find_one({"_id": page_id})
            if page:
                pages.append({
                    "status": page.get("status", "pending")
                })
        
        # Calculer le statut global du batch
        if pages:
            if all(p["status"] == "done" for p in pages):
                batch_status = "done"
            elif any(p["status"] in ["processing", "done"] for p in pages):
                batch_status = "processing"
            else:
                batch_status = "pending"
        else:
            batch_status = batch_data.get("status", "pending")
        
        batches.append({
            "_id": batch_data["_id"],
            "user_id": batch_data["user_id"],
            "pages_ids": batch_data.get("pages_ids", []),
            "created_at": batch_data["created_at"],
            "status": batch_status,
            "pages": pages
        })
    
    return {"batches": batches}

@app.get("/user/{pseudo}/translated-pages", response_model=TranslatedPagesResponse)
async def get_user_translated_pages(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    translated_data = await app.mongodb.translated_pages.find({"user_id": user["_id"]}).sort("translation_completed_at", -1).to_list(100)
    
    # Convertir en modèles Pydantic
    translated_pages = []
    for data in translated_data:
        data["id"] = data.pop("_id")  # Convertir _id en id
        translated_pages.append(TranslatedPage(**data))
    
    return TranslatedPagesResponse(translated_pages=translated_pages)

@app.get("/batch/{batch_id}/translated-pages")
async def get_batch_translated_pages(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    """Récupérer toutes les pages traduites d'un batch spécifique"""
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required")
    
    user = await app.mongodb.users.find_one({"pseudo": x_user_pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    translated_pages = await app.mongodb.translated_pages.find({
        "batch_id": batch_id, 
        "user_id": user["_id"]
    }).sort("translation_completed_at", 1).to_list(100)
    
    return {"translated_pages": translated_pages}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

