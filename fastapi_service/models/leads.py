from sqlalchemy import Column, Integer, String, Boolean, DateTime 
from backend.database import Base 

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
    