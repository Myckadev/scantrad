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
import logging
from app.script_for_app import process_image

# Setup logger
logger = logging.getLogger("uvicorn.error")

# Import transformer module
try:
    #from app.script_for_app import *
    logger.info("Module de transformation importé")
except ImportError:
    logger.warning("Fallback: fonction de transformation non trouvée")

app = FastAPI()

# CORS config — retirez '*' en production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://urban-goggles-vw9vq5w6g5x245-3000.app.github.dev",
        "https://urban-goggles-vw9vq5w6g5x245-3001.app.github.dev", 
        "https://urban-goggles-vw9vq5w6g5x245-5173.app.github.dev",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.mongodb = app.mongodb_client["scantrad_db"]
    # Create indexes
    await app.mongodb.users.create_index("pseudo", unique=True)
    await app.mongodb.batches.create_index("user_id")
    await app.mongodb.pages.create_index([("batch_id", 1), ("page_id", 1)])
    await app.mongodb.pages.create_index("page_id", unique=True)
    await app.mongodb.translated_pages.create_index([("user_id", 1), ("batch_id", 1)])
    await app.mongodb.translated_pages.create_index("page_id", unique=True)
    logger.info("MongoDB connecté et indexes créés")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

async def get_user_by_pseudo(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        new_user = {"_id": str(uuid.uuid4()), "pseudo": pseudo, "created_at": datetime.utcnow()}
        await app.mongodb.users.insert_one(new_user)
        return new_user
    return user

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)
        logger.info(f"WebSocket connected: {ws.client}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)
            logger.info(f"WebSocket disconnected: {ws.client}")

    async def broadcast(self, message: str):
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception as e:
                logger.warning(f"WebSocket disconnected or failed during broadcast: {e}")
                disconnected.append(conn)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()

@app.post("/auth/login")
async def login(request: LoginRequest):
    if not request.pseudo or len(request.pseudo) < 2:
        raise HTTPException(status_code=400, detail="Pseudo doit faire au moins 2 caractères")
    user = await get_user_by_pseudo(request.pseudo.strip())
    return LoginResponse(pseudo=user["pseudo"], message="Login successful")

@app.post("/upload-batch", response_model=UploadBatchResponse)
async def upload_batch(
    background_tasks: BackgroundTasks,
    request: UploadBatchRequest,
    x_user_pseudo: Optional[str] = Header(None)
):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="Header X-User-Pseudo requis")
    user = await get_user_by_pseudo(x_user_pseudo)

    batch_id = str(uuid.uuid4())
    page_to_process: List[PageInitial] = []

    for page_request in request.pages:
        page_id = str(uuid.uuid4())
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
        page_to_process.append(page_data)

        page_dict = page_data.dict()
        page_dict["_id"] = page_dict["page_id"]
        await app.mongodb.pages.insert_one(page_dict)

    batch = Batch(id=batch_id, user_id=user["_id"],
                  pages_ids=[p.page_id for p in page_to_process],
                  created_at=datetime.utcnow(), status="processing")
    batch_dict = batch.dict()
    batch_dict["_id"] = batch_dict.pop("id")
    await app.mongodb.batches.insert_one(batch_dict)

    #background_tasks.add_task(transform_processing, batch_id, user["_id"], page_to_process)
    await transform_processing(batch_id, user["_id"], page_to_process)
    logger.info(f"Batch {batch_id} queued for processing")
    return UploadBatchResponse(batchId=batch_id)

