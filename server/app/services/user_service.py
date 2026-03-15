from supabase import create_client

from app.config import settings
from app.schemas.users import TopicOut


def _client():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def list_topics(user_id: str) -> list[TopicOut]:
    res = (
        _client()
        .table("user_topics")
        .select("id, topic, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return [TopicOut(**row) for row in (res.data or [])]


async def add_topic(user_id: str, topic: str) -> TopicOut:
    res = (
        _client()
        .table("user_topics")
        .insert({"user_id": user_id, "topic": topic})
        .execute()
    )
    return TopicOut(**res.data[0])


async def delete_topic(user_id: str, topic_id: str) -> None:
    _client().table("user_topics").delete().eq("id", topic_id).eq("user_id", user_id).execute()
