# file: backend/app/api/routes/auth.py
import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.models.user import User
from app.models.student import StudentProfile
from app.models.college import College
from app.services.email_service import send_otp_email, send_welcome_email
from app.middleware.tenant import get_current_user

router = APIRouter()

# In-memory OTP store (replace with Redis in production)
_otp_store: dict = {}  # email -> {otp, expires_at}

VIT_PUNE_SUBDOMAIN = "vitpune"


def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def _get_or_create_vit_pune(db: Session) -> College:
    college = db.query(College).filter(College.subdomain == VIT_PUNE_SUBDOMAIN).first()
    if not college:
        college = College(name="VIT Pune", subdomain=VIT_PUNE_SUBDOMAIN)
        db.add(college)
        db.commit()
        db.refresh(college)
    return college


# ---- Request/Response Models ----

class StudentRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    branch: str
    year_of_study: int
    prn: Optional[str] = None

class CompanyRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str  # contact person name
    company_name: str
    industry: Optional[str] = None
    website: Optional[str] = None

class DeptAdminRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    admin_code: str  # simple shared code to prevent random signups

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str  # STUDENT, DEPT_ADMIN, COMPANY

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str

class RefreshRequest(BaseModel):
    refresh_token: str


# ---- Routes ----

@router.post("/register/student", status_code=201)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    college = _get_or_create_vit_pune(db)
    
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    
    if req.branch not in settings.VIT_BRANCHES:
        raise HTTPException(400, f"Invalid branch. Must be one of: {settings.VIT_BRANCHES}")
    
    if req.year_of_study not in settings.VIT_YEARS:
        raise HTTPException(400, "Invalid year. Must be 1, 2, 3, or 4")
    
    hashed_pwd = get_password_hash(req.password)
    user = User(
        email=req.email,
        hashed_password=hashed_pwd,
        full_name=req.full_name,
        role="STUDENT",
        tenant_id=college.id,
        email_verified=False,
        is_approved=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create student profile
    profile = StudentProfile(
        user_id=user.id,
        tenant_id=college.id,
        full_name=req.full_name,
        branch=req.branch,
        year_of_study=req.year_of_study,
        prn=req.prn,
        graduation_year=2025 + (4 - req.year_of_study)
    )
    db.add(profile)
    db.commit()
    
    # Send OTP
    otp = _generate_otp()
    _otp_store[req.email] = {"otp": otp, "expires_at": datetime.utcnow() + timedelta(minutes=10)}
    send_otp_email(req.email, otp, req.full_name)
    
    return {"message": "Registration successful. Please verify your email.", "user_id": str(user.id)}


@router.post("/register/company", status_code=201)
def register_company(req: CompanyRegisterRequest, db: Session = Depends(get_db)):
    college = _get_or_create_vit_pune(db)
    
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    
    hashed_pwd = get_password_hash(req.password)
    user = User(
        email=req.email,
        hashed_password=hashed_pwd,
        full_name=req.full_name,
        role="COMPANY",
        tenant_id=college.id,
        email_verified=False,
        is_approved=True  # self-registered, auto-approved
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create company profile
    from app.models.company import CompanyProfile
    cp = CompanyProfile(
        user_id=user.id,
        name=req.company_name,
        industry=req.industry,
        website=req.website
    )
    db.add(cp)
    db.commit()
    
    otp = _generate_otp()
    _otp_store[req.email] = {"otp": otp, "expires_at": datetime.utcnow() + timedelta(minutes=10)}
    send_otp_email(req.email, otp, req.full_name)
    
    return {"message": "Company registered. Please verify your email.", "user_id": str(user.id)}


@router.post("/register/dept", status_code=201)
def register_dept_admin(req: DeptAdminRegisterRequest, db: Session = Depends(get_db)):
    # Simple admin code check
    if req.admin_code != "VITPUNE2025":
        raise HTTPException(403, "Invalid admin registration code")
    
    college = _get_or_create_vit_pune(db)
    
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    
    hashed_pwd = get_password_hash(req.password)
    user = User(
        email=req.email,
        hashed_password=hashed_pwd,
        full_name=req.full_name,
        role="DEPT_ADMIN",
        tenant_id=college.id,
        email_verified=True,  # dept admins skip OTP
        is_approved=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    send_welcome_email(req.email, req.full_name, "DEPT_ADMIN")
    return {"message": "Department admin registered successfully.", "user_id": str(user.id)}


@router.post("/verify-otp")
def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    stored = _otp_store.get(req.email)
    if not stored:
        raise HTTPException(400, "No OTP found for this email. Please register again.")
    if datetime.utcnow() > stored["expires_at"]:
        del _otp_store[req.email]
        raise HTTPException(400, "OTP has expired. Please request a new one.")
    if stored["otp"] != req.otp:
        raise HTTPException(400, "Incorrect OTP")
    
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    user.email_verified = True
    db.commit()
    del _otp_store[req.email]
    
    send_welcome_email(req.email, user.full_name or "User", user.role)
    
    access_token = create_access_token(subject=str(user.id), role=user.role, tenant_id=str(user.tenant_id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return {"message": "Email verified!", "access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "role": user.role, "full_name": user.full_name}


@router.post("/resend-otp")
def resend_otp(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    otp = _generate_otp()
    _otp_store[email] = {"otp": otp, "expires_at": datetime.utcnow() + timedelta(minutes=10)}
    send_otp_email(email, otp, user.full_name or "User")
    return {"message": "OTP resent"}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.role == req.role).first()
    if not user:
        raise HTTPException(401, "Invalid email or role")
    if not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Incorrect password")
    if not user.is_active:
        raise HTTPException(403, "Account is deactivated")
    if not user.email_verified:
        raise HTTPException(403, "Please verify your email first")
    
    access_token = create_access_token(subject=str(user.id), role=user.role, tenant_id=str(user.tenant_id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "user_id": str(user.id),
        "avatar_url": user.avatar_url
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "email_verified": current_user.email_verified,
    }
    if current_user.role == "STUDENT":
        from app.models.student import StudentProfile
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile:
            data["branch"] = profile.branch
            data["year_of_study"] = profile.year_of_study
            data["prn"] = profile.prn
    return data