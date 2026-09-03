from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import os

# Always load .env from the same directory as this script
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

email = input("Email: ")
password = input("Password: ")

res = client.auth.sign_in_with_password({"email": email, "password": password})
print("\nAccess token:\n")
print(res.session.access_token)
