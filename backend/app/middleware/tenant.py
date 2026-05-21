# file: backend/app/middleware/tenant.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id", "")

        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    user.current_tenant_id = tenant_id
    return user

def get_current_student(current_user: User = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Not authorized. Student access only.")
    return current_user

def get_current_faculty(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["FACULTY", "DEPT_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized. Faculty access only.")
    return current_user

def get_current_company(current_user: User = Depends(get_current_user)):
    if current_user.role != "COMPANY":
        raise HTTPException(status_code=403, detail="Not authorized. Company access only.")
    return current_user

def get_current_dept_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["DEPT_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized. Department admin access only.")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access only.")
    return current_user