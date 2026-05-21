import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # PostgreSQL
    DATABASE_URL: str
    
    # Cloudinary (file storage — photos, resumes, logos)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # JWT Auth
    SECRET_KEY: str = "placeholder_secret"
    JWT_SECRET_KEY: str = "placeholder_jwt"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # Gmail SMTP
    GMAIL_SENDER_EMAIL: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    
    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8001"
    
    # Neo4j
    NEO4J_URI: Optional[str] = None
    NEO4J_USER: Optional[str] = None
    NEO4J_PASSWORD: Optional[str] = None
    
    # VIT Pune branches
    VIT_BRANCHES: list = ["AIDS", "CSE", "CSE(AI)", "CSE(AIML)", "CSE(DS)", "CSE(IOT_CYBER)", "CSE(SE)", "DESH", "ENTC", "INSTRU", "IT", "MECH"]
    VIT_YEARS: list = [1, 2, 3, 4]

settings = Settings()