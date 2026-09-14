import pytest


@pytest.mark.asyncio
async def test_chat_grounded_response(client):
    session = (await client.post("/api/sessions", json={})).json()
    res = await client.post(
        "/api/chat",
        json={"session_id": session["id"], "message": "What makes an activation loop durable?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 20
    assert "model" in data


@pytest.mark.asyncio
async def test_chat_ship30_action(client):
    session = (await client.post("/api/sessions", json={})).json()
    res = await client.post(
        "/api/chat",
        json={
            "session_id": session["id"],
            "message": "Write about durable growth loops",
            "action": "ship30",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("artifact") is not None
    assert data["artifact"]["type"] == "markdown"
