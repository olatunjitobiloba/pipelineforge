from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_ = load_dotenv()

app = FastAPI(title="PipelineForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # update on deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}