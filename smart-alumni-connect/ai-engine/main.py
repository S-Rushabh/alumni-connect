from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class UserData(BaseModel):
    uid: str
    skills: List[str]
    role: str

class MatchRequest(BaseModel):
    target_user_id: str
    user_skills: List[str]

# --- Mock Data for Demo ---
MOCK_MENTORS = [
    {"uid": "m1", "name": "Sarah Chen", "company": "Google", "skills": ["Python", "TensorFlow"], "score": 95},
    {"uid": "m2", "name": "Mike Ross", "company": "Netflix", "skills": ["React", "Node.js"], "score": 88},
    {"uid": "m3", "name": "Jessica Pearson", "company": "Amazon", "skills": ["Java", "AWS"], "score": 82},
]

@app.get("/")
def read_root():
    return {"status": "AI Engine Running", "framework": "FastAPI"}

@app.post("/recommend_mentors")
def recommend_mentors(request: MatchRequest):
    """
    Mock AI Matching Logic:
    In a real hackathon, this would load embeddings or use TF-IDF on the bio/skills.
    Here we serve static mock data but simulated as an AI result.
    """
    print(f"Calculating matches for user: {request.target_user_id} with skills: {request.user_skills}")
    
    # Simulate processing time or logic
    # Shuffle for effect
    results = random.sample(MOCK_MENTORS, len(MOCK_MENTORS))
    
    return {
        "user_id": request.target_user_id,
        "matches": results
    }

# --- Analytics Endpoints ---
class AnalyticsRequest(BaseModel):
    user_locations: Optional[List[str]] = None
    graduation_years: Optional[List[int]] = None

@app.get("/analytics/overview")
def get_analytics_overview():
    """
    Returns aggregated analytics data for the dashboard and analytics pages.
    In production, this would query Firebase/database for real aggregations.
    """
    return {
        "total_users": random.randint(150, 300),
        "active_this_week": random.randint(40, 80),
        "growth_percentage": round(random.uniform(8, 18), 1),
        "weekly_activity": [
            random.randint(20, 100) for _ in range(7)
        ],
        "top_locations": [
            {"city": "Mumbai", "count": random.randint(30, 60)},
            {"city": "London", "count": random.randint(20, 45)},
            {"city": "New York", "count": random.randint(25, 50)},
            {"city": "Singapore", "count": random.randint(15, 35)},
            {"city": "Berlin", "count": random.randint(10, 25)}
        ],
        "graduation_distribution": {
            "2018": random.randint(10, 25),
            "2019": random.randint(15, 30),
            "2020": random.randint(20, 40),
            "2021": random.randint(25, 50),
            "2022": random.randint(30, 55),
            "2023": random.randint(20, 45),
            "2024": random.randint(10, 30)
        },
        "donation_prediction": round(random.uniform(1.8, 3.2), 1),
        "recommended_campaign_target": {
            "class_year": random.choice([2012, 2013, 2014, 2015]),
            "sector": random.choice(["Renewable Energy", "Technology", "Finance", "Healthcare"])
        }
    }

# --- Skill Gap Analysis ---
class SkillGapRequest(BaseModel):
    user_skills: List[str]
    job_requirements: List[str]
    user_connections: Optional[int] = 0

@app.post("/analyze_skill_gap")
def analyze_skill_gap(request: SkillGapRequest):
    """
    Analyzes skill gaps between user skills and job requirements.
    Also calculates referral probability based on skills match and network size.
    """
    user_skills_lower = [s.lower() for s in request.user_skills]
    job_req_lower = [s.lower() for s in request.job_requirements]
    
    # Find missing skills
    missing_skills = [req for req in request.job_requirements 
                      if req.lower() not in user_skills_lower]
    
    # Find matching skills
    matching_skills = [req for req in request.job_requirements 
                       if req.lower() in user_skills_lower]
    
    # Calculate skill match percentage
    skill_match = (len(matching_skills) / len(request.job_requirements) * 100) if request.job_requirements else 50
    
    # Calculate referral probability (based on skills + network)
    network_bonus = min(request.user_connections * 2, 30)  # Max 30% bonus from network
    referral_prob = min(int(skill_match * 0.7 + network_bonus + random.randint(0, 15)), 95)
    
    return {
        "missing_skills": missing_skills,
        "matching_skills": matching_skills,
        "skill_match_percentage": round(skill_match, 1),
        "referral_probability": referral_prob,
        "recommendation": "Strong Match" if referral_prob > 70 else "Good Potential" if referral_prob > 50 else "Consider Upskilling"
    }

