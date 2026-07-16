import spacy
from transformers import pipeline
from typing import List, Dict, Tuple


class NLPService:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback if model not installed
            self.nlp = None
        
        try:
            self.sentiment_analyzer = pipeline("sentiment-analysis")
            self.ner = pipeline("ner", aggregation_strategy="simple")
            self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        except Exception:
            # Fallback if models not available
            self.sentiment_analyzer = None
            self.ner = None
            self.summarizer = None
    
    def extract_entities(self, text: str) -> List[Tuple[str, str]]:
        """Extract named entities from text"""
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        entities = [(ent.text, ent.label_) for ent in doc.ents]
        return entities
    
    def analyze_sentiment(self, text: str) -> Dict[str, any]:
        """Analyze sentiment of text"""
        if not self.sentiment_analyzer:
            return {"label": "NEUTRAL", "score": 0.5}
        
        result = self.sentiment_analyzer(text)
        return {
            "label": result[0]["label"],
            "score": result[0]["score"]
        }
    
    def summarize_text(self, text: str, max_length: int = 150) -> str:
        """Summarize text using BART model"""
        if not self.summarizer:
            # Fallback: extract first few sentences
            sentences = text.split(". ")
            return ". ".join(sentences[:3])
        
        summary = self.summarizer(text, max_length=max_length, truncation=True)
        return summary[0]["summary_text"]
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract keywords from text"""
        if not self.nlp:
            # Fallback: simple word frequency
            words = text.lower().split()
            word_freq = {}
            for word in words:
                if len(word) > 3:
                    word_freq[word] = word_freq.get(word, 0) + 1
            return sorted(word_freq.keys(), key=word_freq.get, reverse=True)[:top_n]
        
        doc = self.nlp(text)
        
        # Extract nouns and proper nouns as keywords
        keywords = [
            token.text.lower()
            for token in doc
            if token.pos_ in ["NOUN", "PROPN"]
            and not token.is_stop
            and not token.is_punct
        ]
        
        # Count frequency
        keyword_freq = {}
        for keyword in keywords:
            keyword_freq[keyword] = keyword_freq.get(keyword, 0) + 1
        
        # Return top keywords
        return sorted(keyword_freq.keys(), key=keyword_freq.get, reverse=True)[:top_n]
    
    def classify_text(self, text: str, categories: List[str]) -> Dict[str, float]:
        """Classify text into categories"""
        # Simple keyword-based classification
        scores = {}
        text_lower = text.lower()
        
        for category in categories:
            # Use category name as keywords (simplified)
            keywords = category.lower().split()
            match_count = sum(1 for keyword in keywords if keyword in text_lower)
            scores[category] = match_count / len(keywords) if keywords else 0
        
        return scores
    
    def detect_language(self, text: str) -> str:
        """Detect language of text"""
        if not self.nlp:
            return "en"
        
        doc = self.nlp(text)
        return doc.lang_
    
    def extract_relations(self, text: str) -> List[Dict[str, str]]:
        """Extract relationships between entities"""
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        relations = []
        
        for token in doc:
            if token.dep_ in ["nsubj", "dobj", "pobj"]:
                head = token.head
                relations.append({
                    "subject": token.text,
                    "relation": token.dep_,
                    "object": head.text
                })
        
        return relations
