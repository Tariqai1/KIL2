# Migration runner for Alembic
# Run this at app startup to apply pending migrations

import os
import subprocess
from pathlib import Path

def run_migrations():
    """Run Alembic migrations at app startup"""
    try:
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        print("🔄 Running Database Migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ Database Migrations Applied Successfully")
        else:
            print(f"⚠️ Migration Warning: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("⚠️ Migrations Timeout (60s) - DB might be slow")
    except FileNotFoundError:
        print("⚠️ Alembic not found - skipping migrations")
    except Exception as e:
        print(f"⚠️ Migration Error (non-blocking): {str(e)}")
        # Don't crash app if migrations fail - DB might be down during build
