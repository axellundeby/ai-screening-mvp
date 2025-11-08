# main.py — FastAPI backend for AI Screening MVP (robust JSON parsing)
# -------------------------------------------------------------------
# Toggle between mock and OpenAI scoring:
USE_OPENAI = True 

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pypdf import PdfReader
from dotenv import load_dotenv
import io, os, hashlib, random, logging, json, re, importlib

# OpenAI (only used if USE_OPENAI)
from openai import OpenAI

load_dotenv()
app = FastAPI(title="AI Screening Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def health():
    return {"ok": True}

# --- Quiet pypdf noise
try:
    _pypdf_logger_mod = importlib.import_module("pypdf._logger")
    pypdf_logger = getattr(_pypdf_logger_mod, "logger", None)
    if pypdf_logger:
        pypdf_logger.setLevel(logging.ERROR)
except Exception:
    pass

# Optional pdfminer fallback
try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
except Exception:
    pdfminer_extract_text = None

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if (USE_OPENAI and OPENAI_API_KEY) else None
MAX_CHARS_PER_CV = 20_000

# ---------------- helpers ----------------
def extract_pdf_text(content: bytes) -> str:
    """Extract text from a PDF (bytes) with tolerant settings + fallback."""
    text = ""
    try:
        reader = PdfReader(io.BytesIO(content), strict=False)
        parts = []
        for p in reader.pages:
            try:
                parts.append(p.extract_text() or "")
            except Exception:
                continue
        text = "\n".join(parts).strip()
    except Exception:
        text = ""

    if not text and pdfminer_extract_text:
        try:
            text = (pdfminer_extract_text(io.BytesIO(content)) or "").strip()
        except Exception:
            pass

    return text

def mock_score_candidate(name: str, qualities: str) -> float:
    """Deterministic pseudo-random score (10..100) for demo/testing."""
    seed = int(hashlib.sha1(f"{name}:{qualities}".encode()).hexdigest(), 16)
    random.seed(seed)
    return round(random.uniform(10, 100), 2)

def coerce_json_from_model(raw: str) -> dict:
    """
    Accept model output that might include markdown fences or extra text.
    - Strips ```json ... ``` or ``` ... ```
    - Extracts the first {...} block
    - Parses as JSON
    Raises on failure.
    """
    s = raw.strip()
    # Strip triple backticks fences, with or without language tag
    if s.startswith("```"):
        # remove opening fence with optional language and trailing newline
        s = re.sub(r"^```[\w-]*\s*", "", s)
        # remove closing fence at end
        s = re.sub(r"\s*```$", "", s)

    # If any extra text remains around the JSON, slice to first {...} block
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        s = s[start : end + 1]

    # Final parse
    return json.loads(s)

def truncate_for_model(text: str, max_chars: int = MAX_CHARS_PER_CV) -> str:
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n...\n" + text[-half:]

def openai_score_cv(qualities_text: str, cv_text: str, candidate_name: str) -> dict:
    """
    Returns {"score": float, "reason": str} using OpenAI chat.completions.
    We ask the model to reply as JSON; parser is robust to code fences.
    """
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI client not initialized.")
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set on server.")

    system = (
        "You are a careful recruiting screener. "
        "Given a list of desired qualities and a single CV's text, "
        "judge the fit and respond ONLY with a compact JSON object "
        'like {\"score\": \"reason\": \"why the score\"}. '
        "Do not include code fences or any extra text."
    )

    user = f"""
Qualities (one per line):
{qualities_text}

Candidate: {candidate_name}
CV (truncated if long):
{truncate_for_model(cv_text)}
"""

    # Try json_object mode when SDK/model supports it; fall back otherwise
    use_json_mode = True
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},  # newer SDKs/models
        )
        raw = (resp.choices[0].message.content or "").strip()
    except TypeError:
        # Older SDKs: no response_format; still ask for JSON and parse loosely
        use_json_mode = False
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.1,
        )
        raw = (resp.choices[0].message.content or "").strip()

    # Parse robustly (handles code fences if the model ignored instructions)
    try:
        data = coerce_json_from_model(raw)
        score = float(data.get("score", 50))
        reason = str(data.get("reason", "")).strip()
    except Exception as e:
        print(f"[{candidate_name}] JSON parse error: {e}. Raw: {raw[:300]}")
        score, reason = 50.0, "Parse error; defaulted to 50."

    return {"score": max(0.0, min(100.0, round(score, 2))), "reason": reason, "json_mode": use_json_mode}

# --------------- route ------------------
@app.post("/api/screen")
async def screen_candidates(
    files: List[UploadFile] = File(..., description="PDF CVs"),
    qualities: str = Form(..., description="Desired candidate qualities (one per line)"),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if not qualities.strip():
        raise HTTPException(status_code=400, detail="Qualities are required.")

    print(f"\n🧠 Screening {len(files)} candidates for qualities:\n{qualities}\n")

    # Normalize qualities to bullets; useful for the model
    qualities_list = [q.strip() for q in qualities.splitlines() if q.strip()]
    qualities_text = "\n".join(f"- {q}" for q in qualities_list) if qualities_list else qualities.strip()

    results = []
    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"Only PDFs allowed: {f.filename}")

        content = await f.read()
        name = os.path.splitext(os.path.basename(f.filename))[0]
        text = extract_pdf_text(content)
        print(f"Parsed {len(text)} chars from '{name}'")

        if USE_OPENAI:
            result = openai_score_cv(qualities_text, text, name)
            score = result["score"]
            reason = result.get("reason", "")
            mode = "json_mode" if result.get("json_mode") else "plain"
            print(f"[{name}] score={score} mode={'json' if result.get('json_mode') else 'plain'} reason={reason[:200]}")
        else:
            score = mock_score_candidate(name, qualities_text)
            print(f"[{name}] score={score} reason=(mock) seeded by file+qualities")

        results.append({
            "id": hashlib.sha1(f"{name}:{len(text)}".encode()).hexdigest()[:10],
            "name": name,
            "score": float(score),
            "url": None,
        })

    # Sort best → worst
    results.sort(key=lambda r: r["score"], reverse=True)
    return results
