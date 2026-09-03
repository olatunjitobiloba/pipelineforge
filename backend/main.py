import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import campaigns, profile

app = FastAPI(title="PipelineForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "https://pipelineforge.vercel.app"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(campaigns.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}