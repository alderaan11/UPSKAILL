from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.ai_service import stream_chat

router = APIRouter(prefix="/api")

TOPIC_PROMPTS: dict[str, str] = {
    "Machine Learning": "machine learning (algorithms, model evaluation, overfitting, feature engineering, ensembles, etc.)",
    "Data Science": "data science (EDA, data cleaning, visualization, feature selection, pipelines, etc.)",
    "Probability & Statistics": "probability and statistics (distributions, hypothesis testing, Bayesian inference, confidence intervals, etc.)",
    "Software Development": "software development (design patterns, algorithms, data structures, clean code, testing, etc.)",
    "Cloud": "cloud computing (AWS/GCP/Azure services, architecture, scalability, serverless, containers, etc.)",
}


class QuestionRequest(BaseModel):
    topic: str
    mode: str  # "question" or "evaluate"
    question: str = ""
    answer: str = ""


@router.post("/question")
async def question(req: QuestionRequest):
    if not req.topic.strip():
        raise HTTPException(400, "Topic is required")

    topic_desc = TOPIC_PROMPTS.get(req.topic, req.topic)

    if req.mode == "question":
        prompt = (
            f"You are a technical interviewer. Ask ONE clear, specific question about {topic_desc}.\n\n"
            "Rules:\n"
            "- Ask only one question, no sub-questions\n"
            "- Make it practical and thought-provoking, not trivial\n"
            "- Do NOT answer it yourself\n"
            "- Do NOT add any preamble like \"Here's a question:\" — just ask the question directly"
        )
    else:
        prompt = (
            f"You are a technical interviewer. The candidate answered a question.\n\n"
            f"Topic: {req.topic}\n"
            f"Question: {req.question}\n"
            f"Answer: {req.answer}\n\n"
            "Evaluate concisely:\n"
            "1. Is the answer correct? What's right or wrong?\n"
            "2. What key points were missed?\n"
            "3. Give a score out of 10.\n\n"
            "Be direct and educational. Max 150 words."
        )

    messages = [{"role": "user", "content": prompt}]
    return StreamingResponse(
        stream_chat(messages, max_tokens=300),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
