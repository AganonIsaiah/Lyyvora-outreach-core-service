class Queries:
   
  @staticmethod
  def get_top_clinics_for_outreach(limit: int = 10, offset: int = 0) -> str:  
    return f"""
      SELECT l.clinic_name, l.clinic_sub_type, l.city, l.website_desc 
      FROM leads l
      LEFT JOIN lead_scores s 
      ON l.id = s.leads_id 
      ORDER BY s.score DESC
      LIMIT {limit}
      OFFSET {offset};
    """

  @staticmethod
  def get_leads() -> str: 
    return f"""
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinic_name TEXT NOT NULL,
        clinic_main_type TEXT,
        clinic_sub_type TEXT,
        city TEXT,
        province TEXT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        website_url TEXT,
        website_desc TEXT,
        total_reviews INTEGER,
        average_rating REAL
      );
    """