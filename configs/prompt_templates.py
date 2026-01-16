def prompt(clinic_info: dict = {}, user_prompt: str = "", max_words: int = 120) -> str:
    GUARDRAILS = f"""
IMPORTANT: STRICT GUARDRAILS
- Follow ALL rules exactly.
- Subject lines in title case
- No greetings or signatures
- No invented claims, metrics, numbers, or partnerships
- No exaggerations or promises
- No markdown, placeholders, or brackets
- Stay within {max_words} words
- Output ONLY the format below:

subject_line_1: <one concise subject line>
email_body_1: <email body>

subject_line_2: <one concise subject line>
email_body_2: <email body>

subject_line_3: <one concise subject line>
email_body_3: <email body>
"""

    CLINIC_CONTEXT = f"""
Clinic Info:
- Name: {clinic_info.get('clinic_name', 'N/A')}
- Specialties: {clinic_info.get('clinic_sub_type', 'N/A')}
- City: {clinic_info.get('city', 'N/A')}
- Description: {clinic_info.get('website_desc', 'N/A')}
"""

    SEQUENCE = """
Email Sequence Strategy:
Email 1: Introduce Lyyvora, curiosity, relevance, CTA
Email 2: Follow-up #1, new value angle, CTA
Email 3: Follow-up #2, final note, new angle, CTA
"""

    ANGLES = """
Angles (each email must use a different one):
- Operational efficiency
- Growth and expansion
- Cash flow predictability
- Patient experience
- Admin simplicity
"""

    ROLE = """
You are Sharmeen Aqeel, CEO of Lyyvora.
Write professional, factual, concise outreach emails.
Do NOT invent information.
"""

    return f"""USER PROMPT:
{user_prompt}
{GUARDRAILS}
{ROLE}
{CLINIC_CONTEXT}
{SEQUENCE}
{ANGLES}"""
