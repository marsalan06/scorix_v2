from sentence_transformers import SentenceTransformer, util
import re
import nltk
from nltk.stem import WordNetLemmatizer
from typing import List, Dict, Any, Tuple
from config import GRADING_CONFIG

# Download NLTK data if not available
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    lemmatizer = WordNetLemmatizer()
except Exception:
    class FallbackLemmatizer:
        def lemmatize(self, word):
            return word.lower()
    lemmatizer = FallbackLemmatizer()

# Initialize the AI model
model = SentenceTransformer('all-MiniLM-L6-v2')

def detect_rule_type(rule_text: str) -> str:
    """Auto-detect rule type based on content"""
    if not rule_text:
        return "semantic"
    
    rule_lower = rule_text.lower()
    
    if "mentions" in rule_lower or "formula" in rule_lower or "equation" in rule_lower:
        return "exact_phrase"
    elif "contains" in rule_lower or "has" in rule_lower or "includes" in rule_lower:
        return "contains_keywords"
    else:
        return "semantic"

def extract_key_concepts(text: str) -> set:
    """Extract key concepts from text"""
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    words = text.split()
    key_words = [word for word in words if word not in stop_words and len(word) > 2]
    return set(lemmatizer.lemmatize(word) for word in key_words)

def calculate_semantic_similarity(student_answer: str, rule_text: str, threshold: float = 0.2) -> Tuple[bool, float]:
    """Calculate semantic similarity between student answer and rule"""
    student_emb = model.encode(student_answer, convert_to_tensor=True)
    rule_emb = model.encode(rule_text, convert_to_tensor=True)
    direct_similarity = util.cos_sim(student_emb, rule_emb).item()
    
    student_concepts = extract_key_concepts(student_answer)
    rule_concepts = extract_key_concepts(rule_text)
    
    if rule_concepts:
        concept_overlap = len(student_concepts.intersection(rule_concepts)) / len(rule_concepts)
    else:
        concept_overlap = 0
    
    final_similarity = direct_similarity * 0.7 + concept_overlap * 0.3
    return final_similarity >= threshold, final_similarity

def match_rule(student_answer: str, rule_text: str, rule_type: str = "semantic") -> Tuple[bool, float]:
    """Match a rule based on its type"""
    
    if rule_type == "exact_phrase":
        rule_lower = rule_text.lower()
        student_lower = student_answer.lower()
        
        # Extract key phrases after instruction words
        patterns = [
            r'mentions?\s+(?:the\s+)?(.+)',
            r'contains?\s+(?:the\s+)?(.+)',
            r'formula\s+(.+)',
            r'equation\s+(.+)'
        ]
        
        key_phrases = []
        for pattern in patterns:
            matches = re.findall(pattern, rule_lower)
            for match in matches:
                phrase = match.strip().rstrip('.')
                if len(phrase) > 2:
                    key_phrases.append(phrase)
        
        # Check for exact matches
        for phrase in key_phrases:
            if phrase in student_lower:
                return True, 1.0
        
        return False, 0.0
    
    elif rule_type == "contains_keywords":
        rule_concepts = extract_key_concepts(rule_text)
        student_concepts = extract_key_concepts(student_answer)
        
        if not rule_concepts:
            return calculate_semantic_similarity(student_answer, rule_text)
        
        # Check for exact phrase matches first
        rule_lower = rule_text.lower()
        student_lower = student_answer.lower()
        
        patterns = [
            r'contains?\s+(?:the\s+)?(.+)',
            r'has\s+(?:the\s+)?(.+)',
            r'includes?\s+(?:the\s+)?(.+)'
        ]
        
        key_phrases = []
        for pattern in patterns:
            matches = re.findall(pattern, rule_lower)
            for match in matches:
                phrase = match.strip().rstrip('.')
                if len(phrase) > 2:
                    key_phrases.append(phrase)
        
        if key_phrases:
            for phrase in key_phrases:
                if phrase in student_lower:
                    return True, 1.0
        
        # Fall back to word-level matching
        overlap = len(student_concepts.intersection(rule_concepts))
        if rule_concepts:
            score = overlap / len(rule_concepts)
            return score >= 0.8, score
        
        return False, 0.0
    
    else:  # semantic
        return calculate_semantic_similarity(student_answer, rule_text)

def assign_grade(score: float, grade_thresholds: Dict[str, int]) -> str:
    """Assign grade based on score and thresholds"""
    percent = score * 100
    sorted_thresholds = sorted(grade_thresholds.items(), key=lambda x: x[1], reverse=True)
    
    for grade, threshold in sorted_thresholds:
        if percent >= threshold:
            return grade
    
    return sorted_thresholds[-1][0] if sorted_thresholds else "F"

def grade_answer(student_answer: str, sample_answer: str, rules: List[str], grade_thresholds: Dict[str, int]) -> Dict[str, Any]:
    """Grade a single student answer"""
    if not rules:
        return {
            "score": 0.0,
            "grade": "F",
            "matched_rules": [],
            "missed_rules": []
        }
    
    matched_rules = []
    missed_rules = []
    total_score = 0.0
    
    for rule in rules:
        rule_type = detect_rule_type(rule)
        is_matched, score = match_rule(student_answer, rule, rule_type)
        
        if is_matched:
            matched_rules.append(rule)
            total_score += score
        else:
            missed_rules.append(rule)
    
    # Calculate final score
    if rules:
        final_score = total_score / len(rules)
    else:
        final_score = 0.0
    
    # Add sample answer bonus if score is high enough
    if final_score >= 0.5:
        sample_similarity = calculate_semantic_similarity(student_answer, sample_answer)[1]
        bonus = sample_similarity * 0.2
        final_score = min(1.0, final_score + bonus)
    
    grade = assign_grade(final_score, grade_thresholds)
    
    return {
        "score": final_score,
        "grade": grade,
        "matched_rules": matched_rules,
        "missed_rules": missed_rules
    }
