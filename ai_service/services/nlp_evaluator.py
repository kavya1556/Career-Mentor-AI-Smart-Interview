from sentence_transformers import SentenceTransformer, util
from typing import List, Dict, Any, Union, Optional

# ─── MODEL CACHE — loaded once on first call, shared for all requests ─────────
_sem_model = None

def _get_model():
    global _sem_model
    if _sem_model is None:
        print("[NLPEvaluator] Loading SentenceTransformer model...")
        _sem_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("[NLPEvaluator] Model loaded.")
    return _sem_model


def _fast_grammar_score(answer: str) -> float:
    """
    Fast pure-Python grammar heuristic — replaces the slow JVM-based
    language_tool_python. Checks common markers of well-formed text.
    """
    words: List[str] = answer.split()
    if not words:
        return 0.0
    
    current_score: float = 100.0

    # Penalty for short answer
    if len(words) < 10:
        current_score = current_score - 30.0
    
    # Penalty for punctuation
    if not answer.rstrip().endswith(('.', '!', '?')):
        current_score = current_score - 10.0
    
    # Penalty for stuttering
    for i in range(len(words) - 1):
        if words[i].lower() == words[i + 1].lower():
            current_score = current_score - 5.0
    
    # Penalty for all-caps
    all_caps: List[str] = [w for w in words if w.isupper() and len(w) > 4]
    caps_penalty: float = float(min(20, len(all_caps) * 5))
    current_score = current_score - caps_penalty
    
    # Penalty for start capitalisation
    if len(answer) > 0 and answer[0].islower():
        current_score = current_score - 10.0
    
    return float(max(0.0, current_score))


def evaluate_answer(question: str, answer: str, expected_keywords: List[str]) -> Dict[str, Any]:
    model = _get_model()

    # 1. RELEVANCE — semantic similarity (cosine)
    q_emb = model.encode(question, convert_to_tensor=True)
    a_emb = model.encode(answer, convert_to_tensor=True)
    cos_score = float(util.cos_sim(q_emb, a_emb))

    word_count = len(answer.split())
    relevance = cos_score * 100
    if word_count < 15:
        relevance *= 0.8  # Penalise very short answers

    # 2. COMPLETENESS — keyword coverage
    matched_kw = [kw for kw in expected_keywords if kw.lower() in answer.lower()]
    completeness = (len(matched_kw) / len(expected_keywords) * 100) if expected_keywords else 50.0

    # 3. GRAMMAR — fast heuristic (no JVM, no network call)
    grammar: float = _fast_grammar_score(answer)

    # 4. LOGICAL COHERENCE — length & structure proxy
    coherence: float = (word_count / 80.0) * 100.0
    if coherence > 100.0:
        coherence = 100.0

    total: float = (relevance * 0.35 + completeness * 0.25 + grammar * 0.20 + coherence * 0.20)

    strengths: List[str] = []
    improvements: List[str] = []

    if cos_score > 0.85 and word_count < 20:
        improvements.append("Avoid repeating the question — provide more technical depth")

    if relevance >= 75.0:
        strengths.append("Answer is technically aligned with the question")
    elif relevance < 50.0:
        improvements.append("Focus on technical specifics and architecture patterns")

    if completeness >= 70.0:
        strengths.append("Strong coverage of domain-specific terminology")
    else:
        # Avoid slicing if linter hates it
        missing_concepts = []
        for k in expected_keywords:
            if k.lower() not in answer.lower():
                missing_concepts.append(k)
                if len(missing_concepts) >= 3:
                    break
        
        if missing_concepts:
            concept_str = ", ".join(missing_concepts)
            improvements.append(f"Incorporate these concepts: {concept_str}")

    if grammar >= 85.0:
        strengths.append("Professional and clear language")

    if word_count < 30:
        improvements.append("Elaborate further: aim for 3-5 sentences with technical details")

    # Manual rounding to bypass round() linter issues
    def _manual_round(v: float) -> float:
        return float(int(v * 10 + 0.5) / 10.0)

    return {
        "Score": _manual_round(total),
        "Comments": "; ".join(improvements) if improvements else "Great answer!",
        "Breakdown": {
            "relevance": _manual_round(relevance),
            "completeness": _manual_round(completeness),
            "grammatical_correctness": _manual_round(grammar),
            "logical_coherence": _manual_round(coherence),
        },
        "matched_keywords": matched_kw,
        "strengths": strengths,
        "areas_of_improvement": improvements,
    }
