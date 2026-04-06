import requests
import json
import time

BASE_URL = "http://localhost:5001"

print("--- Testing Flask AI Service ---")

# 1. Health
try:
    res = requests.get(f"{BASE_URL}/health")
    print("Health:", res.json())
except Exception as e:
    print("Health failed:", e)

# 2. Parse Resume
try:
    # Need to create a dummy pdf or docx, we will use a test txt file for now
    payload = {"file_path": "test_resume.txt", "job_role": "software_engineer"}
    res = requests.post(f"{BASE_URL}/parse-resume/", json=payload)
    print("Parse Resume:", res.status_code, str(res.json())[:200])
except Exception as e:
    print("Parse Resume failed:", e)

# 3. Generate Roadmap
try:
    payload = {"missing_skills": ["Docker", "Kubernetes"], "job_role": "software_engineer"}
    res = requests.post(f"{BASE_URL}/generate-roadmap/", json=payload)
    print("Generate Roadmap:", res.status_code, str(res.json())[:200])
except Exception as e:
    print("Generate Roadmap failed:", e)

# 4. Generate Questions
try:
    payload = {"job_role": "software_engineer", "skills": ["Python", "React"]}
    res = requests.post(f"{BASE_URL}/generate-questions/", json=payload)
    print("Generate Questions:", res.status_code, str(res.json())[:200])
except Exception as e:
    print("Generate Questions failed:", e)

# 5. Evaluate Answers
try:
    payload = {
        "question": "What is Docker?",
        "answer": "Docker is a containerization platform that allows you to package applications into consistent units called containers.",
        "expected_keywords": ["container", "platform", "image", "isolation"]
    }
    res = requests.post(f"{BASE_URL}/evaluate-answers/", json=payload)
    print("Evaluate Answers:", res.status_code, str(res.json())[:200])
except Exception as e:
    print("Evaluate Answers failed:", e)

print("--- Testing Completed ---")
