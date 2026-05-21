# file: backend/ml/scripts/seed_knowledge_graph.py
import os
import sys
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Ensure we can import from the root 'app' folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv()

URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
USER = os.environ.get("NEO4J_USER", "neo4j")
PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

def seed_graph():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    
    queries = [
        """
        // 1. Create Skills
        MERGE (python:Skill {name: 'Python', category: 'Programming', demand_score: 9.5})
        MERGE (js:Skill {name: 'JavaScript', category: 'Programming', demand_score: 9.0})
        MERGE (react:Skill {name: 'React', category: 'Web Frameworks', demand_score: 8.5})
        MERGE (ml:Skill {name: 'Machine Learning', category: 'AI', demand_score: 9.8})
        MERGE (aws:Skill {name: 'AWS', category: 'Cloud', demand_score: 9.2})
        MERGE (docker:Skill {name: 'Docker', category: 'DevOps', demand_score: 8.8})
        MERGE (fastapi:Skill {name: 'FastAPI', category: 'Web Frameworks', demand_score: 8.9})
        """,
        """
        // 2. Create Job Roles
        MERGE (sde:JobRole {title: 'Software Engineer'})
        MERGE (ds:JobRole {title: 'Data Scientist'})
        MERGE (fe:JobRole {title: 'Frontend Developer'})
        """,
        """
        // 3. Create Courses
        MERGE (c1:Course {title: 'Python for Everybody', platform: 'Coursera', url: 'https://coursera.org'})
        MERGE (c2:Course {title: 'Advanced React Patterns', platform: 'Udemy', url: 'https://udemy.com'})
        MERGE (c3:Course {title: 'Machine Learning A-Z', platform: 'Udemy', url: 'https://udemy.com'})
        MERGE (c4:Course {title: 'AWS Certified Solutions Architect', platform: 'A Cloud Guru', url: 'https://acloudguru.com'})
        MERGE (c5:Course {title: 'Docker Mastery', platform: 'Udemy', url: 'https://udemy.com'})
        """,
        """
        // 4. Link Roles to REQUIRED Skills
        MATCH (sde:JobRole {title: 'Software Engineer'})
        MATCH (python:Skill {name: 'Python'}), (js:Skill {name: 'JavaScript'}), (aws:Skill {name: 'AWS'}), (docker:Skill {name: 'Docker'})
        MERGE (sde)-[:REQUIRES_SKILL {importance: 'must'}]->(python)
        MERGE (sde)-[:REQUIRES_SKILL {importance: 'must'}]->(js)
        MERGE (sde)-[:REQUIRES_SKILL {importance: 'nice'}]->(aws)
        MERGE (sde)-[:REQUIRES_SKILL {importance: 'nice'}]->(docker)
        """,
        """
        // 5. Link Courses to the Skills they TEACH
        MATCH (c1:Course {title: 'Python for Everybody'}), (python:Skill {name: 'Python'}) MERGE (c1)-[:TEACHES_SKILL]->(python)
        MATCH (c2:Course {title: 'Advanced React Patterns'}), (react:Skill {name: 'React'}) MERGE (c2)-[:TEACHES_SKILL]->(react)
        MATCH (c3:Course {title: 'Machine Learning A-Z'}), (ml:Skill {name: 'Machine Learning'}) MERGE (c3)-[:TEACHES_SKILL]->(ml)
        MATCH (c4:Course {title: 'AWS Certified Solutions Architect'}), (aws:Skill {name: 'AWS'}) MERGE (c4)-[:TEACHES_SKILL]->(aws)
        MATCH (c5:Course {title: 'Docker Mastery'}), (docker:Skill {name: 'Docker'}) MERGE (c5)-[:TEACHES_SKILL]->(docker)
        """
    ]

    with driver.session() as session:
        for i, query in enumerate(queries):
            session.run(query)
            print(f"Executed seed block {i+1}/{len(queries)}")
    
    print("Knowledge Graph Seeding Complete! The brain is now online.")
    driver.close()

if __name__ == "__main__":
    print("Seeding Neo4j Knowledge Graph...")
    seed_graph()