from enum import Enum


class ClinicStatus(str, Enum):
    NOT_GENERATED = "Not Generated"
    GENERATED = "Generated"
