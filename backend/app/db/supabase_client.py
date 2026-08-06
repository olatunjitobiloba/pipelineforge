from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_ANON_KEY


def get_supabase_for_user(access_token: str) -> Client:
    """
    Returns a Supabase client authenticated as the requesting user.
    All queries through this client are subject to RLS policies
    as that user — this is the real security boundary (Section 35).
    """
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    return client