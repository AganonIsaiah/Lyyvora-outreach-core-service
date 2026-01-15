from configs.types import ClinicStatus


class Queries:
    @staticmethod
    def total_clinics_count() -> str:
        return "SELECT COUNT(*) FROM leads;"

    @staticmethod
    def not_generated_emails_count() -> str:
        return "SELECT COUNT(*) FROM leads WHERE email_status = ?;"

    @staticmethod
    def has_lead_records() -> str:
        return "SELECT 1 FROM leads LIMIT 1;"

    @staticmethod
    def total_filtered_clinics_count(where_clause: str) -> str:
        return f"""
        SELECT COUNT(DISTINCT l.id)
        FROM leads l
        LEFT JOIN smartlead m ON m.leads_id = l.id
        {where_clause}
        """

    @staticmethod
    def distinct_values(table: str, column: str) -> str:
        return f"SELECT DISTINCT {column} FROM {table} WHERE {column} IS NOT NULL;"

    @staticmethod
    def all_clinics_query(
        where_clause: str, order_clause: str, limit: int, offset: int
    ) -> str:
        return f"""
        SELECT 
            l.id, l.clinic_name, l.clinic_sub_type,
            l.city, l.province, l.email, l.website_url, l.website_desc,
            l.total_reviews, l.average_rating, l.email_status,
            s.score, s.top_features,
            m.campaign_batch,
            m.subject_line_1, m.email_body_1,
            m.subject_line_2, m.email_body_2,
            m.subject_line_3, m.email_body_3
        FROM leads l
        LEFT JOIN lead_scores s ON s.leads_id = l.id
        LEFT JOIN smartlead m ON m.leads_id = l.id
        {where_clause}
        {order_clause}
        LIMIT ? OFFSET ?;
        """

    @staticmethod
    def delete_all_from_table(table_name: str) -> str:
        return f"DELETE FROM {table_name};"

    @staticmethod
    def reset_autoincrement(table_name: str) -> str:
        return f"DELETE FROM sqlite_sequence WHERE name='{table_name}';"

    @staticmethod
    def get_clinic_with_score(
        clinic_id: int, model_version: str = "rules_v1"
    ) -> tuple[str, tuple]:
        sql = """
        SELECT l.*, COALESCE(ls.score, 0) AS lead_score, ls.top_features, ls.explanation
        FROM leads l
        LEFT JOIN lead_scores ls
        ON l.id = ls.leads_id AND ls.model_version = ?
        WHERE l.id = ?
        """
        return sql, (model_version, clinic_id)

    @staticmethod
    def get_smartlead_for_clinic(clinic_id: int) -> tuple[str, tuple]:
        sql = """
        SELECT 
            subject_line_1, email_body_1,
            subject_line_2, email_body_2,
            subject_line_3, email_body_3
        FROM smartlead
        WHERE leads_id = ?
        LIMIT 1
        """
        return sql, (clinic_id,)

    @staticmethod
    def select_smartlead_by_campaign(
        campaign_batch: str | None = None,
    ) -> tuple[str, tuple]:
        if campaign_batch:
            sql = """
            SELECT
                clinic_name, email, subject_line_1, email_body_1,
                subject_line_2, email_body_2, subject_line_3, email_body_3,
                clinic_type, city, province
            FROM smartlead
            WHERE campaign_batch = ?
            """
            return sql, (campaign_batch,)
        else:
            sql = """
            SELECT
                clinic_name, email, subject_line_1, email_body_1,
                subject_line_2, email_body_2, subject_line_3, email_body_3,
                clinic_type, city, province
            FROM smartlead
            """
            return sql, ()

    @staticmethod
    def update_email_status() -> str:
        return "UPDATE leads SET email_status = ? WHERE id = ?"

    @staticmethod
    def fetch_leads() -> str:
        return "SELECT * FROM leads"

    @staticmethod
    def already_scored() -> str:
        return """
        SELECT 1 FROM lead_scores
        WHERE leads_id = ? AND model_version = ?
        LIMIT 1
      """

    @staticmethod
    def insert_lead_score() -> str:
        return """
        INSERT INTO lead_scores (
            leads_id,
            score,
            top_features,
            explanation,
            created_at,
            model_version
        ) VALUES (?, ?, ?, ?, ?, ?)
        """

    @staticmethod
    def get_top_clinics_for_outreach(batch_size: int = 10) -> tuple[str, tuple]:
        sql = """
        SELECT 
            l.id,
            l.clinic_name,
            l.email,
            l.clinic_sub_type,
            l.city,
            l.province,
            l.website_desc,
            COALESCE(s.score, 0) as score
        FROM leads l
        LEFT JOIN lead_scores s ON l.id = s.leads_id
        WHERE l.email_status = ?
        ORDER BY score DESC
        LIMIT ?
    """
        params = (ClinicStatus.NOT_GENERATED.value, batch_size)
        return sql, params

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
        campaign_batch: str,
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
            campaign_batch,
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
        return """
        CREATE TABLE IF NOT EXISTS leads (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            clinic_name TEXT NOT NULL,
            clinic_main_type TEXT,
            clinic_sub_type TEXT,
            city TEXT,
            province TEXT,
            phone TEXT,
            email TEXT UNIQUE NOT NULL,
            website_url TEXT,
            website_desc TEXT,
            total_reviews INTEGER,
            average_rating REAL,
            email_status TEXT DEFAULT 'Not Generated'
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
