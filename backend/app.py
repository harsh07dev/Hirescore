from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, os
import fitz  # PyMuPDF
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

DB = "hirescope.db"

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            name TEXT,
            email TEXT,
            resume_text TEXT,
            fit_score INTEGER,
            strengths TEXT,
            weaknesses TEXT,
            skills TEXT,
            experience TEXT,
            stage TEXT DEFAULT 'applied',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/api/health")
def health():
    return jsonify({"status": "HireScope backend is running!"})
@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    conn = get_db()
    jobs = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(j) for j in jobs])

@app.route("/api/jobs", methods=["POST"])
def create_job():
    data = request.json
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO jobs (title, description) VALUES (?,?)",
        (data["title"], data["description"])
    )
    conn.commit()
    job_id = cur.lastrowid
    conn.close()
    return jsonify({"id": job_id, "title": data["title"], "description": data["description"]})

@app.route("/api/jobs/<int:job_id>/upload", methods=["POST"])
def upload_resumes(job_id):
    files = request.files.getlist("resumes")
    if not files:
        return jsonify({"error": "No files provided"}), 400

    processed = []
    conn = get_db()

    for file in files:
        filename = file.filename
        try:
            # Extract text from PDF using PyMuPDF
            pdf_bytes = file.read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()

            # Save candidate to DB
            cur = conn.execute(
                """INSERT INTO candidates
                   (job_id, name, email, resume_text, fit_score, strengths, weaknesses, skills, experience, stage)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (job_id, "Pending AI Screen", "", text, 0, "", "", "", "", "applied")
            )
            conn.commit()

            processed.append({
                "id": cur.lastrowid,
                "filename": filename,
                "job_id": job_id,
                "name": "Pending AI Screen",
                "stage": "applied"
            })

        except Exception as e:
            # Skip failed file, continue with rest
            processed.append({
                "filename": filename,
                "error": str(e),
                "skipped": True
            })
            continue

    conn.close()
    return jsonify(processed), 201


@app.route("/api/jobs/<int:job_id>/candidates", methods=["GET"])
def get_candidates(job_id):
    conn = get_db()
    rows = conn.execute(
        """SELECT id, job_id, name, email, resume_text, fit_score,
                  strengths, weaknesses, skills, experience, stage, created_at
           FROM candidates
           WHERE job_id = ?
           ORDER BY fit_score DESC""",
        (job_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


if __name__ == "__main__":
    app.run(debug=True, port=5000)