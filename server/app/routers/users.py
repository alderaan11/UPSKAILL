from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_user_id
from app.schemas.users import TopicCreate, TopicOut
from app.services import user_service

router = APIRouter(prefix="/api/user")


@router.get("/topics", response_model=list[TopicOut])
async def list_topics(user_id: str = Depends(get_user_id)):
    return await user_service.list_topics(user_id)


@router.post("/topics", response_model=TopicOut, status_code=201)
async def add_topic(body: TopicCreate, user_id: str = Depends(get_user_id)):
    return await user_service.add_topic(user_id, body.topic)


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(topic_id: str, user_id: str = Depends(get_user_id)):
    await user_service.delete_topic(user_id, topic_id)
