from collections.abc import AsyncGenerator

import httpx

from app.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def stream_chat(
    messages: list[dict],
    model: str = "anthropic/claude-sonnet-4-5",
    max_tokens: int = 1024,
) -> AsyncGenerator[str, None]:
    """Yield SSE data lines: `data: {"text": "..."}\n\n` and `data: [DONE]\n\n`."""
    if not settings.openrouter_api_key:
        yield 'data: {"text": "Error: OPENROUTER_API_KEY is not set."}\n\n'
        yield "data: [DONE]\n\n"
        return
    payload = {
        "model": model,
        "stream": True,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", OPENROUTER_URL, json=payload, headers=headers) as res:
            res.raise_for_status()
            async for line in res.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:]
                if data == "[DONE]":
                    break
                try:
                    import json
                    chunk = json.loads(data)
                    text = (chunk.get("choices") or [{}])[0].get("delta", {}).get("content", "")
                    if text:
                        yield f'data: {json.dumps({"text": text})}\n\n'
                except Exception:
                    continue
    yield "data: [DONE]\n\n"
