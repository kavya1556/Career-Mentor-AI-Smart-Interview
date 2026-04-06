import google.generativeai as genai
import os
import json
import re
import time
from dotenv import load_dotenv
from typing import List, Dict, Any, Union, Optional

load_dotenv()

# ─── MODEL CACHE ────────────────────────────────────────────────────────────────
# Resolved once at startup, never again per-request.
_CACHED_MODELS = None
_PREFERRED_MODEL = None  # fastest model, pinned after first discovery
 
def _get_all_models() -> List[str]:
    """Dynamically fetches all available models that support generation."""
    global _CACHED_MODELS
    if _CACHED_MODELS:
        return _CACHED_MODELS
    
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        m_list = list(genai.list_models())
        models = [m.name for m in m_list if "generateContent" in m.supported_generation_methods]
        
        # Log discovered models for debugging
        print(f"[GeminiClient] Discovered {len(models)} content-generation models")
        
        _CACHED_MODELS = models
        return models
    except Exception:
        return ["gemini-1.5-flash", "gemini-pro"]

def _get_first_n(items: Union[List[Any], Any], n: int) -> List[Any]:
    if not items or not isinstance(items, list):
        return []
    return [items[i] for i in range(min(len(items), n))]

def _get_model_name() -> str:
    """Returns the best available Gemini model name. Cached after first call."""
    global _CACHED_MODELS, _PREFERRED_MODEL
    if _PREFERRED_MODEL:
        return _PREFERRED_MODEL

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    try:
        models = _get_all_models()
        # Prefer flash models — fastest & cheapest
        priority = ["2.0-flash", "1.5-flash", "1.5-pro"]
        for preferred in priority:
            for m in models:
                if preferred in m:
                    _PREFERRED_MODEL = m
                    print(f"[GeminiClient] Pinned model: {_PREFERRED_MODEL}")
                    return _PREFERRED_MODEL
        # Fallback: first available
        _PREFERRED_MODEL = models[0] if models else "models/gemini-1.5-flash"
    except Exception as e:
        print(f"[GeminiClient] Model discovery failed: {e}. Using default.")
        _PREFERRED_MODEL = "gemini-1.5-flash"

    print(f"[GeminiClient] Pinned model: {_PREFERRED_MODEL}")
    return _PREFERRED_MODEL


def _execute(prompt: str, is_json: bool = False) -> Union[Dict[str, Any], List[Any], str]:
    """Executor with retries and model rotation for quota management."""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Get actual available models from the API to avoid rotating into a 404
    all_available = _get_all_models()
    current_model = _get_model_name()
    
    # Priority list for rotation based on what's ACTUALY available
    priority_models = []
    # 1. Preferred model first
    if current_model in all_available:
        priority_models.append(current_model)
    
    # 2. Add others from available list (avoiding repeats)
    for m in all_available:
        if m not in priority_models:
            priority_models.append(m)
    
    # If API discovery failed, use hardcoded safety net
    if not priority_models:
        priority_models = ["gemini-1.5-flash", "gemini-pro"]

    for attempt in range(3):
        # We may modify priority_models during the loop if 404 occurs
        for model_name in list(priority_models): 
            try:
                # Clean name for the API (v1beta sometimes dislikes leading slash or redundant models/)
                clean_name = model_name
                if not clean_name.startswith("models/"):
                    clean_name = f"models/{clean_name}"
                
                model = genai.GenerativeModel(clean_name)
                response = model.generate_content(prompt)
                
                if response and response.text:
                    text = response.text.strip()
                    if is_json:
                        json_match = re.search(r'\[.*\]|\{.*\}', text, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group())
                        return json.loads(text)
                    return text
                
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str:
                    print(f"[GeminiClient] Quota hit for {model_name}. Rotating...")
                    continue # Try next model
                
                if "404" in err_str:
                    print(f"[GeminiClient] Model {model_name} not found (404). Removing from list.")
                    if model_name in priority_models:
                        priority_models.remove(model_name)
                    if _CACHED_MODELS and model_name in _CACHED_MODELS:
                        _CACHED_MODELS.remove(model_name)
                    continue

                print(f"[GeminiClient] Error with {model_name}: {e}")
                break 
        
        # If all models failed or were throttled, wait and retry the whole cycle
        if attempt < 2:
            wait_time = (attempt + 1) * 3
            print(f"[GeminiClient] All models exhausted. Retrying in {wait_time}s...")
            time.sleep(wait_time)

    return {} if is_json else ""


