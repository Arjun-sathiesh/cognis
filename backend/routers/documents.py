from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, Document
from services.parser import parse_uploaded_file

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/project/{project_id}")
def get_project_documents(project_id: int, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.project_id == project_id).order_by(Document.created_at.desc()).all()
    return [{
        "id": d.id,
        "project_id": d.project_id,
        "filename": d.filename,
        "file_type": d.file_type,
        "file_size": d.file_size,
        "created_at": d.created_at.isoformat() if d.created_at else ""
    } for d in docs]

@router.post("/project/{project_id}/upload")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_bytes = await file.read()
    filename = file.filename or "document.txt"
    content_text = parse_uploaded_file(filename, file_bytes)

    doc = Document(
        project_id=project.id,
        filename=filename,
        file_type=file.content_type or "text/plain",
        file_size=len(file_bytes),
        content=content_text
    )
    db.add(doc)
    # If the project was already analyzed, mark as pending re-analysis
    project.status = "Pending"
    db.commit()
    db.refresh(doc)

    return {
        "message": "Document uploaded successfully.",
        "id": doc.id,
        "filename": doc.filename,
        "file_size": doc.file_size
    }

@router.get("/{document_id}/content")
def get_document_content(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "content": doc.content
    }

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
