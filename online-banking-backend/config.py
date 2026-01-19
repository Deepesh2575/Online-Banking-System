import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+mysqlconnector://root:@127.0.0.1:3306/banking_system")

settings = Settings()
