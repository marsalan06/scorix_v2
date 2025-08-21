import os
from dotenv import load_dotenv

load_dotenv()

# Database
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "scorix_api")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Grading
GRADING_CONFIG = {
    "semantic_weights": {"direct_similarity": 0.7, "concept_overlap": 0.3},
    "rule_thresholds": {"semantic": 0.2, "keyword_overlap": 0.8},
    "default_grade_thresholds": {"A": 85, "B": 70, "C": 55, "D": 40, "F": 0}
}
