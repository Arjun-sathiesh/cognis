import sys
from pathlib import Path
from unittest.mock import patch

# Ensure backend directory is in sys.path for import resolution
backend_dir = str(Path(__file__).resolve().parent.parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.extractor import (
    extract_knowledge_from_document,
    parse_llm_json_response,
    validate_extraction_results,
)


def test_empty_or_short_content_returns_empty_list():
    """Test that empty or too short document content returns [] without throwing exception."""
    assert extract_knowledge_from_document("empty.md", "") == []
    assert extract_knowledge_from_document("short.md", "too short") == []
    assert extract_knowledge_from_document(None, None) == []


def test_llm_failure_or_invalid_json_uses_fallback_safely():
    """Test that if LLM returns invalid JSON or raises exception, extractor handles it safely without crashing."""
    sample_content = """# Architecture Overview
We chose PostgreSQL for ACID compliance and reliability.
"""
    # Mock LLM returning invalid non-JSON string
    with patch("services.extractor.call_llm", return_value="Invalid non-JSON response from LLM"):
        items = extract_knowledge_from_document("architecture.md", sample_content)
        assert isinstance(items, list)
        assert len(items) > 0
        assert items[0]["category"] == "architecture"
        assert items[0]["source"] == "architecture.md"


def test_malformed_extraction_items_validated_safely():
    """Test that malformed extraction result items with missing content or bad categories are sanitized safely."""
    malformed_items = [
        {"category": "unknown_cat", "title": "Test Title", "content": "Valid Content", "source": "doc.md"},
        {"category": "standards", "title": "Missing Content Item", "content": ""},
        "not a dict item",
    ]
    validated = validate_extraction_results(malformed_items, "default.md")
    assert len(validated) == 1
    assert validated[0]["category"] == "architecture"  # unknown_cat mapped safely
    assert validated[0]["title"] == "Test Title"
    assert validated[0]["content"] == "Valid Content"
