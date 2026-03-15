from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import arxiv, challenge, jobs, news, question, releases, users

app = FastAPI(title="UPSKAILL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news.router)
app.include_router(jobs.router)
app.include_router(arxiv.router)
app.include_router(releases.router)
app.include_router(challenge.router)
app.include_router(question.router)
app.include_router(users.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
