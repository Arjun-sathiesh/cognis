from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Project, Document, KnowledgeItem, Feedback, ChatMessage

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_documents = db.query(Document).count()
    total_knowledge = db.query(KnowledgeItem).count()

    arch_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "architecture").count()
    standards_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "standards").count()
    defects_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "defects").count()
    lessons_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "lessons").count()
    tech_count = db.query(KnowledgeItem).filter(KnowledgeItem.category == "technologies").count()

    total_feedback = db.query(Feedback).count()
    helpful_feedback = db.query(Feedback).filter(Feedback.rating == "helpful").count()
    not_helpful_feedback = db.query(Feedback).filter(Feedback.rating == "not_helpful").count()
    helpfulness_rate = round((helpful_feedback / total_feedback * 100), 1) if total_feedback > 0 else 100.0

    recent_items = db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc()).limit(6).all()
    recent_formatted = [{
        "id": item.id,
        "title": item.title,
        "category": item.category,
        "source": item.source,
        "content_snippet": (item.content[:120] + "...") if len(item.content) > 120 else item.content,
        "created_at": item.created_at.isoformat() if item.created_at else ""
    } for item in recent_items]

    recent_projects = db.query(Project).order_by(Project.created_at.desc()).limit(4).all()
    projects_formatted = [{
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "status": p.status,
        "doc_count": db.query(Document).filter(Document.project_id == p.id).count(),
        "knowledge_count": db.query(KnowledgeItem).filter(KnowledgeItem.project_id == p.id).count()
    } for p in recent_projects]

    return {
        "totals": {
            "projects": total_projects,
            "documents": total_documents,
            "knowledge_items": total_knowledge,
            "architecture": arch_count,
            "standards": standards_count,
            "defects": defects_count,
            "lessons": lessons_count,
            "technologies": tech_count
        },
        "feedback": {
            "total": total_feedback,
            "helpful": helpful_feedback,
            "not_helpful": not_helpful_feedback,
            "helpfulness_rate": helpfulness_rate
        },
        "distribution": [
            {"category": "Architecture", "count": arch_count, "key": "architecture", "color": "emerald"},
            {"category": "Standards", "count": standards_count, "key": "standards", "color": "blue"},
            {"category": "Defects", "count": defects_count, "key": "defects", "color": "rose"},
            {"category": "Lessons", "count": lessons_count, "key": "lessons", "color": "amber"},
            {"category": "Technologies", "count": tech_count, "key": "technologies", "color": "purple"}
        ],
        "recent_knowledge": recent_formatted,
        "projects": projects_formatted
    }
