from controllers import settings_controller


def test_default_homepage_settings_include_sections_and_theme():
    settings = settings_controller.get_default_homepage_settings()

    assert settings["theme"] in {"day", "night", "aurora"}
    assert settings["sections"]["hero"]["enabled"] is True
    assert settings["sections"]["search"]["enabled"] is True
    assert settings["sections"]["posts"]["enabled"] is True
