import pytest

from app.security.artifact_sanitizer import sanitize_css, sanitize_html


def test_sanitize_removes_script():
    dirty = '<div>Hello<script>alert("x")</script></div>'
    clean = sanitize_html(dirty)
    assert "script" not in clean.lower()
    assert "Hello" in clean


def test_sanitize_removes_onclick():
    dirty = '<button onclick="alert(1)">Click</button>'
    clean = sanitize_html(dirty)
    assert "onclick" not in clean.lower()


def test_sanitize_css():
    css = "body { color: red; } @import url('evil');"
    clean = sanitize_css(css)
    assert "@import" not in clean


@pytest.mark.asyncio
async def test_create_artifact_endpoint(client):
    session = (await client.post("/api/sessions", json={})).json()
    res = await client.post(
        "/api/artifacts",
        json={
            "session_id": session["id"],
            "request": "Create a product strategy one-pager",
            "type": "markdown",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "markdown"
    assert len(data["content"]) > 10
