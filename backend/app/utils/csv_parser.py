import csv
import io
from app.models.prospect import ProspectCSVRow


# Accepted column name aliases — handles messy real-world CSVs
COLUMN_MAP = {
    "business_name": ["business_name", "business name", "company", "company name", "name"],
    "website_url":   ["website_url", "website", "url", "web"],
    "phone":         ["phone", "phone number", "tel", "telephone", "mobile"],
    "email":         ["email", "email address", "e-mail"],
    "location":      ["location", "city", "address", "area"],
}


def normalize_headers(raw_headers: list[str]) -> dict[str, str]:
    """Map raw CSV headers to canonical field names."""
    mapping = {}
    for canonical, aliases in COLUMN_MAP.items():
        for header in raw_headers:
            if header.strip().lower() in aliases:
                mapping[header.strip()] = canonical
                break
    return mapping


def parse_csv(file_bytes: bytes) -> tuple[list[dict], list[str]]:
    """
    Parse CSV bytes into validated rows.
    Returns (valid_rows, errors).
    Skips rows where business_name is missing.
    """
    # Decode Excel exports and remove any leading BOM characters. The latter
    # also handles bytes produced from text that already included a BOM.
    content = file_bytes.decode("utf-8-sig").lstrip("\ufeff")
    reader = csv.DictReader(io.StringIO(content))

    if not reader.fieldnames:
        return [], ["CSV file has no headers"]

    header_map = normalize_headers(list(reader.fieldnames))

    if "business_name" not in header_map.values():
        return [], [
            f"CSV must have a 'business_name' (or 'company', 'name') column. "
            f"Found: {list(reader.fieldnames)}"
        ]

    valid_rows = []
    errors = []

    for i, raw_row in enumerate(reader, start=2):  # row 1 is header
        normalized = {
            header_map[k]: v.strip()
            for k, v in raw_row.items()
            if k.strip() in header_map and v and v.strip()
        }

        if not normalized.get("business_name"):
            errors.append(f"Row {i}: missing business_name — skipped")
            continue

        try:
            validated = ProspectCSVRow(**normalized)
            valid_rows.append(validated.model_dump(exclude_none=True))
        except Exception as e:
            errors.append(f"Row {i}: {str(e)} — skipped")

    return valid_rows, errors
