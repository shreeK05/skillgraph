from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db
from sqlalchemy.orm import Session
import importlib
import os

router = APIRouter()


@router.post("/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """Trigger idempotent seed scripts for local/demo environments.

    This imports the seeder modules and runs their seeding functions directly
    to avoid shell subprocess issues under the FastAPI reloader.
    """
    try:
        # Compute repository root (skillgraph)
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../'))

        # Import and run Postgres seeder
        spec_path = os.path.join(repo_root, 'backend')
        if spec_path not in os.sys.path:
            os.sys.path.insert(0, spec_path)
        seed_mod = importlib.import_module('scripts.seed_db')
        if hasattr(seed_mod, 'seed'):
            seed_mod.seed()

        # Import and run Neo4j seeder
        # Ensure repo root is on sys.path for ml package imports
        if repo_root not in os.sys.path:
            os.sys.path.insert(0, repo_root)
        graph_mod = importlib.import_module('ml.scripts.seed_knowledge_graph')
        if hasattr(graph_mod, 'seed_graph'):
            graph_mod.seed_graph()

        return {"message": "Seeding executed (Postgres + Neo4j)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))