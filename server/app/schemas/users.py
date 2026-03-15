from pydantic import BaseModel


class TopicCreate(BaseModel):
    topic: str


class TopicOut(BaseModel):
    id: str
    topic: str
    created_at: str
