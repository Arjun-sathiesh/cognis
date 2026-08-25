from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import KnowledgeItem, Project

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

@router.get("")
def list_knowledge(
    project_id: Optional[int] = None,
    category: Optional[str] = "all",
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(KnowledgeItem)

    if project_id:
        query = query.filter(KnowledgeItem.project_id == project_id)

    if category and category.lower() != "all":
        # Normalize category matching
        cat_lower = category.lower()
        if "arch" in cat_lower:
            query = query.filter(KnowledgeItem.category == "architecture")
        elif "standard" in cat_lower or "code" in cat_lower:
            query = query.filter(KnowledgeItem.category == "standards")
        elif "defect" in cat_lower or "bug" in cat_lower:
            query = query.filter(KnowledgeItem.category == "defects")
        elif "lesson" in cat_lower:
            query = query.filter(KnowledgeItem.category == "lessons")
        elif "tech" in cat_lower:
            query = query.filter(KnowledgeItem.category == "technologies")
        else:
            query = query.filter(KnowledgeItem.category == cat_lower)

    if search and search.strip():
        terms = [t.strip() for t in search.strip().split() if t.strip()]
        for t in terms:
            term_pat = f"%{t}%"
            query = query.filter(
                (KnowledgeItem.title.ilike(term_pat)) |
                (KnowledgeItem.content.ilike(term_pat)) |
                (KnowledgeItem.rationale_or_solution.ilike(term_pat)) |
                (KnowledgeItem.source.ilike(term_pat)) |
                (KnowledgeItem.category.ilike(term_pat))
            )

    items = query.order_by(KnowledgeItem.created_at.desc()).all()
    
    return [{
        "id": item.id,
        "project_id": item.project_id,
        "document_id": item.document_id,
        "category": item.category,
        "title": item.title,
        "content": item.content,
        "rationale_or_solution": item.rationale_or_solution,
        "source": item.source,
        "created_at": item.created_at.isoformat() if item.created_at else ""
    } for item in items]

@router.get("/{knowledge_id}")
def get_knowledge_item(knowledge_id: int, db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == knowledge_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return {
        "id": item.id,
        "project_id": item.project_id,
        "document_id": item.document_id,
        "category": item.category,
        "title": item.title,
        "content": item.content,
        "rationale_or_solution": item.rationale_or_solution,
        "source": item.source,
        "metadata_json": item.metadata_json,
        "created_at": item.created_at.isoformat() if item.created_at else ""
    }

@router.delete("/{knowledge_id}")
def delete_knowledge_item(knowledge_id: int, db: Session = Depends(get_db)):
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == knowledge_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    db.delete(item)
    db.commit()
    return {"message": "Knowledge item deleted"}
