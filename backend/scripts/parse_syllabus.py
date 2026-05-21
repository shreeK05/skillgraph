import os
import sys
import glob
import PyPDF2
from sqlalchemy.orm import Session
import re

# Add backend dir to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal, engine, Base
from app.models.graph import GraphConcept, GraphRelation

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def extract_concepts(text):
    """
    Heuristic extraction of concepts.
    We look for typical technical keywords and capitalized phrases that might be skills.
    In a full production environment, this would use a finely tuned NLP model or LLM.
    """
    concepts = set()
    
    # Common tech keywords to look for explicitly
    tech_keywords = [
        "Python", "Java", "C++", "C#", "JavaScript", "React", "Node.js", "SQL", "NoSQL", 
        "MongoDB", "AWS", "Docker", "Kubernetes", "Machine Learning", "Deep Learning",
        "Artificial Intelligence", "Data Structures", "Algorithms", "Operating Systems",
        "Database Management", "Computer Networks", "Cyber Security", "Cryptography",
        "Software Engineering", "System Design", "Cloud Computing", "IoT", "Data Science",
        "Natural Language Processing", "Computer Vision", "Blockchain", "DevOps",
        "Agile", "Scrum", "Git", "Linux", "REST API", "Microservices", "HTML", "CSS",
        "TensorFlow", "PyTorch", "Keras", "Pandas", "NumPy", "Matplotlib", "Seaborn",
        "Tableau", "PowerBI", "Hadoop", "Spark", "Kafka", "RabbitMQ", "Redis", "Memcached",
        "GraphQL", "Spring Boot", "Django", "Flask", "FastAPI", "Express", "Next.js"
    ]
    
    text_lower = text.lower()
    for kw in tech_keywords:
        if kw.lower() in text_lower:
            concepts.add(kw)
            
    # Look for capitalized phrases (2-3 words) that might be concepts
    phrases = re.findall(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})', text)
    for p in phrases:
        # Filter out common non-concept phrases
        if not any(stop in p.lower() for stop in ["department", "university", "syllabus", "course", "unit", "module", "chapter", "objective", "outcome"]):
            concepts.add(p)
            
    return list(concepts)

def run_parser():
    base_dir = os.path.join(os.path.dirname(__file__), "../data/syllabus/VIT SYLLABUS FOR SKILLGRAPH")
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return

    db = SessionLocal()
    
    # Get all subdirectories (branches)
    branches = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    print(f"Found branches: {branches}")
    
    for branch in branches:
        branch_dir = os.path.join(base_dir, branch)
        pdf_files = glob.glob(os.path.join(branch_dir, "*.pdf"))
        
        for pdf_file in pdf_files:
            print(f"Processing {pdf_file}...")
            text = extract_text_from_pdf(pdf_file)
            
            # Simple heuristic for year (if SY, TY, Final in filename)
            year = 1
            filename = os.path.basename(pdf_file).lower()
            if "sy" in filename or "second" in filename: year = 2
            elif "ty" in filename or "third" in filename: year = 3
            elif "final" in filename or "fourth" in filename: year = 4
            
            concepts = extract_concepts(text)
            
            for concept_name in concepts:
                # 1. Ensure concept exists
                concept = db.query(GraphConcept).filter(GraphConcept.name == concept_name).first()
                if not concept:
                    concept = GraphConcept(name=concept_name, category="SyllabusTopic")
                    db.add(concept)
                    db.flush()
                
                # 2. Ensure relation exists between this branch/year and the concept
                # For our simple graph, we'll create a generic root node for the branch/year
                branch_node_name = f"{branch}_Year_{year}"
                branch_node = db.query(GraphConcept).filter(GraphConcept.name == branch_node_name).first()
                if not branch_node:
                    branch_node = GraphConcept(name=branch_node_name, category="Branch")
                    db.add(branch_node)
                    db.flush()
                    
                # Link branch -> concept
                rel = db.query(GraphRelation).filter(
                    GraphRelation.source_id == branch_node.id,
                    GraphRelation.target_id == concept.id,
                    GraphRelation.relation_type == "TEACHES"
                ).first()
                
                if not rel:
                    rel = GraphRelation(
                        source_id=branch_node.id, 
                        target_id=concept.id,
                        relation_type="TEACHES",
                        branch=branch,
                        year=year
                    )
                    db.add(rel)
                    
            db.commit()
            print(f"  -> Extracted {len(concepts)} concepts for {branch} Year {year}")

    db.close()
    print("Graph Database populated successfully!")

if __name__ == "__main__":
    run_parser()
