from app.scoring.heuristic import heuristic_score
from app.scoring.engine import score_prospect
from unittest.mock import patch, MagicMock


FULL_PROSPECT = {
    "business_name": "Acme Roofing Services",
    "website_url": "https://acmeroofing.com",
    "phone": "08012345678",
    "email": "info@acme.com",
    "location": "Lagos",
}

EMPTY_PROSPECT = {
    "business_name": "X",
    "website_url": None,
    "phone": None,
    "email": None,
    "location": None,
}


# --- Heuristic tests ---

def test_heuristic_full_prospect_scores_high():
    result = heuristic_score(FULL_PROSPECT)
    assert result["score"] >= 70
    assert result["breakdown"]["has_website"] is True
    assert result["breakdown"]["has_phone"] is True


def test_heuristic_empty_prospect_scores_low():
    result = heuristic_score(EMPTY_PROSPECT)
    assert result["score"] <= 30


def test_heuristic_score_never_exceeds_100():
    result = heuristic_score(FULL_PROSPECT)
    assert 0 <= result["score"] <= 100


# --- Engine fallback tests ---

def test_engine_falls_back_to_heuristic_when_no_api_key():
    with patch("app.scoring.engine.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = ""
        result = score_prospect(FULL_PROSPECT)
        assert result["engine"] == "heuristic"
        assert 0 <= result["score"] <= 100


def test_engine_falls_back_on_groq_exception():
    with patch("app.scoring.engine.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = "fake-key"
        with patch("app.scoring.engine.Groq") as MockGroq:
            MockGroq.return_value.chat.completions.create.side_effect = Exception("timeout")
            result = score_prospect(FULL_PROSPECT)
            assert result["engine"] == "heuristic"


def test_engine_parses_valid_groq_response():
    mock_content = '{"score": 85, "breakdown": {"has_website": true, "has_phone": true, "has_email": true, "has_location": true, "name_clarity": "clear", "reasoning": "Strong profile."}}'
    with patch("app.scoring.engine.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = "fake-key"
        with patch("app.scoring.engine.Groq") as MockGroq:
            mock_choice = MagicMock()
            mock_choice.message.content = mock_content
            MockGroq.return_value.chat.completions.create.return_value.choices = [mock_choice]
            result = score_prospect(FULL_PROSPECT)
            assert result["score"] == 85
            assert result["engine"] == "groq"