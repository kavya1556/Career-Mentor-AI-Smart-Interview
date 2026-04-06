from flask import Flask, jsonify
from flask_cors import CORS
from routes.resume_routes import resume_bp
from routes.roadmap_routes import roadmap_bp
from routes.interview_routes import interview_bp
from routes.evaluation_routes import evaluation_bp
from routes.voice_routes import voice_bp
import os

# Pre-warm the Gemini model cache at startup (avoids delay on first request)
from services.gemini_client import _get_model_name
_get_model_name()

app = Flask(__name__)
CORS(app)

app.register_blueprint(resume_bp, url_prefix="/parse-resume")
app.register_blueprint(roadmap_bp, url_prefix="/generate-roadmap")
app.register_blueprint(interview_bp, url_prefix="/generate-questions")
app.register_blueprint(evaluation_bp, url_prefix="/evaluate-answers")
app.register_blueprint(voice_bp, url_prefix="/generate-voice")

@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "healthy_v3"}, 200

if __name__ == "__main__":
    # threaded=True allows Flask to handle multiple requests concurrently
    # instead of queuing them one-by-one (critical for resume + roadmap + interview)
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