async def transform_processing(batch_id: str, user_id: str, pages: List[PageInitial]):
    logger.info(f"Traitement du batch {batch_id} démarré")
    batch = await app.mongodb.batches.find_one({"_id": batch_id})
    if not batch:
        return
    for page_data in pages:
        page_id = page_data.page_id
        page = await app.mongodb.pages.find_one({"_id": page_id})
        print("page-id" + page_id)
        if not page:
            print('je suis dehors')
            continue
        print("y'a match")

        print("j'ai atttendu")
        await app.mongodb.pages.update_one({"_id": page_id}, {"$set": {"status": "processing"}})
        await manager.broadcast(f"Page {page['filename']} is processing")

        try:
            image_input = base64.b64decode(page['original_image'])
            image_data = Image.open(io.BytesIO(image_input)).convert("RGB")
            translated_image = process_image(image_data)
            buffer = io.BytesIO()
            translated_image.save(buffer, format="PNG")
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            translated_url = f"data:image/png;base64,{img_base64}"

            await app.mongodb.pages.update_one(
                {"_id": page_id},
                {"$set": {
                    "status": "done",
                    "translated_image": img_base64,
                    "translated_url": translated_url
                }}
            )
            translated_page = {
                "_id": str(uuid.uuid4()),
                "page_id": page_id,
                "user_id": user_id,
                "batch_id": batch_id,
                "filename": page["filename"],
                "original_image": page["original_image"],
                "translated_image": img_base64,
                "original_url": page["original_url"],
                "translated_url": translated_url,
                "translation_completed_at": datetime.utcnow(),
                "processing_time_seconds": 3
            }
            await app.mongodb.translated_pages.insert_one(translated_page)
            await manager.broadcast(f"Page {page['filename']} is done")
        except Exception as e:
            logger.error(f"Erreur sur la page {page['filename']}: {e}")
            await app.mongodb.pages.update_one(
                {"_id": page_id},
                {"$set": {"status": "error", "error_message": str(e)}}
            )
            await manager.broadcast(f"Page {page['filename']} failed: {str(e)}")

    await app.mongodb.batches.update_one({"_id": batch_id}, {"$set": {"status": "completed"}})

@app.get("/result/{batch_id}")
async def get_result(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo requis")
    user = await app.mongodb.users.find_one({"pseudo": x_user_pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    batch = await app.mongodb.batches.find_one({"_id": batch_id, "user_id": user["_id"]})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch non trouvé")

    page_ids = batch.get("pages_ids", [])
    pages = await app.mongodb.pages.find({"_id": {"$in": page_ids}}).to_list(len(page_ids))
    return {"pages": pages}

@app.get("/user/{pseudo}/batches")
async def get_user_batches(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    batches = await app.mongodb.batches.find({"user_id": user["_id"]}).to_list(100)
    result = []

    for batch in batches:
        page_ids = batch.get("pages_ids", [])
        pages = await app.mongodb.pages.find({"_id": {"$in": page_ids}}).to_list(len(page_ids))
        statuses = [p.get("status", "pending") for p in pages]

        if statuses:
            if all(s == "done" for s in statuses):
                status = "done"
            elif any(s in ("processing","done") for s in statuses):
                status = "processing"
            else:
                status = "pending"
        else:
            status = batch.get("status", "pending")

        result.append({
            "_id": batch["_id"],
            "user_id": batch["user_id"],
            "pages_ids": page_ids,
            "created_at": batch["created_at"],
            "status": status,
            "pages": [{"status": s} for s in statuses]
        })

    return {"batches": result}

@app.get("/user/{pseudo}/translated-pages", response_model=TranslatedPagesResponse)
async def get_user_translated_pages(pseudo: str):
    user = await app.mongodb.users.find_one({"pseudo": pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    translated = await app.mongodb.translated_pages.find(
        {"user_id": user["_id"]}
    ).sort("translation_completed_at", -1).to_list(100)

    pages = []
    for data in translated:
        data["id"] = data.pop("_id")
        pages.append(TranslatedPage(**data))
    return TranslatedPagesResponse(translated_pages=pages)

@app.get("/batch/{batch_id}/translated-pages")
async def get_batch_translated_pages(batch_id: str, x_user_pseudo: Optional[str] = Header(None)):
    if not x_user_pseudo:
        raise HTTPException(status_code=401, detail="User pseudo requis")
    user = await app.mongodb.users.find_one({"pseudo": x_user_pseudo})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    translated = await app.mongodb.translated_pages.find(
        {"batch_id": batch_id, "user_id": user["_id"]}
    ).sort("translation_completed_at", 1).to_list(100)
    return {"translated_pages": translated}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(ws)
