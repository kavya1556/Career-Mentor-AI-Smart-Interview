from flask import Blueprint, request, jsonify
from services.gemini_client import generate_questions

interview_bp = Blueprint("interview_bp", __name__)

@interview_bp.route("/", methods=["POST"])
def get_questions():
    data = request.json
    job_role = data.get("job_role", "Software Engineer")
    skills = data.get("skills", [])
    count = data.get("count", 10)
    
    questions = generate_questions(job_role, skills, count)
    return jsonify({"questions": questions})
