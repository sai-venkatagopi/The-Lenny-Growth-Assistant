from app.security.artifact_sanitizer import sanitize_html


def test_blocks_iframe():
    assert "<iframe" not in sanitize_html('<iframe src="https://evil.com"></iframe>').lower()


def test_allows_safe_structure():
    html = "<section><h1>Title</h1><p>Safe content</p></section>"
    clean = sanitize_html(html)
    assert "<h1>" in clean
    assert "Safe content" in clean
