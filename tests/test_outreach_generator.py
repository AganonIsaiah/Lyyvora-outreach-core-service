import os
import pytest
from core.outreach_generator.outreach_generator import generate_email

clinic_info_example = {
    "clinic_name": "Smile Dental",
    "clinic_sub_type": "Dental",
    "city": "Toronto",
    "website_desc": "Providing high-quality dental care since 2010",
    "bank_ready_offer": "Flexible financing options for clinic upgrades",
    "risk_reversal": "No upfront fees until financing is approved"
}

@pytest.mark.skipif(
    not bool(os.environ.get("OLLAMA_API")), 
    reason="OLLAMA_API environment variable not set"
)
def test_generate_email_real():
    email = generate_email(clinic_info_example)
    
    # Print the response to console
    print("\nGenerated Email:\n", email)
    
    # Basic assertions
    assert isinstance(email, str)
    assert "Smile Dental" in email
    assert len(email) > 0
    assert "approval" not in email.lower()  # check guardrails
