class Queries:
   
  @staticmethod
  def get_top_clinics_for_outreach(limit: int = 10, offset: int = 0) -> str:  
    return f"""
      SELECT l.clinic_name, l.email, l.clinic_sub_type, l.city, l.province, l.website_desc 
      FROM leads l
      LEFT JOIN lead_scores s 
      ON l.id = s.leads_id 
      ORDER BY s.score DESC
      LIMIT {limit}
      OFFSET {offset};
    """

  @staticmethod
  def select_smartlead_batch(campaign_batch: str) -> tuple[str, tuple]:
    sql = """
      SELECT
        clinic_name,
        email,
        subject_line,
        email_body,
        clinic_type,
        city,
        province
      FROM smartlead
      WHERE campaign_batch = ?
    """
    values = (campaign_batch,)
    return sql, values

  @staticmethod
  def insert_into_smartlead(clinic_name: str, email: str, subject_line: str, email_body: str, clinic_type: str, city: str, province: str, campaign_batch: str) -> tuple[str, tuple]:
    sql = """
      INSERT OR IGNORE INTO smartlead (
        clinic_name,
        email,
        subject_line,
        email_body,
        clinic_type,
        city,
        province,
        campaign_batch
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    values = (
      clinic_name,
      email,
      subject_line,
      email_body,
      clinic_type,
      city,
      province,
      campaign_batch
    )
    return sql, values
    
  @staticmethod
  def create_smartlead_table() -> str: 
    return f"""
      CREATE TABLE IF NOT EXISTS smartlead (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinic_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        subject_line TEXT,
        email_body TEXT,
        clinic_type TEXT,
        city TEXT,
        province TEXT,
        campaign_batch TEXT NOT NULL
      );
    """

  @staticmethod
  def create_table_leads() -> str: 
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
    
  @staticmethod
  def create_table_lead_scores() -> str:
    return f"""
      CREATE TABLE IF NOT EXISTS lead_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leads_id INTEGER NOT NULL,
        score REAL,
        top_features TEXT,
        explanation TEXT,
        created_at DATETIME,
        model_version TEXT,
        FOREIGN KEY (leads_id) REFERENCES leads(id)
      );
    """