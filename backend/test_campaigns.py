"""
Test the campaigns endpoints.
Usage:  python test_campaigns.py
"""
import httpx
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import os
import json

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# 1. Get a fresh token
client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
email = input("Email: ")
password = input("Password: ")
res = client.auth.sign_in_with_password({"email": email, "password": password})
token = res.session.access_token
print(f"\n✔ Got token")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

# 2. Create a campaign
print("\n--- POST /campaigns ---")
payload = {
    "name": "Roofing Q3 Push",
    "niche": "roofing",
    "city": "Austin",
    "min_service_value": 5000,
    "outreach_angle": "curiosity-based opener about booking gaps",
}
r = httpx.post("http://localhost:8000/campaigns", headers=headers, json=payload)
print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")

# 3. List campaigns
print("\n--- GET /campaigns ---")
r = httpx.get("http://localhost:8000/campaigns", headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