def call_gemini(prompt: str) -> Any:
    result = _execute(prompt, is_json=True)
    return result if result else {}


def call_gemini_text(prompt: str) -> str:
    result = _execute(prompt, is_json=False)
    return str(result) if result else ""


# ─── ROADMAP ─────────────────────────────────────────────────────────────────
def generate_roadmap(missing_skills: List[str], job_role: str) -> str:
    # Concise prompt → faster Gemini response (was requesting massive detail)
    skills_to_use = _get_first_n(missing_skills, 6)
    skills_str = ", ".join(skills_to_use) if skills_to_use else "core skills"
    prompt = f"""You are a career coach. Create a concise 4-week study roadmap for a {job_role} candidate.
Missing skills to focus on: {skills_str}

For each week provide:
- Week title and focus area
- 3-4 key daily topics (Day 1-7 overview)  
- 2 curated free resources (docs/courses)
- 1 hands-on mini project milestone

Use Markdown with headers (## Week 1, ## Week 2, etc.). Be specific and actionable.
Keep total output under 600 words for speed."""

    res = call_gemini_text(prompt)
    if not res:
        res = _roadmap_fallback(job_role)
    return res


def _roadmap_fallback(job_role: str) -> str:
    return f"""## Week 1: Core Foundations of {job_role}
- **Days 1-3:** Data structures, algorithms, and language fundamentals
- **Days 4-7:** System design basics — REST APIs, databases, auth patterns
- **Resources:** MDN Docs, freeCodeCamp
- **Milestone:** Build a CRUD API with authentication

## Week 2: Advanced Engineering
- **Days 1-4:** Deep dive into frameworks relevant to {job_role}
- **Days 5-7:** Testing, debugging, and code quality (CI/CD basics)
- **Resources:** Official framework docs, Jest/PyTest guides
- **Milestone:** Add automated tests to Week 1 project

## Week 3: Architecture & Scaling
- **Days 1-4:** Caching (Redis), async processing, message queues
- **Days 5-7:** Docker basics, cloud deployment (AWS/GCP free tier)
- **Resources:** Docker docs, AWS free tier tutorials
- **Milestone:** Dockerize and deploy your project

## Week 4: Interview Prep & Polish
- **Days 1-3:** LeetCode medium problems (focus on arrays, trees, graphs)
- **Days 4-6:** System design mock interviews (Grokking System Design)
- **Day 7:** Resume polish + behavioral STAR story preparation
- **Milestone:** Complete 2 full mock interviews
"""


# ─── QUESTIONS ───────────────────────────────────────────────────────────────
def generate_questions(job_role: str, skills: List[str], count: int = 10) -> List[Dict[str, Any]]:
    count = 10
    skills_to_use = _get_first_n(skills, 6)
    skills_str = ", ".join(skills_to_use) if skills_to_use else "general software skills"
    prompt = f"""Generate exactly 10 interview questions for a {job_role} position. Candidate skills: {skills_str}.

Return ONLY a JSON array. Each object must have:
{{"QuestionID":"q1","Text":"question text","Difficulty":"easy/medium/hard","Type":"intro/technical/behavioral","SkillsTested":["skill"],"ExpectedKeywords":["kw1","kw2","kw3"]}}

Rules:
- q1 MUST be: "Welcome! Could you introduce yourself and walk me through your journey toward becoming a {job_role}?"
- q2-q6: technical deep dives on the skills listed
- q7-q9: real-world problem solving scenarios
- q10: behavioral STAR question"""

    result = call_gemini(prompt)
    processed = result if isinstance(result, list) else result.get("questions", []) if isinstance(result, dict) else []

    if not processed or len(processed) < 10:
        processed = _questions_fallback(job_role, skills)

    return _get_first_n(processed, 10)


