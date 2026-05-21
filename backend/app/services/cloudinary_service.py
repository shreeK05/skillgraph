"""
Cloudinary service for SkillGraph file uploads.
Handles profile photos, resumes, company logos, certificates.
"""
import cloudinary
import cloudinary.uploader
from app.core.config import settings
from typing import Optional

# Initialize once at import
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME or "",
    api_key=settings.CLOUDINARY_API_KEY or "",
    api_secret=settings.CLOUDINARY_API_SECRET or "",
    secure=True,
)


def _configured() -> bool:
    return bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY)


def upload_photo(file_bytes: bytes, user_id: str) -> Optional[str]:
    """Upload profile photo → returns secure URL or None."""
    if not _configured():
        print("[Cloudinary] Not configured – skipping photo upload")
        return None
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="skillgraph/photos",
            public_id=f"user_{user_id}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"},
            ],
        )
        return result["secure_url"]
    except Exception as e:
        print(f"[Cloudinary] Photo upload error: {e}")
        return None


def upload_resume(file_bytes: bytes, user_id: str) -> Optional[str]:
    """Upload resume PDF → returns secure URL or None."""
    if not _configured():
        print("[Cloudinary] Not configured – skipping resume upload")
        return None
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="skillgraph/resumes",
            public_id=f"resume_{user_id}",
            overwrite=True,
            resource_type="raw",
            format="pdf",
        )
        return result["secure_url"]
    except Exception as e:
        print(f"[Cloudinary] Resume upload error: {e}")
        return None


def upload_logo(file_bytes: bytes, company_id: str) -> Optional[str]:
    """Upload company logo → returns secure URL or None."""
    if not _configured():
        return None
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="skillgraph/logos",
            public_id=f"company_{company_id}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": 300, "height": 300, "crop": "fit"},
                {"quality": "auto"},
            ],
        )
        return result["secure_url"]
    except Exception as e:
        print(f"[Cloudinary] Logo upload error: {e}")
        return None


def upload_certificate(file_bytes: bytes, student_id: str, cert_id: str) -> Optional[str]:
    """Upload certificate image/PDF → returns secure URL or None."""
    if not _configured():
        return None
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="skillgraph/certificates",
            public_id=f"cert_{student_id}_{cert_id}",
            overwrite=True,
            resource_type="auto",
        )
        return result["secure_url"]
    except Exception as e:
        print(f"[Cloudinary] Certificate upload error: {e}")
        return None
