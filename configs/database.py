import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or None
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or None

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
