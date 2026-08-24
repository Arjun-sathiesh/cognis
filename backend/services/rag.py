import re
import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from models import KnowledgeItem, ChatMessage
from services.llm_client import call_llm

MODE_PROMPTS = {
    "Architecture": "Focus on high-level system design, database choices, scalability tradeoffs, integration patterns, and architectural decision records (ADRs).",
    "Requirements": "Focus on functional and non-functional specifications, domain boundaries, user constraints, and acceptance criteria.",
    "Debugging": "Focus on identifying root causes, analyzing defect patterns, postmortems, race conditions, edge cases, and concrete code/system fixes.",
    "Code Review": "Focus on coding standards, naming conventions, transaction boundaries, strict typing, error handling formats, and best practices.",
    "Planning": "Focus on implementation roadmap, dependency order, engineering risk mitigation, and team task breakdown."
}

def retrieve_relevant_knowledge(
    db: Session,
    query: str,
    project_id: int = None,
    category: str = None,
    limit: int = 5
) -> List[KnowledgeItem]:
    """
    Performs hybrid token and keyword matching with category weighting over KnowledgeItems.
    """
    db_query = db.query(KnowledgeItem)
    if project_id:
        db_query = db_query.filter(KnowledgeItem.project_id == project_id)
    if category and category != "all":
        db_query = db_query.filter(KnowledgeItem.category == category)
        
    all_items = db_query.all()
    if not all_items:
        return []

    # Clean query tokens
    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 2]
    if not query_tokens:
        return all_items[:limit]

    scored_items: List[Tuple[float, KnowledgeItem]] = []

    for item in all_items:
        text_corpus = f"{item.title} {item.category} {item.content} {item.rationale_or_solution or ''} {item.source}".lower()
        score = 0.0
        
        for token in query_tokens:
            if token in item.title.lower():
                score += 5.0 # Title match bonus
            if token in item.category.lower():
                score += 3.0
            if token in text_corpus:
                # Term frequency bonus
                count = text_corpus.count(token)
                score += 1.0 + math.log(1 + count)

        # Exact phrase match bonus
        if query.lower() in text_corpus:
            score += 10.0

        if score > 0:
            scored_items.append((score, item))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)
    
    if scored_items:
        return [item for _, item in scored_items[:limit]]
    
    # If no token matched, return top items
    return all_items[:limit]

def ask_cognis(
    db: Session,
    question: str,
    project_id: int = None,
    mode: str = "Architecture"
) -> Dict[str, Any]:
    """
    Executes the RAG pipeline:
    1. Search stored knowledge items.
    2. Format context and system prompt.
    3. Generate grounded answer.
    4. Extract and link citations.
    """
    relevant_items = retrieve_relevant_knowledge(db, question, project_id=project_id, limit=6)
    
    mode_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS["Architecture"])
    
    sources = []
    seen_sources = set()
    for item in relevant_items:
        key = (item.title, item.source)
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append({
                "id": item.id,
                "title": item.title,
                "category": item.category,
                "source": item.source,
                "excerpt": (item.content[:200] + "...") if len(item.content) > 200 else item.content
            })

    if not relevant_items:
        return {
            "answer": "I could not find any relevant organizational engineering knowledge in the uploaded project documents for your question. Please ensure documents covering this topic are uploaded and analyzed.",
            "sources": []
        }

    # Format knowledge context
    context_blocks = []
    for idx, item in enumerate(relevant_items, 1):
        context_blocks.append(
            f"[{idx}] Category: {item.category.upper()}\n"
            f"Title: {item.title}\n"
            f"Content: {item.content}\n"
            f"Details/Rationale: {item.rationale_or_solution or 'N/A'}\n"
            f"Source Document: {item.source}\n"
        )
    context_str = "\n---\n".join(context_blocks)

    system_prompt = (
        "You are Cognis, an organizational software engineering assistant.\n"
        "Your mission is to provide accurate engineering intelligence using ONLY the organization's stored knowledge repository.\n\n"
        f"OPERATING MODE: {mode} ({mode_instruction})\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. Answer the user's question using the provided organizational knowledge below.\n"
        "2. Do not invent organizational facts or assume unstated decisions.\n"
        "3. If the provided knowledge does not contain enough information, clearly state the limitation.\n"
        "4. Explicitly reference and cite the knowledge items and source documents used.\n"
        "5. Structure your response clearly with Markdown headings, bullet points, and code/architecture highlights where appropriate."
    )

    user_prompt = f"""ORGANIZATIONAL KNOWLEDGE BASE CONTEXT:
\"\"\"
{context_str}
\"\"\"

ENGINEER'S QUESTION:
{question}

Please provide a comprehensive, strictly grounded engineering answer based on our organization's documented decisions and standards:"""

    try:
        answer = call_llm(prompt=user_prompt, system_prompt=system_prompt, temperature=0.2)
        return {
            "answer": answer.strip(),
            "sources": sources
        }
    except Exception as e:
        print(f"[RAG] LLM call error: {e}. Generating deterministic grounded synthesis.")
        # Deterministic grounded synthesis fallback
        grounded_answer = generate_fallback_rag_response(question, relevant_items, mode)
        return {
            "answer": grounded_answer,
            "sources": sources
        }

def generate_fallback_rag_response(question: str, items: List[KnowledgeItem], mode: str) -> str:
    """
    Generates a high-quality synthesis when external LLM APIs are unreachable.
    """
    ans = [f"### Cognis Engineering Memory Summary ({mode} Mode)\n"]
    ans.append("Based on the analyzed organizational documentation, here is the relevant guidance:\n")
    
    for idx, item in enumerate(items, 1):
        ans.append(f"#### {idx}. {item.title} `[{item.category.capitalize()}]`")
        ans.append(f"- **Key Fact / Decision**: {item.content}")
        if item.rationale_or_solution:
            ans.append(f"- **Rationale / Resolution**: {item.rationale_or_solution}")
        ans.append(f"- **Source Reference**: *{item.source}*\n")
        
    ans.append("\n> **Organizational Notice**: This response was synthesized directly from verified engineering artifacts in the repository.")
    return "\n".join(ans)
