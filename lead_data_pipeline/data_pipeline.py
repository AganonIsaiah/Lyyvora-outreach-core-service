import pandas as pd 
import re 
import os 

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  
INPUT_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "mock_dirty_data.csv")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "mock_data_sets", "mock_cleaned_data.csv")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"
PHONE_REGEX = r"\d{10}"

def clean_email(email: str):
    if not isinstance(email, str): return None 
    
    email = email.strip().lower()
    return email if re.match(EMAIL_REGEX, email) else None 

def clean_phone(phone: str):
    if not isinstance(phone, str):
        return None 
    
    digits = re.sub(r"\D","",phone) # replace non-digit numbers
    return digits if re.fullmatch(PHONE_REGEX, digits) else None 

def clean_website(site: str):
    if not isinstance(site, str) or site in ["", " ", None]:
        return None 
    
    site = site.strip().lower()
    if not site.startswith("http"):
        site = "https://" + site 
        
    return site

def clean_text(s: str):
    return s.strip().title() if isinstance(s, str) else s 

# Standardizes provinces to abbreviations (i.e., Ontario becomes ON)
def normalize_province(p: str):
    if not isinstance(p, str): return None 
    
    p = p.strip().upper()
    
    lookup = {
        "ON": "ON", "ONTARIO": "ON",
        "BC": "BC", "BRITISH COLUMBIA": "BC",
        "AB": "AB", "ALBERTA": "AB",
        "MB": "MB", "MANITOBA": "MB",
        "SK": "SK", "SASKATCHEWAN": "SK",
        "NS": "NS", "NOVA SCOTIA": "NS",
        "QC": "QC", "QUEBEC": "QC",
    }
    
    return lookup.get(p, p)

def main():
    df = pd.read_csv(INPUT_FILE)
    
    df["clinic_name"] = df["clinic_name"].apply(clean_text)
    df["specialty"] = df["specialty"].apply(clean_text)
    df["city"] = df["city"].apply(clean_text)
    df["province"] = df["province"].apply(normalize_province)
    df["phone"] = df["phone"].apply(clean_phone)
    df["website"] = df["website"].apply(clean_website)
    df["email"] = df["email"].apply(clean_email)
    
    # remove rows missing essential outreach fileds
    df = df.dropna(subset=["clinic_name", "email"])

    # dedupe using clinic name + city combination
    df = df.drop_duplicates(subset=["clinic_name", "city"], keep="first")
    
    # dedupe by dropping rows with the same phone number
    df = df.drop_duplicates(subset=["phone"], keep="first")

    # reorder for consistency
    df = df[["clinic_name", "specialty", "city", "province", "phone", "website", "email", "notes"]]

    df.to_csv(OUTPUT_FILE, index=False)
    print("Cleaning complete!")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()