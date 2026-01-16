from core.lead_scoring_model.rules_based_baseline import rules_based_score


def test_only_valid_phone():
    lead = {"phone": "1234567890"}
    result = rules_based_score(lead)
    assert result["score"] == 10
    assert "Has valid phone number." in result["top_features"]


def test_only_valid_email():
    lead = {"email": "test@example.com"}
    result = rules_based_score(lead)
    assert result["score"] == 20
    assert "Has valid email address." in result["top_features"]


def test_only_website_desc():
    lead = {"website_desc": "mock desc"}
    result = rules_based_score(lead)
    assert result["score"] == 20


def test_only_website():
    lead = {"website_url": "http://example.com"}
    result = rules_based_score(lead)
    assert result["score"] == 10
    assert "Has valid website url." in result["top_features"]


def test_reviews_rating():
    lead = {"total_reviews": 35, "average_rating": 4.7}
    result = rules_based_score(lead)
    assert result["score"] == 20
    assert "Has at least 30 reviews." in result["top_features"]
    assert "Has an average rating of at least 4.5." in result["top_features"]


def test_reviews_rating_below_threshold():
    lead = {"total_reviews": 10, "average_rating": 4.0}
    result = rules_based_score(lead)
    assert result["score"] == 0
    assert result["top_features"] == []


def test_subtypes_dental_physio():
    lead = {"clinic_sub_type": "Dental, Physio"}
    result = rules_based_score(lead)
    assert result["score"] == 20
    assert "Matched subtypes: Dental, Physio" in result["top_features"][0]


def test_subtypes_no_match():
    lead = {"clinic_sub_type": "Yoga, Massage"}
    result = rules_based_score(lead)
    assert result["score"] == 0
    assert result["top_features"] == []


def test_mixed_lead():
    lead = {
        "phone": "1234567890",
        "email": "test@example.com",
        "clinic_sub_type": "Spa, Massage",
    }
    result = rules_based_score(lead)
    assert result["score"] == 40
    assert "Has valid phone number." in result["top_features"]
    assert "Has valid email address." in result["top_features"]
    assert "Matched subtypes: Spa" in result["top_features"][-1]
