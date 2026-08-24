from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.sample_seeder import seed_sample_fintrack_project

router = APIRouter(prefix="/api/sample-data", tags=["sample-data"])

@router.post("/seed")
def seed_sample(db: Session = Depends(get_db)):
    """
    Seeds the FinTrack sample project and extracts all engineering knowledge.
    """
    try:
        project = seed_sample_fintrack_project(db, force=True)
        return {
            "message": "Sample FinTrack project seeded and analyzed successfully!",
            "project_id": project.id,
            "project_name": project.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed sample project: {str(e)}")
