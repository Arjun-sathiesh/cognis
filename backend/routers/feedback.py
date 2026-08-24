from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Feedback, ChatMessage

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackCreate(BaseModel):
    message_id: int
    rating: str # helpful, not_helpful
    comment: Optional[str] = None

@router.post("")
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == payload.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Update existing feedback if present or create new
    fb = db.query(Feedback).filter(Feedback.message_id == payload.message_id).first()
    if fb:
        fb.rating = payload.rating
        fb.comment = payload.comment
    else:
        fb = Feedback(
            message_id=payload.message_id,
            rating=payload.rating,
            comment=payload.comment
        )
        db.add(fb)

    db.commit()
    db.refresh(fb)

    return {
        "message": "Feedback recorded successfully",
        "id": fb.id,
        "rating": fb.rating
    }

@router.get("/stats")
def get_feedback_stats(db: Session = Depends(get_db)):
    total = db.query(Feedback).count()
    helpful = db.query(Feedback).filter(Feedback.rating == "helpful").count()
    not_helpful = db.query(Feedback).filter(Feedback.rating == "not_helpful").count()
    
    rate = round((helpful / total * 100), 1) if total > 0 else 100.0

    return {
        "total": total,
        "helpful": helpful,
        "not_helpful": not_helpful,
        "helpfulness_rate": rate
    }

@router.get("/list")
def get_feedback_list(limit: int = 20, db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(limit).all()
    results = []
    for f in feedbacks:
        msg_snippet = f.message.content[:100] + "..." if f.message and len(f.message.content) > 100 else (f.message.content if f.message else "")
        results.append({
            "id": f.id,
            "message_id": f.message_id,
            "rating": f.rating,
            "comment": f.comment,
            "message_snippet": msg_snippet,
            "created_at": f.created_at.isoformat() if f.created_at else ""
        })
    return results
