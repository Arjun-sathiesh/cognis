import json
import re
from typing import List, Dict, Any
from services.llm_client import call_llm

EXTRACTION_SYSTEM_PROMPT = """You are Cognis, an organizational software engineering memory extraction engine.
Your task is to analyze engineering documentation and extract structured organizational engineering knowledge.

You MUST extract knowledge items strictly into these 5 categories:
1. "architecture" (Architecture Decisions):
   - title: Short descriptive title
   - decision: The technical decision made
   - rationale: Why this decision was made / tradeoffs
   - source: Name of the source document

2. "standards" (Coding Standards & Guidelines):
   - title: Short descriptive title
   - rule: The specific coding or architectural rule
   - explanation: Why this standard is enforced
   - source: Name of the source document

3. "defects" (Defect Patterns & Postmortems):
   - title: Short descriptive title of the bug/incident
   - problem: What symptom or defect occurred
   - cause: Root cause of the defect
   - solution: How it was resolved or prevented
   - source: Name of the source document

4. "lessons" (Lessons Learned & Retrospectives):
   - title: Short descriptive title
   - lesson: What was learned from the experience
   - recommendation: Prescriptive advice for future engineering work
   - source: Name of the source document

5. "technologies" (Technologies & Tooling):
   - technology: Name of framework/database/library/tool
   - purpose: Role and usage context in the system
   - source: Name of the source document

CRITICAL INSTRUCTIONS:
- You MUST output ONLY valid JSON without Markdown fences or backticks.
- Return an object with a single key "items" containing a JSON array of extracted knowledge objects.
- Each item MUST contain "category" matching one of: "architecture", "standards", "defects", "lessons", "technologies".
- Do NOT hallucinate information not present in the document.
"""

VALID_CATEGORIES = {"architecture", "standards", "defects", "lessons", "technologies"}

def validate_extraction_results(items: Any, default_source: str = "document.md") -> List[Dict[str, Any]]:
    """
    Validates extracted knowledge items to ensure they contain required fields and categories,
    preventing malformed items from breaking project analysis.
    """
    if not isinstance(items, list):
        return []

    valid_items = []
    for item in items:
        if not isinstance(item, dict):
            continue

        category = str(item.get("category", "")).lower().strip()
        if category not in VALID_CATEGORIES:
            if "arch" in category:
                category = "architecture"
            elif "standard" in category or "code" in category or "rule" in category or "guideline" in category:
                category = "standards"
            elif "defect" in category or "bug" in category or "postmortem" in category or "incident" in category:
                category = "defects"
            elif "lesson" in category or "retro" in category:
                category = "lessons"
            elif "tech" in category or "tool" in category:
                category = "technologies"
            else:
                category = "architecture"

        title = str(item.get("title") or "").strip()
        content = str(item.get("content") or "").strip()
        rationale_or_solution = str(item.get("rationale_or_solution") or "").strip()
        source = str(item.get("source") or "").strip() or default_source

        if not title:
            title = f"Knowledge from {source}"

        if not content:
            continue

        valid_items.append({
            "category": category,
            "title": title,
            "content": content,
            "rationale_or_solution": rationale_or_solution,
            "source": source,
            "metadata_json": item.get("metadata_json") or json.dumps({"source": source})
        })

    return valid_items

def extract_knowledge_from_document(filename: str, content: str) -> List[Dict[str, Any]]:
    """
    Extracts structured knowledge items from document content using LLM with JSON repair and robust heuristic fallback.
    Safely handles extraction errors, invalid JSON, and empty responses without crashing analysis.
    """
    safe_filename = str(filename or "document.md").strip() or "document.md"

    if not content or not isinstance(content, str) or len(content.strip()) < 10:
        return []

    prompt = f"""DOCUMENT FILENAME: {safe_filename}

DOCUMENT CONTENT:
\"\"\"
{content}
\"\"\"

Extract all architectural decisions, coding standards, defect patterns, lessons learned, and technologies from this document into structured JSON.
Ensure "source" is set to "{safe_filename}" on all items.
Output format:
{{
  "items": [
    {{
      "category": "architecture" | "standards" | "defects" | "lessons" | "technologies",
      "title": "...",
      "decision": "...", // for architecture
      "rationale": "...", // for architecture
      "rule": "...", // for standards
      "explanation": "...", // for standards
      "problem": "...", // for defects
      "cause": "...", // for defects
      "solution": "...", // for defects
      "lesson": "...", // for lessons
      "recommendation": "...", // for lessons
      "technology": "...", // for technologies
      "purpose": "...", // for technologies
      "source": "{safe_filename}"
    }}
  ]
}}
"""
    raw_response = ""
    try:
        raw_response = call_llm(prompt=prompt, system_prompt=EXTRACTION_SYSTEM_PROMPT, temperature=0.1)
        if raw_response and isinstance(raw_response, str) and raw_response.strip():
            items = parse_llm_json_response(raw_response, safe_filename)
            validated = validate_extraction_results(items, safe_filename)
            if validated:
                return validated
    except Exception as e:
        print(f"[Extractor] LLM extraction error on {safe_filename}: {e}. Running fallback parser.")

    # Fallback heuristic parser if LLM failed or was unavailable
    try:
        fallback_items = fallback_heuristic_extractor(safe_filename, content)
        return validate_extraction_results(fallback_items, safe_filename)
    except Exception as e:
        print(f"[Extractor] Fallback extraction error on {safe_filename}: {e}")
        return []

