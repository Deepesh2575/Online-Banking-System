from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
import models
from routers import auth, accounts, transactions
from config import settings

# This line is not strictly necessary if you are not using Alembic or creating tables from scratch,
# but it's good practice to have it. It registers your models with the SQLAlchemy engine.
models.Base.metadata.create_all(bind=engine) # Uncomment if you need to create tables

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Online Banking API",
    description="A secure API for a student's online banking project.",
    version="1.0.0",
)

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
# This allows the React frontend (running on a different port) to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for debugging
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],     # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],     # Allows all headers
)

# --- API Routers ---
# Include the routers from the different modules.
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)

# --- Root Endpoint ---
@app.get("/", tags=["Root"])
def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"status": "ok", "message": "Welcome to the Online Banking API!"}

