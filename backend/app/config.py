import os

from dotenv import load_dotenv

load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_API_KEY_BACKUP = os.getenv("LLM_API_KEY_BACKUP", "")
LLM_BASE_URL_BACKUP = os.getenv("LLM_BASE_URL_BACKUP", "https://integrate.api.nvidia.com/v1")
LLM_MODEL_BACKUP = os.getenv("LLM_MODEL_BACKUP", "meta/llama-3.1-8b-instruct")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
