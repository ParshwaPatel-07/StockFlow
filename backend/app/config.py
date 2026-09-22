import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

def parse_cors_origins() -> list[str]:
    # Localhost development origins
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    env_origins = os.getenv("CORS_ORIGINS", "")
    frontend_url = os.getenv("FRONTEND_URL", "")
    
    origins = list(default_origins)
    
    if env_origins:
        for origin in env_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
                    https_url = f"https://{cleaned}"
                    if https_url not in origins:
                        origins.append(https_url)
                elif cleaned not in origins:
                    origins.append(cleaned)
                
    if frontend_url:
        cleaned = frontend_url.strip().rstrip("/")
        if cleaned:
            if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
                https_url = f"https://{cleaned}"
                if https_url not in origins:
                    origins.append(https_url)
            elif cleaned not in origins:
                origins.append(cleaned)
            
    return origins

class Settings(BaseSettings):
    PROJECT_NAME: str = "StockFlow"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://localhost:5432/stockflow"
    )
    CORS_ORIGINS: list[str] = parse_cors_origins()

settings = Settings()

