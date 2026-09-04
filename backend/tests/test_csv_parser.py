from app.utils.csv_parser import parse_csv


def make_csv(header: str, *rows: str) -> bytes:
    lines = [header] + list(rows)
    return "\n".join(lines).encode("utf-8")


def test_standard_headers_parse_correctly():
    csv_bytes = make_csv(
        "business_name,website,phone,email,city",
        "Acme Roofing,https://acme.com,08012345678,acme@test.com,Lagos",
        "Lagos Gutters,,,,Ikeja",
    )
    rows, errors = parse_csv(csv_bytes)
    assert len(rows) == 2
    assert rows[0]["business_name"] == "Acme Roofing"
    assert rows[0]["website_url"] == "https://acme.com"
    assert len(errors) == 0


def test_alias_headers_are_normalized():
    csv_bytes = make_csv(
        "company name,url,telephone",
        "Test Corp,https://test.com,07011111111",
    )
    rows, errors = parse_csv(csv_bytes)
    assert len(rows) == 1
    assert rows[0]["business_name"] == "Test Corp"


def test_rows_missing_business_name_are_skipped():
    csv_bytes = make_csv(
        "business_name,phone",
        ",08099999999",
        "Valid Biz,08088888888",
    )
    rows, errors = parse_csv(csv_bytes)
    assert len(rows) == 1
    assert len(errors) == 1
    assert "missing business_name" in errors[0]


def test_missing_required_column_returns_error():
    csv_bytes = make_csv(
        "phone,email",
        "08012345678,test@test.com",
    )
    rows, errors = parse_csv(csv_bytes)
    assert len(rows) == 0
    assert len(errors) == 1
    assert "business_name" in errors[0]


def test_excel_bom_is_handled():
    # Excel CSVs often have a BOM prefix (\ufeff)
    csv_bytes = "\ufeffbusiness_name,phone\nBOM Corp,08011111111".encode("utf-8-sig")
    rows, errors = parse_csv(csv_bytes)
    assert len(rows) == 1