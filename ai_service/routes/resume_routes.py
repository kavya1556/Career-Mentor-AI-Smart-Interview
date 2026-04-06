import base64
import os
import tempfile
from flask import Blueprint, request, jsonify
from services.resume_parser import parse_resume
from services.skill_gap import analyze_skill_gap

resume_bp = Blueprint("resume_bp", __name__)

@resume_bp.route("/", methods=["POST"])
def process_resume():
    data = request.json
    file_path = data.get("file_path")
    job_role = data.get("job_role")
    
    if "file_base64" in data:
        file_base64 = data["file_base64"]
        filename = data.get("filename", "resume.pdf")
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(file_base64))
    
    if not file_path:
        return jsonify({"error": "No file path provided"}), 400
        
    resume_data = parse_resume(file_path)
    
    if "error" in resume_data:
        return jsonify(resume_data), 500
        
    if job_role:
        gap_analysis = analyze_skill_gap(resume_data.get("skills", []), job_role)
        resume_data["gap_analysis"] = gap_analysis
        
    return jsonify(resume_data)
