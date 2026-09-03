from gradio import Server
from fastapi.middleware.cors import CORSMiddleware
from app.api import profile, campaigns

# gradio.Server extends FastAPI - all normal FastAPI features work
app = Server()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        # TODO: add your Vercel URL here after Part B, then redeploy
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


# No @spaces.GPU decorated functions anywhere in this app -
# we don't need GPU. This should run as a plain CPU backend
# on the free ZeroGPU hardware tier without consuming GPU quota.
app.launch(show_error=True)