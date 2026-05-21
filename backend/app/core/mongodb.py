# file: backend/app/core/mongodb.py
"""
MongoDB Atlas client for file storage (profile photos, resume PDFs, syllabus PDFs).
Uses GridFS for binary file storage.
"""
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.core.config import settings
import gridfs
import io
from typing import Optional

_client: Optional[MongoClient] = None
_db = None
_fs = None

def get_mongo_client():
    global _client
    if _client is None:
        try:
            _client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            _client.admin.command('ping')
            print("MongoDB Atlas connected successfully")
        except ConnectionFailure as e:
            print(f"MongoDB connection failed: {e}. File storage will be unavailable.")
            _client = None
    return _client

def get_db():
    global _db
    client = get_mongo_client()
    if client is None:
        return None
    if _db is None:
        _db = client[settings.MONGODB_DB_NAME]
    return _db

def get_gridfs():
    global _fs
    db = get_db()
    if db is None:
        return None
    if _fs is None:
        _fs = gridfs.GridFS(db)
    return _fs

def upload_file(file_bytes: bytes, filename: str, content_type: str, metadata: dict = None) -> Optional[str]:
    """Upload a file to MongoDB GridFS. Returns file_id string or None on failure."""
    fs = get_gridfs()
    if fs is None:
        return None
    try:
        file_id = fs.put(
            io.BytesIO(file_bytes),
            filename=filename,
            content_type=content_type,
            metadata=metadata or {}
        )
        return str(file_id)
    except Exception as e:
        print(f"GridFS upload error: {e}")
        return None

def download_file(file_id_str: str) -> Optional[tuple[bytes, str]]:
    """Download a file from GridFS. Returns (bytes, content_type) or None."""
    import bson
    fs = get_gridfs()
    if fs is None:
        return None
    try:
        file_id = bson.ObjectId(file_id_str)
        grid_out = fs.get(file_id)
        return grid_out.read(), grid_out.content_type
    except Exception as e:
        print(f"GridFS download error: {e}")
        return None

def delete_file(file_id_str: str) -> bool:
    """Delete a file from GridFS."""
    import bson
    fs = get_gridfs()
    if fs is None:
        return False
    try:
        file_id = bson.ObjectId(file_id_str)
        fs.delete(file_id)
        return True
    except Exception as e:
        print(f"GridFS delete error: {e}")
        return False
