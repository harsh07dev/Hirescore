from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, os
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

if __name__ == "__main__":
    app.run(debug=True, port=5000)