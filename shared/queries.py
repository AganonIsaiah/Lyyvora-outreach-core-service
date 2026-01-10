class Queries:
  @staticmethod
  def get_top_clinics_for_outreach(limit: int = 10, offset: int = 0) -> str:  
    return f"""
      SELECT 
        l.id,
        l.clinic_name, 
        l.email, 
        l.clinic_sub_type, 
        l.city, 
        l.province, 
        l.website_desc 
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
        subject_line_1,
        email_body_1,
        subject_line_2,
        email_body_2,
        subject_line_3,
        email_body_3,
        clinic_type,
        city,
        province
      FROM smartlead
      WHERE campaign_batch = ?
    """
    
    values = (campaign_batch,)
    
    return sql, values


  @staticmethod
  def insert_into_smartlead(
      leads_id: int,
      clinic_name: str, 
      email: str, 
      subject_line_1: str, 
      email_body_1: str, 
      subject_line_2: str, 
      email_body_2: str, 
      subject_line_3: str, 
      email_body_3: str, 
      clinic_type: str, 
      city: str, 
      province: str, 
      campaign_batch: str
    ) -> tuple[str, tuple]:
    
    sql = """
      INSERT OR REPLACE INTO smartlead (
        leads_id,
        clinic_name,
        email,
        subject_line_1,
        email_body_1,
        subject_line_2,
        email_body_2,
        subject_line_3,
        email_body_3,
        clinic_type,
        city,
        province,
        campaign_batch
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    values = (
      leads_id,
      clinic_name,
      email,
      subject_line_1,
      email_body_1,
      subject_line_2,
      email_body_2,
      subject_line_3,
      email_body_3,
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
        leads_id INTEGER NOT NULL,
        clinic_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        subject_line_1 TEXT,
        email_body_1 TEXT,
        subject_line_2 TEXT,
        email_body_2 TEXT,
        subject_line_3 TEXT,
        email_body_3 TEXT,
        clinic_type TEXT,
        city TEXT,
        province TEXT,
        campaign_batch TEXT NOT NULL,
        FOREIGN KEY (leads_id) REFERENCES leads(id)
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
        average_rating REAL,
        status TEXT NOT NULL DEFAULT 'Not Queued'
          CHECK (status IN (
            'Not Queued',
            'Not Contacted',
            'Email 1 Sent',
            'Follow-up 1',
            'Follow-up 2',
            'Replied',
            'Closed'
          ))
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