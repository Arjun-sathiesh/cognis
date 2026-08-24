import os
import glob
from sqlalchemy.orm import Session
from models import Project, Document, KnowledgeItem, ChatMessage, Feedback
from services.extractor import extract_knowledge_from_document
from services.parser import parse_uploaded_file

SAMPLE_DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_docs"))

def seed_sample_fintrack_project(db: Session, force: bool = False) -> Project:
    """
    Creates or re-seeds the sample 'FinTrack' project with all realistic engineering docs and extracted knowledge.
    """
    existing = db.query(Project).filter(Project.name.ilike("%FinTrack%")).first()
    if existing and not force:
        return existing

    if existing and force:
        db.delete(existing)
        db.commit()

    project = Project(
        name="FinTrack",
        description="Personal finance management application and high-throughput wealth tracking platform.",
        status="Analyzed"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    doc_files = glob.glob(os.path.join(SAMPLE_DOCS_DIR, "*.*"))
    for file_path in doc_files:
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        text_content = parse_uploaded_file(filename, file_bytes)
        
        doc = Document(
            project_id=project.id,
            filename=filename,
            file_type="text/markdown" if filename.endswith(".md") else "text/plain",
            file_size=len(file_bytes),
            content=text_content
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Extract structured knowledge
        items = extract_knowledge_from_document(filename, text_content)
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
        db.commit()

    return project
