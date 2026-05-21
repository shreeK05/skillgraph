from sqlalchemy.orm import Session
from app.models.graph import GraphConcept, GraphRelation

def get_missing_skills_for_job(db: Session, student_branch: str, student_year: int, job_skills: list[str]) -> list[str]:
    """
    Given a list of skills required for a job, returns the skills that are NOT
    taught in the student's syllabus up to their current year.
    """
    # 1. Find all concepts taught to this student so far
    taught_concepts = set()
    
    # Check years 1 up to student_year
    for year in range(1, student_year + 1):
        branch_node_name = f"{student_branch}_Year_{year}"
        branch_node = db.query(GraphConcept).filter(GraphConcept.name == branch_node_name).first()
        
        if branch_node:
            # Get all concepts linked via TEACHES
            relations = db.query(GraphRelation).filter(
                GraphRelation.source_id == branch_node.id,
                GraphRelation.relation_type == "TEACHES"
            ).all()
            
            for rel in relations:
                concept = db.query(GraphConcept).filter(GraphConcept.id == rel.target_id).first()
                if concept:
                    taught_concepts.add(concept.name.lower())
                    
    # 2. Compare against job skills
    missing_skills = []
    for skill in job_skills:
        if skill.lower() not in taught_concepts:
            missing_skills.append(skill)
            
    return missing_skills

def get_syllabus_topics(db: Session, branch: str, year: int) -> list[str]:
    """Returns all topics taught for a specific branch and year."""
    branch_node_name = f"{branch}_Year_{year}"
    branch_node = db.query(GraphConcept).filter(GraphConcept.name == branch_node_name).first()
    
    topics = []
    if branch_node:
        relations = db.query(GraphRelation).filter(
            GraphRelation.source_id == branch_node.id,
            GraphRelation.relation_type == "TEACHES"
        ).all()
        
        for rel in relations:
            concept = db.query(GraphConcept).filter(GraphConcept.id == rel.target_id).first()
            if concept:
                topics.append(concept.name)
                
    return topics
