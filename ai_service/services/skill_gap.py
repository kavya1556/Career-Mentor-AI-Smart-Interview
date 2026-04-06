import json
import os

KB_PATH = os.path.join(os.path.dirname(__file__), "../knowledge_base/job_skills.json")

from typing import List, Dict, Set, Any, Union, Optional

_JOB_SKILLS_DB: Dict[str, List[str]] = {}
try:
    with open(KB_PATH) as f:
        _JOB_SKILLS_DB = json.load(f)
    print(f"[SkillGap] Knowledge base loaded: {len(_JOB_SKILLS_DB)} roles")
except Exception as e:
    print(f"[SkillGap] WARNING: Could not load knowledge base: {e}")

# ─── Skill Normalization ──────────────────────────────────────────────────────
SKILL_SYNONYMS = {
    "react": ["react.js", "reactjs", "react.js", "react hooks"],
    "node": ["node.js", "nodejs", "node js"],
    "express": ["express.js", "expressjs", "express js"],
    "mongodb": ["mongo", "mongodb atlas"],
    "postgresql": ["postgres", "psql"],
    "javascript": ["js", "es6", "vanilla js"],
    "typescript": ["ts"],
    "python": ["python3", "python 3"],
    "vue": ["vue.js", "vuejs"],
    "angular": ["angular.js", "angularjs"],
    "aws": ["amazon web services"],
    "gcp": ["google cloud platform"],
    "azure": ["microsoft azure"],
    "docker": ["docker containers"],
    "kubernetes": ["k8s"],
}

def _normalize(skill: str) -> set:
    """Returns a set of normalized names for a given skill."""
    s = skill.lower().strip()
    # Remove common suffixes like .js or .py for base matching
    base = s.replace(".js", "").replace("js", "").strip()
    
    names = {s, base}
    for canonical, synonyms in SKILL_SYNONYMS.items():
        if s == canonical or s in synonyms:
            names.add(canonical)
            names.update(synonyms)
    return names

def analyze_skill_gap(extracted_skills: List[str], job_role: str) -> Dict[str, Any]:
    if not _JOB_SKILLS_DB:
        return {"error": "Knowledge base not available"}

    from .gemini_client import get_required_skills_for_role
    
    # Normalize for DB lookup (e.g. "Digital Marketing" -> "digital_marketing")
    clean_role = job_role.strip().lower()
    role_key = clean_role.replace(" ", "_").replace("-", "_")
    
    required = _JOB_SKILLS_DB.get(role_key)
    
    if not required:
        # Check if a partial match exists in DB (e.g. "Software Dev" vs "Software Engineer")
        for db_role, skills in _JOB_SKILLS_DB.items():
            if db_role in role_key or role_key in db_role:
                print(f"[SkillGap] Found partial DB match: {db_role}")
                required = skills
                break
                
    if not required:
        print(f"[SkillGap] Role '{job_role}' not in DB. Fetching AI-driven requirements...")
        ai_skills = get_required_skills_for_role(job_role)
        if ai_skills and isinstance(ai_skills, list):
            required = ai_skills
        else:
            print("[SkillGap] AI skill discovery failed or returned empty. Using general fallback.")
            required = ["Problem Solving", "Communication", "Technical Proficiency", "Lifelong Learning"]

    # Flatten all extracted skills into their normalized forms
    extracted_normalized = set()
    for s in extracted_skills:
        extracted_normalized.update(_normalize(s))
        
    matched = []
    missing = []
    
    for req in required:
        req_norm = _normalize(req)
        # If any normalized name for the requirement is in the extracted set
        if any(n in extracted_normalized for n in req_norm):
            matched.append(req)
        else:
            missing.append(req)

    gap_score = 0.0
    if required:
        raw_score = (len(matched) / len(required)) * 100.0
        gap_score = float(int(raw_score * 10 + 0.5) / 10.0)

    return {
        "job_role": job_role,
        "matched_skills": matched,
        "missing_skills": missing,
        "gap_score": gap_score,
        "readiness_level": "High" if gap_score >= 70 else "Medium" if gap_score >= 40 else "Low"
    }
