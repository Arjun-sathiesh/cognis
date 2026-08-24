import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from database import get_db
from models import ChatMessage, Project
from services.rag import ask_cognis

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class AskRequest(BaseModel):
    question: str
    project_id: Optional[int] = None
    mode: Optional[str] = "Architecture" # Requirements, Architecture, Debugging, Code Review, Planning

class AskResponse(BaseModel):
    id: int
    role: str
    content: str
    mode: str
    sources: List[Dict[str, Any]]
    created_at: str

@router.post("/ask", response_model=AskResponse)
def ask_assistant(payload: AskRequest, db: Session = Depends(get_db)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # 1. Save user query in chat_messages
    user_msg = ChatMessage(
        project_id=payload.project_id,
        mode=payload.mode or "Architecture",
        role="user",
        content=payload.question.strip(),
        sources_json=None
    )
    db.add(user_msg)
    db.commit()

    # 2. Run grounded RAG engine
    rag_result = ask_cognis(
        db=db,
        question=payload.question.strip(),
        project_id=payload.project_id,
        mode=payload.mode or "Architecture"
    )

    # 3. Save assistant response
    assistant_msg = ChatMessage(
        project_id=payload.project_id,
        mode=payload.mode or "Architecture",
        role="assistant",
        content=rag_result["answer"],
        sources_json=json.dumps(rag_result["sources"])
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return AskResponse(
        id=assistant_msg.id,
        role="assistant",
        content=assistant_msg.content,
        mode=assistant_msg.mode,
        sources=rag_result["sources"],
        created_at=assistant_msg.created_at.isoformat() if assistant_msg.created_at else ""
    )

@router.get("/history")
def get_chat_history(project_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if project_id:
        query = query.filter(ChatMessage.project_id == project_id)
    
    messages = query.order_by(ChatMessage.created_at.asc()).limit(limit).all()
    results = []
    for m in messages:
        sources = []
        if m.sources_json:
            try:
                sources = json.loads(m.sources_json)
            except Exception:
                sources = []
        results.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "mode": m.mode,
            "sources": sources,
            "created_at": m.created_at.isoformat() if m.created_at else ""
        })
    return results

@router.delete("/history")
def clear_chat_history(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if project_id:
        query = query.filter(ChatMessage.project_id == project_id)
    query.delete()
    db.commit()
    return {"message": "Chat history cleared"}
