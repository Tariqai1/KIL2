import copy
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import require_permission
from database import get_db
from models import user_model

router = APIRouter()

SETTINGS_FILE = Path(__file__).resolve().parent.parent / "static" / "homepage_settings.json"


def get_default_homepage_settings():
    return {
        "theme": "aurora",
        "sections": {
            "hero": {"enabled": True, "title": "Welcome to the future of the library"},
            "search": {"enabled": True, "title": "Library Search"},
            "featured": {"enabled": True, "title": "Library Highlights"},
            "catalog": {"enabled": True, "title": "Explore the Library"},
            "posts": {"enabled": True, "title": "Latest Announcements"},
            "donation": {"enabled": True, "title": "Support the Library"},
        },
        "layout": {
            "show_stats": True,
            "show_trending": True,
            "show_favorites": True,
        },
    }


def _load_settings_from_disk():
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not SETTINGS_FILE.exists():
        _write_settings_to_disk(get_default_homepage_settings())
        return get_default_homepage_settings()

    try:
        with SETTINGS_FILE.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError):
        return get_default_homepage_settings()


def _write_settings_to_disk(payload):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with SETTINGS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def _merge_settings(payload: dict):
    merged = copy.deepcopy(get_default_homepage_settings())
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid payload")

    for key, value in payload.items():
        if key == "sections" and isinstance(value, dict):
            merged_sections = copy.deepcopy(merged.get("sections", {}))
            for section_key, section_value in value.items():
                if isinstance(section_value, dict):
                    merged_sections[section_key] = {**merged_sections.get(section_key, {}), **section_value}
                else:
                    merged_sections[section_key] = section_value
            merged["sections"] = merged_sections
        elif key == "layout" and isinstance(value, dict):
            merged_layout = copy.deepcopy(merged.get("layout", {}))
            merged_layout.update(value)
            merged["layout"] = merged_layout
        else:
            merged[key] = value

    return merged


@router.get("/homepage-settings", tags=["Homepage Settings"])
def get_homepage_settings(db: Session = Depends(get_db)):
    return _load_settings_from_disk()


@router.put("/homepage-settings", tags=["Homepage Settings"])
def update_homepage_settings(payload: dict, db: Session = Depends(get_db), current_user: user_model.User = Depends(require_permission("BOOK_MANAGE"))):
    merged = _merge_settings(payload)
    _write_settings_to_disk(merged)
    return {"message": "Homepage settings updated", "settings": merged}
