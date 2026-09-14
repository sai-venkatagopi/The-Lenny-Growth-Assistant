import hashlib
import re
from dataclasses import dataclass


@dataclass
class TextChunk:
    index: int
    text: str
    content_hash: str


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> list[TextChunk]:
    """Split text into overlapping chunks by sentence boundaries where possible."""
    cleaned = re.sub(r"\n{3,}", "\n\n", text.strip())
    if not cleaned:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    chunks: list[TextChunk] = []
    current: list[str] = []
    current_len = 0
    idx = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if current_len + len(sentence) > chunk_size and current:
            chunk_text_val = " ".join(current).strip()
            chunks.append(TextChunk(index=idx, text=chunk_text_val, content_hash=_hash_text(chunk_text_val)))
            idx += 1
            overlap_text = chunk_text_val[-overlap:] if len(chunk_text_val) > overlap else chunk_text_val
            current = [overlap_text, sentence]
            current_len = len(overlap_text) + len(sentence)
        else:
            current.append(sentence)
            current_len += len(sentence)

    if current:
        chunk_text_val = " ".join(current).strip()
        chunks.append(TextChunk(index=idx, text=chunk_text_val, content_hash=_hash_text(chunk_text_val)))

    return chunks


def parse_transcript_metadata(filename: str, content: str) -> dict:
    """Extract title, url, speaker from fixture headers."""
    title = filename.replace(".md", "").replace(".txt", "").replace("-", " ").title()
    url = None
    speaker = None

    url_match = re.search(r"Source URL:\s*(.+)", content)
    if url_match:
        url = url_match.group(1).strip()

    title_match = re.search(r"^Title:\s*(.+)$", content, re.MULTILINE)
    if title_match:
        title = title_match.group(1).strip()

    speaker_match = re.search(r"^Guest:\s*(.+)$", content, re.MULTILINE)
    if speaker_match:
        speaker = speaker_match.group(1).strip()

    guest_match = re.search(r"^# .+ with (.+)$", content, re.MULTILINE)
    if guest_match and not speaker:
        speaker = guest_match.group(1).strip()

    return {"title": title, "url": url, "speaker": speaker}
