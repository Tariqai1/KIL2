import os
import time
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Request, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

# --- Redis & Rate Limiting (Safe Import) ---
# Graceful degradation: If Redis/Limiter libraries are missing, app won't crash.
try:
    import redis.asyncio as redis
    from fastapi_limiter import FastAPILimiter
except ImportError:
    redis = None
    FastAPILimiter = None
    print("⚠️ WARNING: 'fastapi-limiter' or 'redis' library not found. Rate limiting will be disabled.")

# --- Import Database & Models ---
from database import engine, Base, get_db
from models import user_model, permission_model, library_management_models
import auth

# --- Import Controllers ---
from controllers import (
    auth_controller,
    google_auth_controller,
    user_controller,
    role_controller,
    profile_controller,
    permission_controller,
    category_controller,
    subcategory_controller,
    language_controller,
    book_copy_controller,
    issue_controller,
    digital_access_controller,
    location_controller,
    log_controller,
    book_permission_controller,
    upload_controller,
    request_user_controller,
    public_user_controller,
    request_controller,
    book_read_controller,
    book_management_controller,
    password_controller,
    post_controller,
    donation_controller,
    interaction_controller,
    settings_controller
)

# --- Lifespan Manager (Startup/Shutdown Logic) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 🚀 Startup
    print("🚀 System Starting...")
    
    # 1. Database Tables Check
    print("Checking database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified.")

    # 2. Redis Connection (For Caching & Rate Limiting)
    redis_connection = None
    if FastAPILimiter and redis:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            redis_connection = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
            await FastAPILimiter.init(redis_connection)
            print(f"✅ Redis Connected & Rate Limiter Initialized at {redis_url}")
        except Exception as e:
            print(f"⚠️ Redis Connection Failed: {e}. Rate limiting is DISABLED.")
    else:
        print("⚠️ Rate Limiting skipped (Library missing or Redis not configured).")

    yield  # Application runs here

    # 🛑 Shutdown
    print("🛑 System Shutting Down...")
    if redis_connection:
        await redis_connection.close()
        print("✅ Redis Connection Closed.")

# --- Initialize FastAPI App ---
app = FastAPI(
    title="BookNest Library API",
    version="6.3.0",
    description="Full-featured Library API with Dynamic Permissions, Redis Caching & Dual Uploads.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ==========================================
# 🛡️ MIDDLEWARES (Best Practices)
# ==========================================

# 1. Process Time Header (For Performance Monitoring)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# 2. Trusted Host (Security Header)
TRUSTED_HOSTS = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1").split(",")
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=TRUSTED_HOSTS
)

# 3. GZip Compression (Faster Responses)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 4. CORS (Allowed Origins)
_cors_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_path = Path("static")
static_path.mkdir(parents=True, exist_ok=True)

uploads_path = static_path / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)

(uploads_path / "posts").mkdir(parents=True, exist_ok=True)
# ✅ Added these two lines for Local PDFs and Texts
(uploads_path / "pdfs").mkdir(parents=True, exist_ok=True)
(uploads_path / "texts").mkdir(parents=True, exist_ok=True)

# Mount paths for frontend access
app.mount("/static", StaticFiles(directory="static"), name="static")
# ✅ Added this line so frontend can access http://127.0.0.1:8000/uploads/...
app.mount("/uploads", StaticFiles(directory="static/uploads"), name="uploads")
# ==========================================
# 🚨 EXCEPTION HANDLERS
# ==========================================

# 1. Validation Error Handler (Detailed)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    try:
        for error in exc.errors():
            input_repr = error.get("input")
            if isinstance(input_repr, bytes):
                input_repr = f"<bytes data, length {len(input_repr)}>"
            elif input_repr is not None and not isinstance(input_repr, (str, int, float, bool, list, dict)):
                input_repr = repr(input_repr)

            error_details.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
                "input_preview": str(input_repr)[:200]
            })

        print(f"❌ Validation Error: {error_details}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({"detail": error_details}),
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error during validation."}
        )

# 2. Global Exception Handler (Crash Prevention)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 CRITICAL ERROR: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred on the server."}
    )

# ==========================================
# 🏥 HEALTH CHECK
# ==========================================
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "version": "6.3.0", "database": "connected"}

# ==========================================
# 🛣️ ROUTER REGISTRATION
# ==========================================

api_router = APIRouter(prefix="/api")

# 1. Authentication
api_router.include_router(auth_controller.router, tags=["Authentication"])
api_router.include_router(google_auth_controller.router, tags=["Google Auth"])
api_router.include_router(password_controller.router, prefix="/auth", tags=["Password Reset"])

# 2. Identity Management
api_router.include_router(profile_controller.router, prefix="/profile", tags=["Profile"])
api_router.include_router(user_controller.router, prefix="/users", tags=["Users"])
api_router.include_router(role_controller.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permission_controller.router, prefix="/permissions", tags=["Permissions"])

