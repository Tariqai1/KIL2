# file: database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ✅ Load environment variables from .env file
load_dotenv()

# ✅ Get DATABASE_URL from .env file
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL environment variable not set in .env file")

# ✅ Create the database engine with production-ready settings
# Pool sizing: recommended is (concurrent_requests) * 2
# For Supabase with typical load: pool_size=20, max_overflow=40 (total 60)
try:
    pool_size = int(os.getenv("DATABASE_POOL_SIZE", 20))
    max_overflow = int(os.getenv("DATABASE_MAX_OVERFLOW", 40))
    pool_recycle = int(os.getenv("DATABASE_POOL_RECYCLE", 1800))
except ValueError:
    pool_size = 20
    max_overflow = 40
    pool_recycle = 1800

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Test connection before using
    pool_recycle=pool_recycle,  # Recycle connections after 30 min
    pool_size=pool_size,  # Number of persistent connections
    max_overflow=max_overflow,  # Max additional overflow connections
    pool_timeout=30,  # Wait max 30s for connection
    echo=False,  # Disable SQL query logging (enable for debugging)
)

# ✅ Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base class for models
Base = declarative_base()


# Dependency function to use in FastAPI
def get_db():
    """
    This function will provide a database session.
    Use it in your FastAPI routes with Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
