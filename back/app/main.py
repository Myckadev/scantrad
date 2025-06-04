from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from .mock_data import MOCK_BATCH_STATUS, MOCK_BATCH_RESULT, MOCK_UPLOAD_BATCH_RESPONSE
from .models import User, Batch, PageData
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import base64
import io
from PIL import Image
import asyncio

app = FastAPI()

# CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.mongodb = app.mongodb_client["scantrad_db"]
    
    # Forcer la création des collections
    await app.mongodb.users.create_index("pseudo", unique=True)
    await app.mongodb.batches.create_index("user_pseudo")
    print("✅ MongoDB connected and collections initialized")

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
async def login(pseudo: str):
    if not pseudo or len(pseudo.strip()) < 2:
        raise HTTPException(status_code=400, detail="Pseudo must be at least 2 characters")
    
    user = await get_user_by_pseudo(pseudo.strip())
    return {"pseudo": user["pseudo"], "message": "Login successful"}

@app.post("/upload-batch")
async def upload_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...), 
    x_user_pseudo: Optional[str] = Header(None)
):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required in X-User-Pseudo header")
    
    user = await get_user_by_pseudo(x_user_pseudo)
    batch_id = str(uuid.uuid4())
    pages = []
    
    for file in files:
        # Convertir l'image en base64 pour stockage
        image_content = await file.read()
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        page_data = {
            "filename": file.filename,
            "status": "pending",
            "original_image": image_base64,
            "translated_image": None,
            "original_url": f"data:image/jpeg;base64,{image_base64}",
            "translated_url": None
        }
        pages.append(page_data)
    
    batch = {
        "_id": batch_id,
        "user_pseudo": x_user_pseudo,
        "pages": pages,
        "created_at": datetime.utcnow(),
        "status": "processing"
    }
    
    await app.mongodb.batches.insert_one(batch)
    
    # Lancer le traitement en arrière-plan
    background_tasks.add_task(simulate_processing, batch_id)
    
    return {"batchId": batch_id}

async def simulate_processing(batch_id: str):
    """Simule le traitement de traduction en changeant progressivement les statuts"""
    batch = await app.mongodb.batches.find_one({"_id": batch_id})
    if not batch:
        return
    
    # Traiter chaque page avec délai
    for i, page in enumerate(batch["pages"]):
        # Attendre 3 secondes avant de commencer le traitement
        await asyncio.sleep(3)
        
        # Changer le statut à "processing"
        page["status"] = "processing"
        await app.mongodb.batches.update_one(
            {"_id": batch_id},
            {"$set": {f"pages.{i}": page}}
        )
        
        # Broadcaster l'update via WebSocket
        await manager.broadcast(f"Page {page['filename']} is processing")
        
        # Attendre 5 secondes pour simuler le traitement
        await asyncio.sleep(5)
        
        # Simuler la traduction (pour l'instant, on copie l'image originale)
        page["status"] = "done"
        page["translated_image"] = page["original_image"]  # Copie temporaire
        page["translated_url"] = f"data:image/jpeg;base64,{page['original_image']}"
        
        await app.mongodb.batches.update_one(
            {"_id": batch_id},
            {"$set": {f"pages.{i}": page}}
        )
        
        # Broadcaster l'update via WebSocket
        await manager.broadcast(f"Page {page['filename']} is done")

@app.get("/status/{batch_id}")
async def get_status(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required")
    
    batch = await app.mongodb.batches.find_one({"_id": batch_id, "user_pseudo": x_user_pseudo})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # S'assurer que les URLs base64 sont bien formées
    for page in batch["pages"]:
        if page.get("original_image") and not page.get("original_url"):
            page["original_url"] = f"data:image/jpeg;base64,{page['original_image']}"
        if page.get("translated_image") and not page.get("translated_url"):
            page["translated_url"] = f"data:image/jpeg;base64,{page['translated_image']}"
    
    return {"pages": batch["pages"]}

@app.get("/result/{batch_id}")
async def get_result(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo required")
    
    batch = await app.mongodb.batches.find_one({"_id": batch_id, "user_pseudo": x_user_pseudo})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # S'assurer que toutes les images traduites sont disponibles
    for page in batch["pages"]:
        if page["status"] == "done":
            if page.get("original_image") and not page.get("original_url"):
                page["original_url"] = f"data:image/jpeg;base64,{page['original_image']}"
            if page.get("translated_image") and not page.get("translated_url"):
                page["translated_url"] = f"data:image/jpeg;base64,{page['translated_image']}"
    
    return {"pages": batch["pages"]}

@app.get("/user/{pseudo}/batches")
async def get_user_batches(pseudo: str):
    batches = await app.mongodb.batches.find({"user_pseudo": pseudo}).to_list(100)
    return {"batches": batches}

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

@app.get("/debug/db-status")
async def debug_db_status():
    """Endpoint pour vérifier le contenu de la base"""
    try:
        # Test de connexion
        await app.mongodb_client.admin.command('ping')        
        users_count = await app.mongodb.users.count_documents({})
        batches_count = await app.mongodb.batches.count_documents({})
        
        # Lister toutes les collections
        collections = await app.mongodb.list_collection_names()
        
        # Récupérer quelques exemples
        recent_users = []
        recent_batches = []
        
        if users_count > 0:
            recent_users = await app.mongodb.users.find({}).sort("created_at", -1).limit(3).to_list(3)
        
        if batches_count > 0:
            recent_batches = await app.mongodb.batches.find({}).sort("created_at", -1).limit(3).to_list(3)
        
        return {
            "status": "✅ Connected",
            "database": "scantrad_db",
            "collections": collections,
            "counts": {
                "users": users_count,
                "batches": batches_count
            },
            "recent_users": [{"pseudo": u["pseudo"], "created_at": u["created_at"]} for u in recent_users],
            "recent_batches": [{"id": b["_id"], "user": b["user_pseudo"], "pages": len(b["pages"])} for b in recent_batches],
            "mongo_url": MONGO_URL
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e),
            "mongo_url": MONGO_URL
        }
