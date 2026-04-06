from flask import Blueprint, request, jsonify
from services.voice_service import generate_human_voice

voice_bp = Blueprint("voice_bp", __name__)

@voice_bp.route("/", methods=["POST"])
def get_human_voice():
    data = request.json
    text = data.get("text", "")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    audio_data = generate_human_voice(text)
    if not audio_data:
        return jsonify({"error": "Failed to generate neural voice"}), 500
        
    return jsonify({"audio": audio_data})