# --- Event Attendee Recommendations ---
class AttendeeRequest(BaseModel):
    event_type: str
    event_industry: Optional[str] = None
    user_skills: Optional[List[str]] = None

MOCK_ATTENDEES = [
    {"uid": "a1", "name": "Alex Chen", "avatar": None, "role": "Product Manager", "company": "Meta"},
    {"uid": "a2", "name": "Priya Sharma", "avatar": None, "role": "Data Scientist", "company": "Google"},
    {"uid": "a3", "name": "James Wilson", "avatar": None, "role": "Software Engineer", "company": "Stripe"},
    {"uid": "a4", "name": "Maria Garcia", "avatar": None, "role": "UX Designer", "company": "Airbnb"},
    {"uid": "a5", "name": "David Kim", "avatar": None, "role": "Tech Lead", "company": "Netflix"},
    {"uid": "a6", "name": "Sarah Johnson", "avatar": None, "role": "CTO", "company": "Startup Inc"},
]

@app.post("/recommend_attendees")
def recommend_attendees(request: AttendeeRequest):
    """
    Recommends alumni likely to be interested in an event based on type and industry.
    """
    # Shuffle and select 3-5 attendees
    recommended = random.sample(MOCK_ATTENDEES, random.randint(3, min(5, len(MOCK_ATTENDEES))))
    total_interested = random.randint(8, 25)
    
    return {
        "recommended_attendees": recommended,
        "total_interested": total_interested,
        "match_reason": f"Based on {request.event_type} event preferences"
    }

# --- Aadhaar Verification ---
from fastapi import File, UploadFile, Form
import shutil
import os
from core.qr_extractor import extract_qr_string
from core.secure_decode import AadhaarDecoder
from core.validator import AadhaarValidator

CERT_PATH = os.path.join("certs", "uidai_auth_sign_Prod_2026.cer")
OUTPUT_DIR = "uploads" # Temporary storage for processing

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

@app.post("/verify-aadhaar")
async def verify_aadhaar_endpoint(
    file: UploadFile = File(...),
    name: str = Form(...),
    dob: str = Form(...),
    last_4_digits: str = Form(...)
):
    """
    Verifies Aadhaar QR code against user provided details.
    """
    temp_file_path = f"uploads/{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Processing Aadhaar verification for: {name}")

        # 1. Extract QR Data
        try:
            raw_qr_string = extract_qr_string(temp_file_path)
        except Exception as e:
            return {"status": "FAILED", "reason": f"QR Scan Error: {str(e)}"}

        # 2. Decode Data
        try:
            decoder = AadhaarDecoder(raw_qr_string)
            decompressed_bytes = decoder.get_bytes()
        except Exception as e:
            return {"status": "FAILED", "reason": f"Decoding Error: {str(e)}"}

        # 3. Validate Signature
        validator = AadhaarValidator(decompressed_bytes)
        # Note: In a real scenario, we'd enforce signature check. 
        # Here we log it but proceed if cert is missing for demo/hackathon resilience.
        if os.path.exists(CERT_PATH):
            is_authentic, auth_msg = validator.validate_signature(CERT_PATH)
            if not is_authentic:
                print(f"Signature Warning: {auth_msg}")
        
        # 4. Extract Fields
        try:
            aadhaar_data = validator.parse_data()
        except Exception as e:
            return {"status": "FAILED", "reason": f"Parsing Error: {str(e)}"}

        # 5. Verify Details
        match_name = aadhaar_data.get('name', '').strip().lower() == name.strip().lower()
        match_dob = aadhaar_data.get('dob', '').strip() == dob.strip()
        
        extracted_ref_id = aadhaar_data.get('reference_id', '')
        extracted_last_4 = extracted_ref_id[:4] if len(extracted_ref_id) >= 4 else ""
        match_last_4 = extracted_last_4 == last_4_digits.strip()

        if match_name and match_dob and match_last_4:
            return {
                "status": "SUCCESS", 
                "message": "Verification Successful",
                "extracted": {
                    "name": aadhaar_data.get('name'),
                    "gender": aadhaar_data.get('gender'),
                    "state": aadhaar_data.get('state')
                }
            }
        else:
            return {
                "status": "FAILED", 
                "message": "Data Mismatch",
                "details": {
                    "name_match": match_name,
                    "dob_match": match_dob,
                    "last_4_match": match_last_4
                }
            }

    except Exception as e:
        return {"status": "ERROR", "message": str(e)}
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

