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


    
def test_placeholder():
    assert 1 == 1