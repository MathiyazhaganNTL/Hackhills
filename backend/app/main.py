from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database import init_db
from app.api.v1 import auth, sessions, inference, evaluations, security, audit, admin, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and seeds
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Bayora — Secure AI Red-Teaming & Safety Evaluation Infrastructure API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enterprise Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# Include Routers
app.include_router(system.router, prefix="/api/v1")
app.include_router(system.router) # For root /metrics, /health
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(inference.router, prefix=settings.API_V1_STR)
app.include_router(evaluations.router, prefix=settings.API_V1_STR)
app.include_router(security.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "service": "Bayora Secure AI Safety Infrastructure",
        "docs": "/docs",
        "health": "/api/v1/health",
        "capabilities": "/api/v1/capabilities"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
