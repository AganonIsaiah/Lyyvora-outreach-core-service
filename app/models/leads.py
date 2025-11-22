from sqlalchemy import Column, Integer, String, Boolean, DateTime 
from app.database import Base 

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, nullable=False)
    specialty = Column(String)
    city = Column(String)
    province = Column(String)
    phone = Column(String)
    website = Column(String)
    email = Column(String)
    notes = Column(String)
    source_url = Column(String)
    discovered_at = Column(DateTime)
    dedupe_hash = Column(String)
    is_valid = Column(Boolean, default=True)