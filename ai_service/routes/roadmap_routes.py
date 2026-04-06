from flask import Blueprint, request, jsonify
from services.gemini_client import generate_roadmap as gen_roadmap_text

roadmap_bp = Blueprint("roadmap_bp", __name__)

@roadmap_bp.route("/", methods=["POST"])
def generate_roadmap():
    data = request.json
    missing_skills = data.get("missing_skills", [])
    job_role = data.get("job_role", "Software Engineer")
    
    roadmap_text = gen_roadmap_text(missing_skills, job_role)
    return jsonify({"roadmap": roadmap_text})