def _questions_fallback(job_role: str, skills: List[str]) -> List[Dict[str, Any]]:
    s1 = skills[0] if len(skills) > 0 else "Core Engineering"
    s2 = skills[1] if len(skills) > 1 else "System Design"
    s3 = skills[2] if len(skills) > 2 else "Problem Solving"
    return [
        {"QuestionID": "f1", "Text": f"Welcome! Could you introduce yourself and walk me through your journey toward becoming a {job_role}?", "Difficulty": "easy", "Type": "intro", "SkillsTested": ["Communication"], "ExpectedKeywords": ["experience", "projects", "background"]},
        {"QuestionID": "f2", "Text": f"Explain how you would design a scalable {s1} system from scratch.", "Difficulty": "hard", "Type": "technical", "SkillsTested": [s1], "ExpectedKeywords": ["scalability", "load balancing", "caching"]},
        {"QuestionID": "f3", "Text": f"What are the core performance bottlenecks when working with {s2} and how do you address them?", "Difficulty": "hard", "Type": "technical", "SkillsTested": [s2], "ExpectedKeywords": ["profiling", "optimization", "benchmarking"]},
        {"QuestionID": "f4", "Text": f"How do you ensure data consistency in a distributed {s1} environment?", "Difficulty": "hard", "Type": "technical", "SkillsTested": [s1], "ExpectedKeywords": ["ACID", "CAP theorem", "transactions"]},
        {"QuestionID": "f5", "Text": f"Walk me through your approach to debugging a production issue in a {job_role} context.", "Difficulty": "medium", "Type": "technical", "SkillsTested": [s3], "ExpectedKeywords": ["logging", "monitoring", "root cause analysis"]},
        {"QuestionID": "f6", "Text": f"How would you optimize a slow {s2} query or pipeline?", "Difficulty": "medium", "Type": "technical", "SkillsTested": [s2], "ExpectedKeywords": ["indexing", "query plan", "caching"]},
        {"QuestionID": "f7", "Text": f"Describe a complex {job_role} system you designed. What were the key architectural decisions?", "Difficulty": "hard", "Type": "technical", "SkillsTested": [s1, s2], "ExpectedKeywords": ["microservices", "API design", "trade-offs"]},
        {"QuestionID": "f8", "Text": "How do you handle security concerns like authentication and authorization in your applications?", "Difficulty": "medium", "Type": "technical", "SkillsTested": ["Security"], "ExpectedKeywords": ["JWT", "OAuth", "RBAC"]},
        {"QuestionID": "f9", "Text": "If you had to migrate a legacy monolith to microservices, what strategy would you use?", "Difficulty": "hard", "Type": "technical", "SkillsTested": [s3], "ExpectedKeywords": ["strangler pattern", "domain boundaries", "CI/CD"]},
        {"QuestionID": "f10", "Text": "Tell me about a time you disagreed with a technical decision. How did you handle it?", "Difficulty": "medium", "Type": "behavioral", "SkillsTested": ["Communication"], "ExpectedKeywords": ["collaboration", "data-driven", "resolution"]},
    ]


# ─── EVALUATION ──────────────────────────────────────────────────────────────
def evaluate_with_gemini(question: str, answer: str, expected_keywords: List[str]) -> Dict[str, Any]:
    prompt = f"""Evaluate this interview answer. Return ONLY valid JSON.

Question: {question}
Expected keywords: {', '.join(expected_keywords)}
Answer: {answer}

{{"Score":<0-100>,"Comments":"brief technical critique","Breakdown":{{"Consistency":<0-100>,"TechnicalDepth":<0-100>,"Terminology":<0-100>}},"MatchedKeywords":["matched terms"]}}"""

    result = call_gemini(prompt)
    if not isinstance(result, dict) or "Score" not in result:
        return {
            "Score": 50,
            "Comments": "Could not evaluate. Check your connection.",
            "Breakdown": {"Consistency": 50, "TechnicalDepth": 50, "Terminology": 50},
            "MatchedKeywords": []
        }
    return result


# ─── SKILL DISCOVERY ─────────────────────────────────────────────────────────
def get_required_skills_for_role(job_role: str) -> List[str]:
    """Uses AI to identify the top 10 essential skills for any job role."""
    prompt = f"""Identify the top 10 essential technical and soft skills required for the role of '{job_role}'.
Return ONLY a JSON array of strings: ["Skill 1", "Skill 2", ...]"""
    
    result = call_gemini(prompt)
    if isinstance(result, list):
        return result
    return ["Collaboration", "Problem Solving", "Strategic Thinking"] # Generic fallback
