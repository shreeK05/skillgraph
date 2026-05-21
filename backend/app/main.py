# file: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.student import router as student_router
from app.api.routes.department import router as dept_router
from app.api.routes.company import router as company_router
from app.api.routes.graph import router as graph_router

app = FastAPI(
    title="SkillGraph API",
    description="AI-Powered Campus Placement SaaS for VIT Pune",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(student_router, prefix="/api/v1/student", tags=["Student Portal"])
app.include_router(dept_router, prefix="/api/v1/dept", tags=["Department Portal"])
app.include_router(company_router, prefix="/api/v1/company", tags=["Company Portal"])
app.include_router(graph_router, prefix="/api/v1/graph", tags=["Knowledge Graph"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "version": "2.0.0",
        "message": "SkillGraph Backend v2 is running!",
        "vit_branches": settings.VIT_BRANCHES
    }