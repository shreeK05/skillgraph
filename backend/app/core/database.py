from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import os

# Auto-detect: use SQLite if DATABASE_URL is placeholder or Postgres not available
_db_url = settings.DATABASE_URL

if _db_url == "postgresql://user:password@localhost:5432/skillgraph" or not _db_url:
    # Dev fallback: SQLite stored in backend directory
    _sqlite_path = os.path.join(os.path.dirname(__file__), "../../../skillgraph_dev.db")
    _sqlite_path = os.path.abspath(_sqlite_path)
    _db_url = f"sqlite:///{_sqlite_path}"
    print(f"[WARNING] Using SQLite fallback: {_sqlite_path}")
    print("   Set DATABASE_URL in .env to use PostgreSQL in production.")
    _connect_args = {"check_same_thread": False}
else:
    _connect_args = {}

# Create the SQLAlchemy engine
engine = create_engine(
    _db_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

# Create a session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()