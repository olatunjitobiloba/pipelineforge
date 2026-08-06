import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException
from app.core.config import SUPABASE_URL, SUPABASE_JWT_SECRET

# Supabase JWKS endpoint for ES256 public key verification
_jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwks_client = PyJWKClient(_jwks_url)


class AuthContext:
    def __init__(self, user_id: str, email: str, token: str):
        self.user_id = user_id
        self.email = email
        self.token = token


def verify_token(authorization: str = Header(...)) -> AuthContext:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        # Try ES256 verification via JWKS first (Supabase default)
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except (jwt.PyJWTError, Exception):
        # Fall back to HS256 with JWT secret
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.PyJWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user id")

    return AuthContext(user_id=user_id, email=email, token=token)
