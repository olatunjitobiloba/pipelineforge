import os
from types import SimpleNamespace
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]
GROQ_API_KEY: str = os.environ["GROQ_API_KEY"]

settings = SimpleNamespace(GROQ_API_KEY=GROQ_API_KEY)