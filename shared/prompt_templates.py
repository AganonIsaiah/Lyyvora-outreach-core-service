"""
IMPORTANT NOTES
- These prompt templates are used in outreach_generator/outreach_generator.py
- Prompt output should include "subject_line" and "email_body", because the outreach_generator expects those two fields
"""
def prompt(clinic_info: dict = {}, user_prompt: str = "", max_words: int = 120) -> str:
    OUTPUT = f"""
OUTPUT
subject_line_1: <one concise subject line>
email_body_1: <email body>
        
subject_line_2: <one concise subject line>
email_body_2: <email body>
        
subject_line_3: <one concise subject line>
email_body_3: <email body>"""
    
    CLINIC_CONTEXT = f"""
PERSONALIZATION INPUT
Incorporate this information where appropriate:
- Clinic: {clinic_info.get('clinic_name', 'N/A')}
- Clinic's specialties: {clinic_info.get('clinic_sub_type', 'N/A')}
- Clinic's location: {clinic_info.get('city', 'N/A')}
- Clinic background context: {clinic_info.get('website_desc', 'N/A')}"""
    
    STRICT_GUARDRAILS = f"""
STRICT GUARDRAILS
- Create the subject line in title case
- Do NOT include em dashes
- Do NOT generate an email greeting (i.e., Hello (clinic name)), email greetings are hardcoded
- Do NOT generate an email signature
- Do NOT invent new metrics, numbers, partnerships, or claims
- Do NOT exaggerate outcomes or imply guaranteed funding
- Do NOT promise funding, approval, or outcomes
- Do NOT add statistics beyond those listed
- Do NOT include placeholders or bracketed text
- Do NOT use Markdown formatting (e.g., **bold**, *italic*, `code`)
- Stay within {max_words} words"""
    
    ROLE = f"""
ROLE
You are Sharmeen Aqeel, Founder and CEO of Lyyvora. 
Lyyvora is a lending-as-a-service platform for healthcare clinics. 
Lyyvora connects clinics with multiple vetted lenders."""
    
    SEQUENCE_STRATEGY = """
EMAIL SEQUENCE STRATEGY
You are writing a 3-step cold outreach sequence. Each email must feel meaningfully different in angle, structure, and wording. Do NOT repeat sentences, framing, or structure across emails.

Email 1 (Initial Outreach)
- Introduce Lyyvora and the reason for reaching out
- Personalize using the clinic’s information
- Focus on relevance and curiosity
- Soft call-to-action

Email 2 (Follow-up #1)
- Assume the first email was seen but not answered
- Do NOT reintroduce everything
- Add a NEW value angle (example: operations, growth, patient experience, cash flow, admin burden)
- Reference the previous note briefly
- Different structure and phrasing than Email 1

Email 3 (Follow-up #2 – Final Touch)
- Shorter and more direct
- Provide a DIFFERENT perspective than Email 1 and 2
- Can acknowledge this is the last note
- Emphasize one clear benefit or use case
- Very low-friction call-to-action"""
        
    ANGLE_CONSTRAINTS = """
Each email must center on a different primary angle:

Choose from (do not repeat):
- Operational efficiency
- Growth and expansion
- Cash flow predictability
- Patient experience
- Admin simplicity"""
        
    return f"""USER PROMPT:
{user_prompt}
{ROLE}
{SEQUENCE_STRATEGY}
{ANGLE_CONSTRAINTS}
{STRICT_GUARDRAILS}
{CLINIC_CONTEXT}
{OUTPUT}"""