def heuristic_score(prospect: dict) -> dict:
    """
    Zero-dependency fallback scorer.
    Used when Groq is unavailable or rate-limited.
    Returns same shape as LLM scorer.
    """
    score = 0
    has_website = bool(prospect.get("website_url"))
    has_phone   = bool(prospect.get("phone"))
    has_email   = bool(prospect.get("email"))
    has_location = bool(prospect.get("location"))

    if has_website:  score += 25
    if has_phone:    score += 25
    if has_email:    score += 20
    if has_location: score += 10

    name = prospect.get("business_name", "")
    name_clarity = "vague"
    if len(name) > 5 and any(c.isalpha() for c in name):
        name_clarity = "generic"
    if len(name.split()) >= 2:
        name_clarity = "clear"
        score += 20

    score = min(score, 100)

    return {
        "score": score,
        "breakdown": {
            "has_website": has_website,
            "has_phone": has_phone,
            "has_email": has_email,
            "has_location": has_location,
            "name_clarity": name_clarity,
            "reasoning": "Heuristic score — Groq unavailable or rate-limited.",
        },
    }
