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
        "language": "en",
        "hero_badge": "Adaptive Knowledge Grid",
        "site_title": "Kokan Library",
        "sections": {
            "hero": {
                "enabled": True,
                "order": 0,
                "title": "Welcome to the future of the library",
                "subtitle": "A modern, intelligent reading experience",
                "description": "Main landing intro and spotlight area",
                "badge": "Adaptive Knowledge Grid",
                "cta_label": "Explore the catalog",
                "primary_cta_label": "Explore the catalog",
                "primary_cta_url": "/books",
                "secondary_cta_label": "Request access",
                "secondary_cta_url": "/contact",
            },
            "search": {
                "enabled": True,
                "order": 1,
                "title": "Library Search",
                "subtitle": "Find books, authors, and collections",
                "description": "Search, filters, and discovery tools",
            },
            "featured": {
                "enabled": True,
                "order": 2,
                "title": "Library Highlights",
                "subtitle": "Recommended by the library team",
                "description": "Curated recommended titles",
            },
            "catalog": {
                "enabled": True,
                "order": 3,
                "title": "Explore the Library",
                "subtitle": "Browse the full collection",
                "description": "Main book browsing grid",
            },
            "posts": {
                "enabled": True,
                "order": 4,
                "title": "Latest Announcements",
                "subtitle": "News and updates",
                "description": "News and latest updates",
            },
            "donation": {
                "enabled": True,
                "order": 5,
                "title": "Support the Library",
                "subtitle": "Help the library grow",
                "description": "Support and donation block",
            },
        },
        "layout": {
            "show_stats": True,
            "show_trending": True,
            "show_favorites": True,
            "show_search_strip": True,
            "show_featured_books": True,
            "show_donation_panel": True,
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
