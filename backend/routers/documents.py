from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, Document
from services.parser import parse_uploaded_file

router = APIRouter(prefix="/api/documents", tags=["documents"])

SUPPORTED_EXTENSIONS = {"md", "txt", "json", "yaml", "yml", "pdf", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024

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

    filename = file.filename or "document.txt"
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported document type")

    file_buffer = bytearray()
    chunk_size = 1024 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_buffer.extend(chunk)
        if len(file_buffer) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be less than 10 MB")

    if not file_buffer:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_bytes = bytes(file_buffer)

    content_text = parse_uploaded_file(filename, file_bytes)
    if not content_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file has no extractable content")

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