def parse_llm_json_response(raw_response: str, filename: str) -> List[Dict[str, Any]]:
    """
    Cleans and parses LLM JSON output, handling markdown wrapping and common JSON defects.
    """
    if not raw_response or not isinstance(raw_response, str):
        return []

    cleaned = raw_response.strip()
    if not cleaned:
        return []

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Find outermost { ... } or [ ... ]
    json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', cleaned)
    if json_match:
        cleaned = json_match.group(1)

    try:
        parsed = json.loads(cleaned)
    except Exception as e:
        print(f"[Extractor] JSON parse error on {filename}: {e}")
        return []

    items_list = []
    if isinstance(parsed, dict):
        if "items" in parsed and isinstance(parsed["items"], list):
            items_list = parsed["items"]
        elif "knowledge_items" in parsed and isinstance(parsed["knowledge_items"], list):
            items_list = parsed["knowledge_items"]
        else:
            # Maybe the dict has categories as keys
            for cat, val in parsed.items():
                if isinstance(val, list):
                    for item in val:
                        if isinstance(item, dict):
                            if "category" not in item:
                                item["category"] = cat
                            items_list.append(item)
    elif isinstance(parsed, list):
        items_list = parsed

    standardized = []
    for item in items_list:
        if not isinstance(item, dict):
            continue
        std = standardize_knowledge_item(item, filename)
        if std:
            standardized.append(std)

    return standardized

def standardize_knowledge_item(item: Dict[str, Any], default_source: str) -> Dict[str, Any]:
    """
    Normalizes keys into unified category, title, content, rationale_or_solution, source, and metadata.
    """
    raw_cat = str(item.get("category", "architecture")).lower()
    if "arch" in raw_cat:
        category = "architecture"
    elif "standard" in raw_cat or "code" in raw_cat or "guideline" in raw_cat:
        category = "standards"
    elif "defect" in raw_cat or "bug" in raw_cat or "postmortem" in raw_cat or "incident" in raw_cat:
        category = "defects"
    elif "lesson" in raw_cat or "retro" in raw_cat:
        category = "lessons"
    elif "tech" in raw_cat or "tool" in raw_cat:
        category = "technologies"
    else:
        category = "architecture"

    title = item.get("title") or item.get("technology") or item.get("name") or "Extracted Engineering Knowledge"
    source = item.get("source") or default_source

    content = ""
    rationale_or_solution = ""

    if category == "architecture":
        decision = item.get("decision") or item.get("content") or ""
        rationale = item.get("rationale") or item.get("tradeoffs") or ""
        content = decision
        rationale_or_solution = rationale
    elif category == "standards":
        rule = item.get("rule") or item.get("standard") or item.get("content") or ""
        explanation = item.get("explanation") or item.get("reason") or ""
        content = rule
        rationale_or_solution = explanation
    elif category == "defects":
        problem = item.get("problem") or item.get("issue") or item.get("content") or ""
        cause = item.get("cause") or item.get("root_cause") or ""
        solution = item.get("solution") or item.get("fix") or item.get("prevention") or ""
        content = f"Problem: {problem}\nRoot Cause: {cause}" if cause else problem
        rationale_or_solution = solution
    elif category == "lessons":
        lesson = item.get("lesson") or item.get("content") or ""
        recommendation = item.get("recommendation") or item.get("advice") or ""
        content = lesson
        rationale_or_solution = recommendation
    elif category == "technologies":
        purpose = item.get("purpose") or item.get("content") or item.get("description") or ""
        content = f"Technology: {title}\nPurpose: {purpose}"
        rationale_or_solution = purpose

    if not content and not rationale_or_solution:
        content = str(item.get("content", title))

    return {
        "category": category,
        "title": str(title).strip(),
        "content": str(content).strip(),
        "rationale_or_solution": str(rationale_or_solution).strip(),
        "source": str(source).strip(),
        "metadata_json": json.dumps(item)
    }

def fallback_heuristic_extractor(filename: str, content: str) -> List[Dict[str, Any]]:
    """
    Deterministic rule-based extractor to parse Markdown sections into Cognis categories if LLM is offline.
    """
    if not content or not isinstance(content, str):
        return []

    items = []
    try:
        lines = content.splitlines()
        current_section = ""
        current_lines = []

        def flush_section(sec_title, lines_list):
            if not lines_list:
                return
            text_block = "\n".join(lines_list).strip()
            if not text_block:
                return

            lower_title = sec_title.lower()
            lower_filename = str(filename or "").lower()

            # Determine category
            if "arch" in lower_filename or "adr" in lower_title or "database" in lower_title or "monolith" in lower_title or "caching" in lower_title or "auth" in lower_title:
                cat = "architecture"
            elif "standard" in lower_filename or "rule" in lower_title or "error" in lower_title or "typescript" in lower_title or "logging" in lower_title:
                cat = "standards"
            elif "bug" in lower_filename or "defect" in lower_filename or "race" in lower_title or "clock-skew" in lower_title or "n+1" in lower_title:
                cat = "defects"
            elif "lesson" in lower_filename or "retro" in lower_filename or "pool" in lower_title or "fixture" in lower_title or "lock" in lower_title:
                cat = "lessons"
            elif "tech" in lower_title or "stack" in lower_title or "readme" in lower_filename:
                cat = "technologies"
            else:
                cat = "architecture"

            items.append({
                "category": cat,
                "title": sec_title if sec_title else f"Knowledge from {filename}",
                "content": text_block,
                "rationale_or_solution": "Extracted from project specification documentation.",
                "source": filename,
                "metadata_json": json.dumps({"source": filename, "raw": text_block})
            })

        for line in lines:
            if line.startswith("#"):
                flush_section(current_section, current_lines)
                current_section = line.lstrip("#").strip()
                current_lines = []
            else:
                current_lines.append(line)

        flush_section(current_section, current_lines)
    except Exception as e:
        print(f"[Extractor] Fallback parser exception for {filename}: {e}")
        return []

    return items

