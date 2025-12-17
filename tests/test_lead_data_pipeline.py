from core.lead_data_pipeline.lead_data_pipeline import (
    clean_text,
    clean_phone,
    get_primary_email,
    clean_website,
    normalize_province
)

# -------------------------------
# clean_text tests
# -------------------------------
def test_clean_text_basic():
    assert clean_text("  hello world  ") == "hello world"
    assert clean_text("Dr. O'Brien") == "Dr. O'Brien"

def test_clean_text_none():
    assert clean_text(None) is None

# -------------------------------
# clean_phone tests
# -------------------------------
def test_clean_phone_valid():
    expected = "2345678901"
    assert clean_phone("234-567-8901") == expected
    assert clean_phone("234.567.8901") == expected
    assert clean_phone("234 567-8901") == expected
    assert clean_phone("234.567 8901") == expected
    assert clean_phone("234-567 8901") == expected
    assert clean_phone("(234) 567-8901") == expected
    assert clean_phone("1-234-567-8901") == expected
    assert clean_phone("+1 (234) 567-8901") == expected

def test_clean_phone_invalid():
    assert clean_phone("123") is None
    assert clean_phone("abcdefghij") is None
    assert clean_phone(None) is None

# -------------------------------
# get_primary_email tests
# -------------------------------
def test_get_primary_email_valid():
    assert get_primary_email("Test@Example.com ", None) == "test@example.com"
    assert get_primary_email(None, "second@example.com") == "second@example.com"

def test_get_primary_email_invalid():
    assert get_primary_email("invalid-email", None) is None
    assert get_primary_email(None, "not-an-email") is None
    assert get_primary_email(None, None) is None

# -------------------------------
# clean_website tests
# -------------------------------
def test_clean_website_valid():
    assert clean_website("https://example.com") == "https://example.com"
    assert clean_website("example.com") == "example.com"

def test_clean_website_invalid():
    assert clean_website(None) is None
    assert clean_website("  ") is None
    assert clean_website("invalid url") is None

# -------------------------------
# normalize_province tests
# -------------------------------
def test_normalize_province_known():
    assert normalize_province("ON") == "ON"
    assert normalize_province("Ontario") == "ON"
    assert normalize_province("québec") == "QC"
    assert normalize_province("Newfoundland and Labrador") == "NL"

def test_normalize_province_unknown():
    assert normalize_province("XYZ") == "XYZ"

def test_normalize_province_none():
    assert normalize_province(None) is None
