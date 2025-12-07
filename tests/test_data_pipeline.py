import pytest
from lead_data_pipeline.data_pipeline import clean_text, clean_phone, clean_email, clean_website, normalize_province

# -------------------------------
# clean_text tests
# -------------------------------
def test_basic_capitalization():
    assert clean_text("hello world") == "Hello World"
    assert clean_text("dr. o'brien's clinic") == "Dr. O'Brien's Clinic"
    assert clean_text("o'malley hospital") == "O'Malley Hospital"
    assert clean_text("the queen of hearts") == "The Queen of Hearts"
    assert clean_text("and the world") == "And the World"

def test_none_input_clean_text():
    assert clean_text(None) is None

# -------------------------------
# clean_phone tests
# -------------------------------
def test_valid_phone():
    expected_res = "1234567890"
    assert clean_phone("(123) 456-7890") == expected_res
    assert clean_phone("123.456.7890") == expected_res
    assert clean_phone("123-456-7890") == expected_res
    assert clean_phone("+1 (123) 456-7890") == expected_res

def test_invalid_phone():
    assert clean_phone("123-45") is None
    assert clean_phone("abcde") is None
    
def test_none_input_clean_phone():
    assert clean_phone(None) is None

# -------------------------------
# clean_email tests
# -------------------------------
def test_valid_email():
    assert clean_email("Test@Example.com ") == "test@example.com"

def test_invalid_email():
    assert clean_email("not-an-email") is None

def test_none_input_clean_email():
    assert clean_email(None) is None

# -------------------------------
# clean_website tests
# -------------------------------
def test_website_cleaning():
    assert clean_website("example.com") == "https://example.com"
    assert clean_website("https://example.com") == "https://example.com"

def test_none_input_clean_website():
    assert clean_website(None) is None

def test_empty_string_clean_website():
    assert clean_website("  ") is None

# -------------------------------
# normalize_province tests
# -------------------------------
def test_known_province_codes():
    assert normalize_province("ON") == "ON"
    assert normalize_province("Ontario") == "ON"
    assert normalize_province("québec") == "QC"

def test_unknown_province():
    assert normalize_province("XYZ") == "XYZ"

def test_none_input_normalize_province():
    assert normalize_province(None) is None