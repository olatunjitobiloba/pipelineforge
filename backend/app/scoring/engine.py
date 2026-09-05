import json
import logging
from groq import Groq
from app.core.config import settings
from app.scoring.prompt import SYSTEM_PROMPT, build_user_message
from app.scoring.heuristic import heuristic_score

logger = logging.getLogger(__name__)


def score_prospect(prospect: dict) -> dict:
    """
    Score a prospect using Groq (llama-3.1-8b-instant).
    Falls back to heuristic_score on any failure.
    Returns: { "score": int, "breakdown": dict, "engine": "groq"|"heuristic" }
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — using heuristic scorer")
        result = heuristic_score(prospect)
        result["engine"] = "heuristic"
        return result

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": build_user_message(prospect)},
            ],
            temperature=0.1,       # low temp = consistent scoring
            max_tokens=256,
            timeout=10,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if model wraps in ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        parsed = json.loads(raw)

        score = int(parsed["score"])
        if not (0 <= score <= 100):
            raise ValueError(f"Score out of range: {score}")

        return {
            "score": score,
            "breakdown": parsed.get("breakdown", {}),
            "engine": "groq",
        }

    except json.JSONDecodeError as e:
        logger.error(f"Groq returned invalid JSON: {e} — falling back to heuristic")
    except Exception as e:
        logger.error(f"Groq scoring failed: {e} — falling back to heuristic")

    result = heuristic_score(prospect)
    result["engine"] = "heuristic"
    return result