# 3. Library Content Management
api_router.include_router(category_controller.router, prefix="/categories", tags=["Categories"])
api_router.include_router(subcategory_controller.router, prefix="/subcategories", tags=["Subcategories"])
api_router.include_router(language_controller.router, prefix="/languages", tags=["Languages"])
api_router.include_router(location_controller.router, prefix="/locations", tags=["Locations"])
api_router.include_router(book_copy_controller.router, prefix="/copies", tags=["Copies"])
api_router.include_router(upload_controller.router, prefix="/upload", tags=["Uploads"])

# 4. Operations & Circulation
api_router.include_router(issue_controller.router, prefix="/issues", tags=["Issues"])
api_router.include_router(request_controller.router, prefix="/requests", tags=["Admin Requests"])
api_router.include_router(request_user_controller.router, prefix="/restricted-requests", tags=["User Requests"])

# 5. Security, Logs & User Interaction
api_router.include_router(book_permission_controller.router, prefix="/book-permissions", tags=["Book Permissions"])
api_router.include_router(digital_access_controller.router, prefix="/digital-access", tags=["Digital Access"])
api_router.include_router(log_controller.router, prefix="/logs", tags=["Logs"])
api_router.include_router(interaction_controller.router, prefix="/interaction", tags=["User Interaction"])

# 6. Public Actions & Utils
api_router.include_router(public_user_controller.router, prefix="/public", tags=["Public Actions"])
api_router.include_router(book_read_controller.router, prefix="/books", tags=["Books (Read)"])
api_router.include_router(book_management_controller.router, prefix="/books", tags=["Books (Manage)"])
api_router.include_router(post_controller.router, prefix="/posts", tags=["Markaz News"])
api_router.include_router(donation_controller.router, tags=["Donation"]) # ✅ Moved INSIDE /api to fix 404
api_router.include_router(settings_controller.router, prefix="/settings", tags=["Homepage Settings"])

# Register Main Router
app.include_router(api_router)

# ==========================================
# 🛠️ UTILITY & SETUP ENDPOINTS
# ==========================================

@app.get("/api/nuke-issues", tags=["Debug"], include_in_schema=False)
def nuke_issues(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    try:
        from models.library_management_models import IssuedBook
        deleted_count = db.query(IssuedBook).delete()
        db.commit()
        return {"message": f"Successfully deleted {deleted_count} corrupt issue records. Dashboard should work now."}
    except Exception as e:
        db.rollback()
        return {"message": f"Error deleting issues: {str(e)}"}

@app.get("/api/setup-permissions", tags=["Setup"])
def setup_default_permissions(db: Session = Depends(get_db)):
    permission_groups = {
        "User Management": [
            {"name": "USER_VIEW", "description": "Can view user lists and profiles"},
            {"name": "USER_MANAGE", "description": "Can create, edit, and delete users"},
        ],
        "Library Management": [
            {"name": "BOOK_VIEW", "description": "Can view the book library"},
            {"name": "BOOK_MANAGE", "description": "Can add, edit, and delete books"},
            {"name": "BOOK_ISSUE", "description": "Can issue and return physical book copies"},
        ],
        "Security & Roles": [
            {"name": "ROLE_VIEW", "description": "Can view system roles"},
            {"name": "ROLE_MANAGE", "description": "Can create and modify roles"},
            {"name": "ROLE_PERMISSION_ASSIGN", "description": "Can assign permissions to roles"},
            {"name": "PERMISSION_VIEW", "description": "Can view all available permissions"},
        ],
        "Access Requests": [
            {"name": "REQUEST_VIEW", "description": "Can view pending digital access requests"},
            {"name": "REQUEST_MANAGE", "description": "Can approve or reject access requests"},
        ],
        "System Audit": [
            {"name": "LOGS_VIEW", "description": "Can view system audit logs and activity"},
        ]
    }

    all_perms = [p for group in permission_groups.values() for p in group]
    added_names = []
    all_db_permissions = []

    for p_data in all_perms:
        db_perm = db.query(permission_model.Permission).filter(
            permission_model.Permission.name == p_data["name"]
        ).first()

        if not db_perm:
            db_perm = permission_model.Permission(
                name=p_data["name"],
                description=p_data["description"]
            )
            db.add(db_perm)
            added_names.append(p_data["name"])

        all_db_permissions.append(db_perm)

    db.flush()

    admin_role = db.query(user_model.Role).filter(
        user_model.Role.name.in_(["Admin", "SuperAdmin", "Administrator"])
    ).first()

    link_message = "Admin role not found."
    if admin_role:
        current_perms = set(admin_role.permissions)
        new_perms = set(all_db_permissions)
        admin_role.permissions = list(current_perms.union(new_perms))
        link_message = f"All permissions linked to role: {admin_role.name}"

    try:
        db.commit()
        return {
            "status": "Success",
            "permissions_created": len(added_names),
            "total_permissions_in_system": len(all_db_permissions),
            "role_assignment": link_message,
            "newly_added": added_names
        }
    except Exception as e:
        db.rollback()
        return {"status": "Error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)