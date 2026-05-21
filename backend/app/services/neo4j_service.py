# file: backend/app/services/neo4j_service.py
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

class Neo4jService:
    def __init__(self):
        uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        user = os.environ.get("NEO4J_USER", "neo4j")
        password = os.environ.get("NEO4J_PASSWORD", "password")
        
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            # Verify connection
            self.driver.verify_connectivity()
            print("Successfully connected to Neo4j Knowledge Graph!")
        except Exception as e:
            print(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def get_learning_path(self, student_id: str, role_title: str):
        """
        Executes a complex Cypher query to find missing skills and recommend courses.
        """
        if not self.driver:
            return self._fallback_learning_path(role_title)

        query = """
        // 1. Match the target job role and its required skills
        MATCH (r:JobRole {title: $role_title})-[:REQUIRES_SKILL]->(req_skill:Skill)
        
        // 2. Find which of these skills the student DOES NOT have
        WHERE NOT EXISTS {
            MATCH (s:Student {student_id: $student_id})-[:HAS_SKILL]->(req_skill)
        }
        
        // 3. For those missing skills, find courses that teach them
        OPTIONAL MATCH (c:Course)-[:TEACHES_SKILL]->(req_skill)
        
        // 4. Return the aggregated learning path
        WITH req_skill, collect(DISTINCT c) AS courses
        RETURN req_skill.name AS skill_name, 
               req_skill.demand_score AS priority,
               [course IN courses[0..3] | {title: course.title, url: course.url}] AS recommended_courses
        ORDER BY priority DESC
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, student_id=str(student_id), role_title=role_title)
                path = []
                for record in result:
                    path.append({
                        "skill": record["skill_name"],
                        "priority": record["priority"],
                        "courses": record["recommended_courses"]
                    })
                return path if path else self._fallback_learning_path(role_title)
        except Exception:
            return self._fallback_learning_path(role_title)

    def _fallback_learning_path(self, role_title: str):
        fallback_map = {
            "software engineer": [
                {"skill": "Python", "priority": 9.5, "courses": [{"title": "Python for Everybody", "url": "https://coursera.org"}]},
                {"skill": "React", "priority": 8.8, "courses": [{"title": "Advanced React Patterns", "url": "https://udemy.com"}]},
                {"skill": "AWS", "priority": 8.7, "courses": [{"title": "AWS Certified Solutions Architect", "url": "https://acloudguru.com"}]},
            ],
            "data scientist": [
                {"skill": "Machine Learning", "priority": 9.8, "courses": [{"title": "Machine Learning A-Z", "url": "https://udemy.com"}]},
                {"skill": "Python", "priority": 9.2, "courses": [{"title": "Python for Everybody", "url": "https://coursera.org"}]},
                {"skill": "Neo4j", "priority": 8.1, "courses": [{"title": "Neo4j GraphAcademy", "url": "https://graphacademy.neo4j.com"}]},
            ],
            "frontend developer": [
                {"skill": "React", "priority": 9.3, "courses": [{"title": "Advanced React Patterns", "url": "https://udemy.com"}]},
                {"skill": "JavaScript", "priority": 9.0, "courses": [{"title": "Modern JavaScript", "url": "https://coursera.org"}]},
                {"skill": "CSS", "priority": 8.0, "courses": [{"title": "CSS Fundamentals", "url": "https://udemy.com"}]},
            ],
        }

        key = role_title.strip().lower()
        return fallback_map.get(key, fallback_map["software engineer"])

neo4j_service = Neo4jService()