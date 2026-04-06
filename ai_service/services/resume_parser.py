import spacy
import pypdf
import os
from PIL import Image
from .gemini_client import call_gemini, _get_model_name
import google.generativeai as genai

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def parse_resume(file_path: str) -> dict:
    text = ""
    try:
        if file_path.endswith(".pdf"):
            reader = pypdf.PdfReader(file_path)
            text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif file_path.lower().endswith(".docx"):
            try:
                from docx import Document
                doc = Document(file_path)
                text = "\n".join([p.text for p in doc.paragraphs])
            except Exception as docx_err:
                print(f"Docx processing error: {docx_err}")
                return {"error": f"DOCX processing failed: {str(docx_err)}"}
        elif file_path.lower().endswith((".png", ".jpg", ".jpeg")):
            # Image resume - will be handled by Gemini Multimodal
            try:
                img = Image.open(file_path)
                model_name = _get_model_name()
                model = genai.GenerativeModel(model_name)
                
                image_prompt = """
                Extract all technical skills, tools, programming languages, frameworks,
                certifications, and soft skills from this resume image. 
                Also extract Education and Experience details.
                Return ONLY a JSON object:
                {"skills": ["skill1", "skill2", ...], "education": ["..."], "experience": ["..."]}
                """
                
                response = model.generate_content([image_prompt, img])
                if response and response.text:
                    import json
                    import re
                    text_res = response.text.strip()
                    json_match = re.search(r'\[.*\]|\{.*\}', text_res, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                return {"error": "Could not extract data from image"}
            except Exception as img_err:
                print(f"Image processing error: {img_err}")
                return {"error": f"Image processing failed: {str(img_err)}"}
        else:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            except UnicodeDecodeError:
                return {"error": "Unsupported file format or encoding"}
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return {"error": str(e)}

    # Basic spaCy processing (optional, could be used for local NER if needed)
    # doc_nlp = nlp(text)
    
    # Ensure text is not None before indexing
    prompt_text = text[:4000] if text else "[No text extracted]"
    
    prompt = f"""
Extract all technical skills, tools, programming languages, frameworks,
certifications, and soft skills from this resume text.
Return ONLY a JSON object:
{{"skills": ["skill1", "skill2", ...], "education": ["..."], "experience": ["..."]}}

Resume text:
{prompt_text}
"""
    result = call_gemini(prompt)
    if not result or "skills" not in result:
        # Fallback local scanning if Gemini API quota is hit
        print("Falling back to local keyword extraction...")
        import json
        fallback_skills = []
        try:
            kb_path = os.path.join(os.path.dirname(__file__), "../knowledge_base/job_skills.json")
            with open(kb_path, 'r') as f:
                kb = json.load(f)
                all_known_skills = set(skill.lower() for roles in kb.values() for skill in roles)
                text_lower = text.lower()
                for skill in all_known_skills:
                    if skill in text_lower or skill.replace(" ", "") in text_lower:
                        fallback_skills.append(skill.title())
        except Exception as fallback_err:
            print("Fallback failed:", fallback_err)
        
        result = {
            "skills": list(set(fallback_skills)),
            "education": ["Education details fallback captured by ATS"],
            "experience": ["Experience details fallback captured by ATS"]
        }
        
    return result
