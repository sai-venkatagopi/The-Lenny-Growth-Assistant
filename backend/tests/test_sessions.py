import pytest


@pytest.mark.asyncio
async def test_create_and_get_session(client):
    create = await client.post("/api/sessions", json={"title": "Test session"})
    assert create.status_code == 200
    session_id = create.json()["id"]

    get = await client.get(f"/api/sessions/{session_id}")
    assert get.status_code == 200
    assert get.json()["title"] == "Test session"
    assert get.json()["messages"] == []


@pytest.mark.asyncio
async def test_session_isolation(client):
    s1 = (await client.post("/api/sessions", json={"title": "Session A"})).json()
    s2 = (await client.post("/api/sessions", json={"title": "Session B"})).json()

    await client.post(
        "/api/chat",
        json={"session_id": s1["id"], "message": "What is activation?"},
    )

    a = await client.get(f"/api/sessions/{s1['id']}")
    b = await client.get(f"/api/sessions/{s2['id']}")

    assert len(a.json()["messages"]) >= 2
    assert len(b.json()["messages"]) == 0
