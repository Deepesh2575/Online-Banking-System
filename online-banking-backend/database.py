from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create the SQLAlchemy engine using the database URL from settings
# The pool_pre_ping argument checks for "stale" connections and reconnects if necessary
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for our SQLAlchemy models to inherit from
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that provides a database session.
    It ensures the session is always closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
