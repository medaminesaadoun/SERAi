"""
One-time backfill script: adds mitre_tactic to all existing analyses in the DB.

Old analyses (created before the kill-chain feature) don't have mitre_tactic on
their scenarios. This script reads each analysis, infers the tactic from the
existing mitre_technique, and updates the analysis_result JSON in-place.

Run once:
    cd backend
    python backfill_tactics.py
"""

import json
import sqlite3
import sys
from pathlib import Path

from mitre_tactics import infer_tactic

DB_PATH = Path(__file__).parent / "serai.db"


REQUIRED_COLUMNS = [
    ("status",          "TEXT NOT NULL DEFAULT 'completed'"),
    ("cancelled_at_pct", "REAL"),
    ("draft_id",        "TEXT"),
]


def ensure_schema(conn) -> list[str]:
    """Add missing columns to the analyses table. Idempotent.

    Returns the list of columns that were added (for logging).
    """
    cur = conn.execute("PRAGMA table_info(analyses)")
    existing = {row[1] for row in cur.fetchall()}

    added = []
    for name, typedef in REQUIRED_COLUMNS:
        if name in existing:
            continue
        try:
            conn.execute(f"ALTER TABLE analyses ADD COLUMN {name} {typedef}")
            added.append(name)
        except sqlite3.OperationalError as e:
            print(f"  [!] Could not add column {name}: {e}")

    if added:
        conn.commit()
    return added


def main() -> int:
    if not DB_PATH.exists():
        print(f"[!] Database not found at {DB_PATH}")
        return 1

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    added = ensure_schema(conn)
    if added:
        print(f"[*] Schema migration: added columns {added}")

    cur = conn.execute(
        "SELECT id, company_name, analysis_result FROM analyses "
        "WHERE analysis_result IS NOT NULL AND status = 'completed'"
    )
    rows = cur.fetchall()

    print(f"[*] Found {len(rows)} completed analyses to backfill")

    updated = 0
    skipped = 0
    failed = 0

    for row in rows:
        analysis_id = row["id"]
        company = row["company_name"]
        result_json = row["analysis_result"]

        try:
            result = json.loads(result_json)
        except (TypeError, json.JSONDecodeError) as e:
            print(f"  [!] {analysis_id[:8]} ({company}): bad JSON, skipping ({e})")
            failed += 1
            continue

        scenarios = result.get("attack_scenarios")
        if not scenarios:
            skipped += 1
            continue

        changed = False
        for scenario in scenarios:
            if not isinstance(scenario, dict):
                continue
            if scenario.get("mitre_tactic"):
                continue
            technique = scenario.get("mitre_technique", "")
            inferred = infer_tactic(technique)
            if inferred:
                scenario["mitre_tactic"] = inferred[0]
                changed = True

        if not changed:
            skipped += 1
            continue

        conn.execute(
            "UPDATE analyses SET analysis_result = ?, status = 'completed' WHERE id = ?",
            (json.dumps(result), analysis_id),
        )
        updated += 1
        print(f"  [+] {analysis_id[:8]} ({company}): backfilled {len(scenarios)} scenarios")

    conn.commit()
    conn.close()

    print()
    print(f"Done: {updated} updated, {skipped} skipped, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
