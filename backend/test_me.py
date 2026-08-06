"""
Test the /me endpoint.
Usage:  python test_me.py
"""
import httpx
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# 1. Get a fresh token
client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
email = input("Email: ")
password = input("Password: ")
res = client.auth.sign_in_with_password({"email": email, "password": password})
token = res.session.access_token
print(f"\n✔ Got token (first 40 chars): {token[:40]}...")

# 2. Call /me
print("\nCalling GET http://localhost:8000/me ...")
r = httpx.get(
    "http://localhost:8000/me",
    headers={"Authorization": f"Bearer {token}"},
)
print(f"Status: {r.status_code}")
print(f"Response: {r.json()}")
