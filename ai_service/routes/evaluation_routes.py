from flask import Blueprint, request, jsonify
from services.gemini_client import evaluate_with_gemini

evaluation_bp = Blueprint("evaluation_bp", __name__)

@evaluation_bp.route("/", methods=["POST"])
def evaluate():
    data = request.json
    question = data.get("question")
    answer = data.get("answer")
    expected_keywords = data.get("expected_keywords", [])
    
    if not question or not answer:
        return jsonify({"error": "Question and answer are required"}), 400
        
    feedback = evaluate_with_gemini(question, answer, expected_keywords)
    return jsonify(feedback)
