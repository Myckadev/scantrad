MOCK_BATCH_STATUS = {
    "pages": [
        {"filename": "page1.jpg", "status": "done"},
        {"filename": "page2.jpg", "status": "processing"},
        {"filename": "page3.jpg", "status": "pending"},
    ]
}

MOCK_BATCH_RESULT = {
    "pages": [
        {"filename": "page1.jpg", "url": "https://via.placeholder.com/300x400?text=Page+1"},
        {"filename": "page2.jpg", "url": "https://via.placeholder.com/300x400?text=Page+2"},
        {"filename": "page3.jpg", "url": "https://via.placeholder.com/300x400?text=Page+3"},
    ]
}

MOCK_UPLOAD_BATCH_RESPONSE = {
    "batchId": "mock-batch-123"
}
