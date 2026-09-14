"""HTML sanitization for untrusted generated artifacts."""

import re

import bleach

ALLOWED_TAGS = [
    "section", "article", "header", "footer", "main", "div", "span",
    "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "a", "strong", "em",
    "blockquote", "hr", "br", "table", "thead", "tbody", "tr", "th", "td",
    "figure", "figcaption", "img",
]

ALLOWED_ATTRIBUTES = {
    "*": ["class", "id"],
    "a": ["href", "title", "rel"],
    "img": ["src", "alt", "width", "height"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto"]

DANGEROUS_PATTERNS = [
    re.compile(r"javascript:", re.I),
    re.compile(r"on\w+\s*=", re.I),
    re.compile(r"<\s*script", re.I),
    re.compile(r"<\s*iframe", re.I),
    re.compile(r"<\s*object", re.I),
    re.compile(r"<\s*embed", re.I),
]


def sanitize_html(html: str) -> str:
    if not html:
        return ""

    for pattern in DANGEROUS_PATTERNS:
        html = pattern.sub("", html)

    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    return cleaned


def sanitize_css(css: str) -> str:
    if not css:
        return ""
    css = re.sub(r"javascript\s*:", "", css, flags=re.I)
    css = re.sub(r"expression\s*\(", "", css, flags=re.I)
    css = re.sub(r"@import", "", css, flags=re.I)
    return css.strip()
