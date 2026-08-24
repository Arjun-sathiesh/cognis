from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Project, Document, KnowledgeItem
from services.extractor import extract_knowledge_from_document

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    document_count: int
    knowledge_count: int
    created_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        doc_count = db.query(Document).filter(Document.project_id == p.id).count()
        k_count = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == p.id).count()
        results.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            status=p.status,
            document_count=doc_count,
            knowledge_count=k_count,
            created_at=p.created_at.isoformat() if p.created_at else ""
        ))
    return results

@router.post("", response_model=ProjectResponse)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=payload.name,
        description=payload.description,
        status="Pending"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        document_count=0,
        knowledge_count=0,
        created_at=project.created_at.isoformat() if project.created_at else ""
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    doc_count = db.query(Document).filter(Document.project_id == project.id).count()
    k_count = db.query(KnowledgeItem).filter(KnowledgeItem.project_id == project.id).count()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        document_count=doc_count,
        knowledge_count=k_count,
        created_at=project.created_at.isoformat() if project.created_at else ""
    )

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/analyze")
def analyze_project(project_id: int, db: Session = Depends(get_db)):
    """
    Triggers AI knowledge extraction across all documents belonging to this project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "Analyzing"
    db.commit()

    documents = db.query(Document).filter(Document.project_id == project.id).all()
    if not documents:
        project.status = "Pending"
        db.commit()
        return {"message": "No documents found to analyze", "extracted_count": 0}

    # Delete existing knowledge items for fresh re-analysis
    db.query(KnowledgeItem).filter(KnowledgeItem.project_id == project.id).delete()
    db.commit()

    total_extracted = 0
    for doc in documents:
        try:
            items = extract_knowledge_from_document(doc.filename, doc.content)
            for item in items:
                k_item = KnowledgeItem(
                    project_id=project.id,
                    document_id=doc.id,
                    category=item["category"],
                    title=item["title"],
                    content=item["content"],
                    rationale_or_solution=item["rationale_or_solution"],
                    source=item["source"],
                    metadata_json=item.get("metadata_json")
                )
                db.add(k_item)
                total_extracted += 1
            db.commit()
        except Exception as e:
            print(f"Error extracting from {doc.filename}: {e}")

    project.status = "Analyzed"
    db.commit()

    return {
        "message": "Knowledge extraction completed successfully.",
        "project_id": project.id,
        "status": "Analyzed",
        "extracted_count": total_extracted
    }
