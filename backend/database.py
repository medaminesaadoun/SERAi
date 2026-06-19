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
                pdf_path TEXT,
                status TEXT NOT NULL DEFAULT 'completed',
                cancelled_at_pct REAL,
                draft_id TEXT
            )
            """
        )
        # Backfill columns for existing DBs that pre-date the status fields.
        for col, typedef in [
            ("status", "TEXT NOT NULL DEFAULT 'completed'"),
            ("cancelled_at_pct", "REAL"),
            ("draft_id", "TEXT"),
        ]:
            try:
                await db.execute(f"ALTER TABLE analyses ADD COLUMN {col} {typedef}")
            except Exception:
                pass  # Column already exists.
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
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_cache (
                form_data_hash TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                form_data TEXT NOT NULL,
                analysis_result TEXT NOT NULL,
                model TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_accessed_at TEXT NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_cache_company ON analysis_cache(company_name)"
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
            )
            """
        )
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_chat_analysis ON chat_messages(analysis_id, created_at)"
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_drafts (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                company_name TEXT,
                form_data_hash TEXT NOT NULL,
                partial_text TEXT NOT NULL,
                progress_pct REAL NOT NULL,
                tasks_completed TEXT,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
            )
            """
        )
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_drafts_company ON analysis_drafts(company_name)"
        )
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_drafts_expires ON analysis_drafts(expires_at)"
        )
        await db.commit()


async def save_analysis(
    company_name: str,
    form_data: dict,
    analysis_result: dict,
    status: str = "completed",
    cancelled_at_pct: float | None = None,
    draft_id: str | None = None,
) -> str:
    analysis_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO analyses (id, timestamp, company_name, form_data, analysis_result, pdf_path, status, cancelled_at_pct, draft_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                timestamp,
                company_name,
                json.dumps(form_data),
                json.dumps(analysis_result) if analysis_result is not None else None,
                None,
                status,
                cancelled_at_pct,
                draft_id,
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
            "SELECT id, timestamp, company_name, analysis_result, status, cancelled_at_pct, draft_id FROM analyses ORDER BY timestamp DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            result = []
            for row in rows:
                result_row = {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "company_name": row["company_name"],
                    "status": row["status"],
                    "cancelled_at_pct": row["cancelled_at_pct"],
                    "draft_id": row["draft_id"],
                }
                # Cancelled attempts have no parsed result.
                if row["analysis_result"]:
                    parsed = json.loads(row["analysis_result"])
                    result_row["global_score"] = parsed.get("global_score")
                    result_row["risk_level"] = parsed.get("risk_level")
                    result_row["dimension_scores"] = parsed.get("dimension_scores")
                else:
                    result_row["global_score"] = None
                    result_row["risk_level"] = None
                    result_row["dimension_scores"] = None
                result.append(result_row)
            return result


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
                "analysis_result": json.loads(row["analysis_result"]) if row["analysis_result"] else None,
                "pdf_path": row["pdf_path"],
                "status": row["status"],
                "cancelled_at_pct": row["cancelled_at_pct"],
                "draft_id": row["draft_id"],
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


# ── Cache CRUD ────────────────────────────────────────────────────────────────

async def get_cached_analysis(form_data_hash: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analysis_cache WHERE form_data_hash = ?", (form_data_hash,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            now = datetime.now(timezone.utc).isoformat()
            await db.execute(
                "UPDATE analysis_cache SET access_count = access_count + 1, last_accessed_at = ? WHERE form_data_hash = ?",
                (now, form_data_hash),
            )
            await db.commit()
            return {
                "form_data_hash": row["form_data_hash"],
                "company_name": row["company_name"],
                "form_data": json.loads(row["form_data"]),
                "analysis_result": json.loads(row["analysis_result"]),
                "model": row["model"],
                "created_at": row["created_at"],
                "last_accessed_at": now,
                "access_count": row["access_count"] + 1,
            }


async def put_cached_analysis(form_data_hash: str, company_name: str, form_data: dict, analysis_result: dict, model: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT OR REPLACE INTO analysis_cache
                (form_data_hash, company_name, form_data, analysis_result, model, created_at, last_accessed_at, access_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (form_data_hash, company_name, json.dumps(form_data), json.dumps(analysis_result), model, now, now),
        )
        await db.commit()


async def get_cache_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM analysis_cache") as cur:
            size = (await cur.fetchone())[0]
        async with db.execute("SELECT COALESCE(SUM(access_count), 0) FROM analysis_cache") as cur:
            total_accesses = (await cur.fetchone())[0]
        async with db.execute("SELECT MIN(created_at), MAX(created_at) FROM analysis_cache") as cur:
            row = await cur.fetchone()
            oldest, newest = row[0], row[1]
        return {
            "size": size,
            "total_accesses": total_accesses,
            "oldest": oldest,
            "newest": newest,
        }


async def delete_cached_analysis(form_data_hash: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM analysis_cache WHERE form_data_hash = ?", (form_data_hash,))
        await db.commit()


async def clear_cache() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM analysis_cache")
        await db.commit()
        return cur.rowcount or 0


# ── Chat CRUD ─────────────────────────────────────────────────────────────────

async def save_chat_message(message_id: str, analysis_id: str, role: str, content: str) -> dict:
    created_at = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO chat_messages (id, analysis_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (message_id, analysis_id, role, content, created_at),
        )
        await db.commit()
    return {
        "id": message_id,
        "analysis_id": analysis_id,
        "role": role,
        "content": content,
        "created_at": created_at,
    }


async def get_chat_history(analysis_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, analysis_id, role, content, created_at FROM chat_messages WHERE analysis_id = ? ORDER BY created_at ASC",
            (analysis_id,),
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def clear_chat_history(analysis_id: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM chat_messages WHERE analysis_id = ?", (analysis_id,))
        await db.commit()
        return cur.rowcount or 0


# ── Drafts CRUD ────────────────────────────────────────────────────────────────

DRAFT_TTL_DAYS = 7


async def save_draft(
    analysis_id: str,
    company_name: str | None,
    form_data_hash: str,
    partial_text: str,
    progress_pct: float,
    tasks_completed: list[str] | None = None,
) -> dict:
    """Persist a partial-text draft for a cancelled analysis.

    Returns the created draft row.
    """
    draft_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires = now.timestamp() + (DRAFT_TTL_DAYS * 86400)
    created_at = now.isoformat()
    expires_at = datetime.fromtimestamp(expires, timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO analysis_drafts
                (id, analysis_id, company_name, form_data_hash, partial_text, progress_pct, tasks_completed, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                draft_id,
                analysis_id,
                company_name,
                form_data_hash,
                partial_text,
                progress_pct,
                json.dumps(tasks_completed or []),
                created_at,
                expires_at,
            ),
        )
        await db.execute(
            "UPDATE analyses SET draft_id = ? WHERE id = ?",
            (draft_id, analysis_id),
        )
        await db.commit()
    return {
        "id": draft_id,
        "analysis_id": analysis_id,
        "company_name": company_name,
        "form_data_hash": form_data_hash,
        "partial_text": partial_text,
        "progress_pct": progress_pct,
        "tasks_completed": tasks_completed or [],
        "created_at": created_at,
        "expires_at": expires_at,
    }


async def get_draft(draft_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analysis_drafts WHERE id = ?", (draft_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "analysis_id": row["analysis_id"],
                "company_name": row["company_name"],
                "form_data_hash": row["form_data_hash"],
                "partial_text": row["partial_text"],
                "progress_pct": row["progress_pct"],
                "tasks_completed": json.loads(row["tasks_completed"]) if row["tasks_completed"] else [],
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
            }


async def get_drafts_for_company(company_name: str) -> list[dict]:
    """Return non-expired drafts for a given company, newest first."""
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analysis_drafts WHERE company_name = ? AND expires_at > ? ORDER BY created_at DESC",
            (company_name, now),
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": row["id"],
                    "analysis_id": row["analysis_id"],
                    "company_name": row["company_name"],
                    "form_data_hash": row["form_data_hash"],
                    "progress_pct": row["progress_pct"],
                    "tasks_completed": json.loads(row["tasks_completed"]) if row["tasks_completed"] else [],
                    "created_at": row["created_at"],
                    "expires_at": row["expires_at"],
                    # Don't include the full text in list view to keep it light.
                    "partial_text_preview": (row["partial_text"][:200] + "…") if len(row["partial_text"]) > 200 else row["partial_text"],
                }
                for row in rows
            ]


async def delete_draft(draft_id: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM analysis_drafts WHERE id = ?", (draft_id,))
        await db.commit()
        return cur.rowcount or 0


async def cleanup_expired_drafts() -> int:
    """Delete all expired drafts. Returns number of rows removed."""
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM analysis_drafts WHERE expires_at <= ?", (now,))
        await db.commit()
        return cur.rowcount or 0


async def get_latest_draft_for_company(company_name: str) -> dict | None:
    drafts = await get_drafts_for_company(company_name)
    return drafts[0] if drafts else None
