"""
scripts/seed_db.py
==================
Database seeding script — loads sample CSV data into the database
via the ETL pipeline.

Usage:
    python -m scripts.seed_db

This script:
    1. Creates all database tables (if they don't exist)
    2. Runs the ETL pipeline on sample CSV data
    3. Prints a summary of loaded records

Run this after generate_data.py to populate the database for
testing and demonstration.
"""

import os
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.database import SessionLocal, create_tables
from services.etl_service import ETLPipeline


def seed_database():
    """Create tables and load sample data into the database."""
    print("=" * 60)
    print("  InsuranceIQ -- Database Seeding")
    print("=" * 60)

    # -- Step 1: Create tables ----------------------------------
    print("\n[1/2] Creating database tables...")
    create_tables()
    print("  OK: Tables created successfully")

    # -- Step 2: Run ETL pipeline on sample data ----------------
    print("\n[2/2] Running ETL pipeline on sample data...")
    db = SessionLocal()
    try:
        pipeline = ETLPipeline(db)
        result = pipeline.run(source_type="sample")

        print(f"\n  Status:          {result['status']}")
        print(f"  Rows processed:  {result['rows_processed']}")
        print(f"  Rows failed:     {result['rows_failed']}")
        print(f"  Processing time: {result['processing_time_ms']:.0f}ms")

        if result["errors"]:
            print(f"\n  Errors ({len(result['errors'])}):")
            for err in result["errors"][:5]:
                print(f"    - {err}")

        if result["summary"]:
            print(f"\n  Summary:")
            for dataset, stats in result["summary"].items():
                print(f"    {dataset}: {stats}")

    finally:
        db.close()

    print("\n" + "=" * 60)
    print("  OK: Database seeded successfully!")
    print("=" * 60)


if __name__ == "__main__":
    seed_database()
