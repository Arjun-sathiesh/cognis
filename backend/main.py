import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import Project
from services.sample_seeder import seed_sample_fintrack_project

# Import routers
from routers import projects, documents, knowledge, assistant, feedback, stats, sample_data, settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cognis API",
    description="Organizational Memory & Software Engineering Intelligence Platform",
    version="1.0.0"
)

# Enable CORS for React frontend (default vite port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(knowledge.router)
app.include_router(assistant.router)
app.include_router(feedback.router)
app.include_router(stats.router)
app.include_router(sample_data.router)
app.include_router(settings.router)

@app.on_event("startup")
def startup_event():
    # Automatically seed FinTrack sample project if database has 0 projects
    db = SessionLocal()
    try:
        count = db.query(Project).count()
        if count == 0:
            print("[Cognis Startup] Seeding sample FinTrack project...")
            seed_sample_fintrack_project(db)
            print("[Cognis Startup] FinTrack seeded successfully.")
    except Exception as e:
        print(f"[Cognis Startup] Seeding check: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Cognis Organizational Intelligence API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
