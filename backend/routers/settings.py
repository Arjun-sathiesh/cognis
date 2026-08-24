import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
from database import get_db
from models import AppSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    default_provider: Optional[str] = "anthropic"

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    keys = {
        "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY", "").strip()),
        "openai": bool(os.environ.get("OPENAI_API_KEY", "").strip()),
        "gemini": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
        "groq": bool(os.environ.get("GROQ_API_KEY", "").strip()),
        "openrouter": bool(os.environ.get("OPENROUTER_API_KEY", "").strip()),
    }
    
    # Check database stored keys
    db_keys = db.query(AppSetting).all()
    db_dict = {item.key: item.value for item in db_keys}

    active_provider = db_dict.get("default_provider", "anthropic")
    
    return {
        "providers_available": {
            "anthropic": keys["anthropic"] or bool(db_dict.get("anthropic_api_key")),
            "openai": keys["openai"] or bool(db_dict.get("openai_api_key")),
            "gemini": keys["gemini"] or bool(db_dict.get("gemini_api_key")),
            "groq": keys["groq"] or bool(db_dict.get("groq_api_key")),
            "openrouter": keys["openrouter"] or bool(db_dict.get("openrouter_api_key")),
        },
        "active_provider": active_provider,
        "database_type": "SQLite (Local Storage & Vector Matching)"
    }

@router.post("")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    if payload.anthropic_api_key is not None:
        os.environ["ANTHROPIC_API_KEY"] = payload.anthropic_api_key
        set_db_setting(db, "anthropic_api_key", payload.anthropic_api_key)
    if payload.openai_api_key is not None:
        os.environ["OPENAI_API_KEY"] = payload.openai_api_key
        set_db_setting(db, "openai_api_key", payload.openai_api_key)
    if payload.gemini_api_key is not None:
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key
        set_db_setting(db, "gemini_api_key", payload.gemini_api_key)
    if payload.groq_api_key is not None:
        os.environ["GROQ_API_KEY"] = payload.groq_api_key
        set_db_setting(db, "groq_api_key", payload.groq_api_key)
    if payload.openrouter_api_key is not None:
        os.environ["OPENROUTER_API_KEY"] = payload.openrouter_api_key
        set_db_setting(db, "openrouter_api_key", payload.openrouter_api_key)
    if payload.default_provider:
        set_db_setting(db, "default_provider", payload.default_provider)

    return {"message": "Settings updated successfully"}

def set_db_setting(db: Session, key: str, value: str):
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = AppSetting(key=key, value=value)
        db.add(setting)
    db.commit()
