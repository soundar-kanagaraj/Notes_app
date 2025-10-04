from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import uuid
from functools import wraps
import os
import logging
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "SI5hGKqzv9v0Pq2ftfssFLY7aVRNK8Ei"
)


try:
    import pymysql

    HOST = os.environ.get("DATABASE_HOST", "localhost")
    USER = os.environ.get("DATABASE_USER", "root")
    PASSWORD = os.environ.get("DATABASE_PASSWORD", "root")
    PORT = int(os.environ.get("DATABASE_PORT", 3306))
    DB_NAME = os.environ.get("DATABASE_NAME", "notes_db")

    conn = pymysql.connect(host=HOST, user=USER, password=PASSWORD, port=PORT)
    with conn.cursor() as cursor:
        cursor.execute(
            "CREATE DATABASE IF NOT EXISTS notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
    conn.commit()
    conn.close()
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}/{DB_NAME}"
    )
    logging.info(
        f"Using MySQL database '{DB_NAME}' at {HOST} (user={USER}). If this is not intended, set DATABASE_URL."
    )
except ImportError:
    logging.warning(
        "PyMySQL is not installed. Falling back to sqlite. Install PyMySQL and re-run to use MySQL."
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///notes.db"
except Exception as e:
    logging.warning(
        f"Could not connect to MySQL (root@localhost). Falling back to sqlite. Error: {e}"
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///notes.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
db = SQLAlchemy(app)


# Database Models
class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_update = db.Column(
        db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
    notes = db.relationship(
        "Note", backref="user", lazy=True, cascade="all, delete-orphan"
    )


class Note(db.Model):
    __tablename__ = "notes"
    note_id = db.Column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_title = db.Column(db.String(200), nullable=False)
    note_content = db.Column(db.Text, nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    last_update = db.Column(
        db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
    user_id = db.Column(db.String(36), db.ForeignKey("users.user_id"), nullable=False)


# JWT Token Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        try:
            if token.startswith("Bearer "):
                token = token[7:]
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user:
                return jsonify({"message": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401
        return f(current_user, *args, **kwargs)

    return decorated


# Auth Routes
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if (
        not data
        or not data.get("user_name")
        or not data.get("user_email")
        or not data.get("password")
    ):
        return jsonify({"message": "Missing required fields"}), 400

    if User.query.filter_by(user_email=data["user_email"]).first():
        return jsonify({"message": "Email already exists"}), 409

    hashed_password = generate_password_hash(data["password"], method="pbkdf2:sha256")
    new_user = User(
        user_name=data["user_name"],
        user_email=data["user_email"],
        password=hashed_password,
    )

    db.session.add(new_user)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "User created successfully",
                "user": {
                    "user_id": new_user.user_id,
                    "user_name": new_user.user_name,
                    "user_email": new_user.user_email,
                },
            }
        ),
        201,
    )


@app.route("/api/auth/signin", methods=["POST"])
def signin():
    data = request.get_json()

    if not data or not data.get("user_email") or not data.get("password"):
        return jsonify({"message": "Missing email or password"}), 400

    user = User.query.filter_by(user_email=data["user_email"]).first()

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "user_id": user.user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return (
        jsonify(
            {
                "token": token,
                "user": {
                    "user_id": user.user_id,
                    "user_name": user.user_name,
                    "user_email": user.user_email,
                },
            }
        ),
        200,
    )


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return (
        jsonify(
            {
                "user": {
                    "user_id": current_user.user_id,
                    "user_name": current_user.user_name,
                    "user_email": current_user.user_email,
                }
            }
        ),
        200,
    )


# Notes Routes
@app.route("/api/notes", methods=["GET"])
@token_required
def get_notes(current_user):
    notes = (
        Note.query.filter_by(user_id=current_user.user_id)
        .order_by(Note.last_update.desc())
        .all()
    )
    return (
        jsonify(
            {
                "notes": [
                    {
                        "note_id": note.note_id,
                        "note_title": note.note_title,
                        "note_content": note.note_content,
                        "created_on": note.created_on.isoformat(),
                        "last_update": note.last_update.isoformat(),
                    }
                    for note in notes
                ]
            }
        ),
        200,
    )


@app.route("/api/notes/<note_id>", methods=["GET"])
@token_required
def get_note(current_user, note_id):
    note = Note.query.filter_by(note_id=note_id, user_id=current_user.user_id).first()
    if not note:
        return jsonify({"message": "Note not found"}), 404

    return (
        jsonify(
            {
                "note": {
                    "note_id": note.note_id,
                    "note_title": note.note_title,
                    "note_content": note.note_content,
                    "created_on": note.created_on.isoformat(),
                    "last_update": note.last_update.isoformat(),
                }
            }
        ),
        200,
    )


@app.route("/api/notes", methods=["POST"])
@token_required
def create_note(current_user):
    data = request.get_json()

    if not data or not data.get("note_title") or not data.get("note_content"):
        return jsonify({"message": "Missing required fields"}), 400

    new_note = Note(
        note_title=data["note_title"],
        note_content=data["note_content"],
        user_id=current_user.user_id,
    )

    db.session.add(new_note)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Note created successfully",
                "note": {
                    "note_id": new_note.note_id,
                    "note_title": new_note.note_title,
                    "note_content": new_note.note_content,
                    "created_on": new_note.created_on.isoformat(),
                    "last_update": new_note.last_update.isoformat(),
                },
            }
        ),
        201,
    )


@app.route("/api/notes/<note_id>", methods=["PUT"])
@token_required
def update_note(current_user, note_id):
    note = Note.query.filter_by(note_id=note_id, user_id=current_user.user_id).first()
    if not note:
        return jsonify({"message": "Note not found"}), 404

    data = request.get_json()
    if data.get("note_title"):
        note.note_title = data["note_title"]
    if data.get("note_content"):
        note.note_content = data["note_content"]

    note.last_update = datetime.datetime.utcnow()
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Note updated successfully",
                "note": {
                    "note_id": note.note_id,
                    "note_title": note.note_title,
                    "note_content": note.note_content,
                    "created_on": note.created_on.isoformat(),
                    "last_update": note.last_update.isoformat(),
                },
            }
        ),
        200,
    )


@app.route("/api/notes/<note_id>", methods=["DELETE"])
@token_required
def delete_note(current_user, note_id):
    note = Note.query.filter_by(note_id=note_id, user_id=current_user.user_id).first()
    if not note:
        return jsonify({"message": "Note not found"}), 404

    db.session.delete(note)
    db.session.commit()

    return jsonify({"message": "Note deleted successfully"}), 200


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0", port=5000)
