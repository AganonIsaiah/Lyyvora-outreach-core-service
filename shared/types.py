from enum import Enum 

class ClinicStatus(Enum):
  NOT_QUEUED = "Not Queued"
  NOT_CONTACTED = "Not Contacted"
  EMAIL_1_SENT = "Email 1 Sent"
  FOLLOW_UP_1 = "Follow-up 1"
  FOLLOW_UP_2 = "Follow-up 2"
  REPLIED = "Replied"