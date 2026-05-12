import aiosqlite
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "serai.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                company_name TEXT NOT NULL,
                form_data TEXT NOT NULL,
                analysis_result TEXT NOT NULL,
                pdf_path TEXT
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                form_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        await db.commit()


async def save_analysis(company_name: str, form_data: dict, analysis_result: dict) -> str:
    analysis_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO analyses (id, timestamp, company_name, form_data, analysis_result, pdf_path)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                timestamp,
                company_name,
                json.dumps(form_data),
                json.dumps(analysis_result),
                None,
            ),
        )
        await db.commit()
    return analysis_id


async def update_pdf_path(analysis_id: str, pdf_path: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE analyses SET pdf_path = ? WHERE id = ?",
            (pdf_path, analysis_id),
        )
        await db.commit()


async def delete_analysis(analysis_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
        await db.commit()


async def get_all_analyses() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, timestamp, company_name, analysis_result FROM analyses ORDER BY timestamp DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "company_name": row["company_name"],
                    "global_score": json.loads(row["analysis_result"]).get("global_score"),
                    "risk_level": json.loads(row["analysis_result"]).get("risk_level"),
                    "dimension_scores": json.loads(row["analysis_result"]).get("dimension_scores"),
                }
                for row in rows
            ]


async def get_analysis(analysis_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "timestamp": row["timestamp"],
                "company_name": row["company_name"],
                "form_data": json.loads(row["form_data"]),
                "analysis_result": json.loads(row["analysis_result"]),
                "pdf_path": row["pdf_path"],
            }


async def save_profile(name: str, form_data: dict) -> dict:
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO profiles (id, name, form_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (profile_id, name, json.dumps(form_data), now, now),
        )
        await db.commit()
    return {"id": profile_id, "name": name, "updated_at": now}


async def get_all_profiles() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, name, updated_at FROM profiles ORDER BY updated_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [{"id": r["id"], "name": r["name"], "updated_at": r["updated_at"]} for r in rows]


async def get_profile(profile_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "name": row["name"],
                "form_data": json.loads(row["form_data"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }


async def update_profile(profile_id: str, name: str, form_data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE profiles SET name = ?, form_data = ?, updated_at = ? WHERE id = ?",
            (name, json.dumps(form_data), now, profile_id),
        )
        await db.commit()
    return {"id": profile_id, "name": name, "updated_at": now}


async def delete_profile(profile_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
        await db.commit()


async def get_analyses_by_company(company_name: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, timestamp, analysis_result FROM analyses WHERE company_name = ? ORDER BY timestamp ASC",
            (company_name,),
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "analysis_result": json.loads(row["analysis_result"]),
                }
                for row in rows
            ]
