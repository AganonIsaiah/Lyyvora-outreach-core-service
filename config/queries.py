class Queries:
   
  @staticmethod
  def get_top_clinics(limit: int = 10, offset: int = 0) -> str:  
    return f"""
      SELECT l.clinic_name, l.clinic_sub_type, l.city, l.website_desc 
      FROM leads l
      LEFT JOIN lead_scores s 
      ON l.id = s.leads_id 
      ORDER BY s.score DESC
      LIMIT {limit}
      OFFSET {offset};
    """
