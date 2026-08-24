import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")  # Pending, Analyzing, Analyzed, Error
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    knowledge_items = relationship("KnowledgeItem", back_populates="project", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="text/plain")
    file_size = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    knowledge_items = relationship("KnowledgeItem", back_populates="document", cascade="all, delete-orphan")

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    category = Column(String(50), nullable=False, index=True) # architecture, standards, defects, lessons, technologies
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    rationale_or_solution = Column(Text, nullable=True)
    source = Column(String(255), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="knowledge_items")
    document = relationship("Document", back_populates="knowledge_items")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    mode = Column(String(50), default="Architecture") # Requirements, Architecture, Debugging, Code Review, Planning
    role = Column(String(20), nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True) # JSON list of cited items/docs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="chat_messages")
    feedbacks = relationship("Feedback", back_populates="message", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    rating = Column(String(20), nullable=False) # helpful, not_helpful
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    message = relationship("ChatMessage", back_populates="feedbacks")

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
