import os
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from flask_mail import Mail, Message
from flask_socketio import SocketIO, emit
from config import Config
from models import db, User, Doctor, Patient, Appointment, PatientLog, HealthSlip, DoctorActivityLog, ChatMessage

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# Comma-separated list for production (e.g. https://your-app.vercel.app). Empty = allow all.
_frontend = os.environ.get("FRONTEND_ORIGINS", "").strip()
_cors_origins = [x.strip() for x in _frontend.split(",") if x.strip()] if _frontend else None
if _cors_origins:
    CORS(app, resources={r"/api/*": {"origins": _cors_origins}})
else:
    CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)
mail = Mail(app)
# threading mode: compatible with Python 3.13+ (eventlet greenlets break on 3.13)
_socket_cors = _cors_origins if _cors_origins else "*"
socketio = SocketIO(app, cors_allowed_origins=_socket_cors, async_mode="threading")

with app.app_context():
    db.init_app(app)
    db.create_all()

# ---------------------------------------------------------------------------
# Helper – broadcast a patient log via SocketIO
# ---------------------------------------------------------------------------

def _broadcast_log(log_entry):
    """Emit a patient-log event to all connected admin clients."""
    socketio.emit("new_patient_log", log_entry.to_dict(), namespace="/admin")


def _broadcast_doctor_log(entry):
    socketio.emit("new_doctor_log", entry.to_dict(), namespace="/admin")


def normalize_phone(value):
    if not value:
        return ""
    return re.sub(r"\D", "", value)


def phones_match(a, b):
    na, nb = normalize_phone(a), normalize_phone(b)
    if na and nb:
        if na == nb:
            return True
        ta, tb = na[-10:], nb[-10:]
        if len(ta) == 10 and len(tb) == 10 and ta == tb:
            return True
    return (a or "").strip().lower() == (b or "").strip().lower()


def serialize_user(user):
    data = user.to_dict()
    if user.role == "doctor" and user.doctor_profile:
        data["doctor"] = user.doctor_profile.to_dict()
    elif user.role == "patient" and user.patient_profile:
        data["patient"] = user.patient_profile.to_dict()
    return data


def generate_ai_reply(user_message):
    """Return (reply_text, source)."""
    try:
        import google.generativeai as genai
        api_key = app.config.get("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                f"""You are the Hospital BI Assistant, a friendly hospital health assistant chatbot.
You help patients understand general health topics, explain medical terms,
and provide wellness tips. You always remind users to consult their doctor
for specific medical advice.

IMPORTANT: You are NOT a doctor. Always include a disclaimer.
Keep responses concise (under 150 words) and empathetic.

Patient's question: {user_message}"""
            )
            text = getattr(response, "text", None) or ""
            if text.strip():
                return text.strip(), "gemini"
    except Exception:
        pass

    msg_lower = user_message.lower()
    replies = {
        "headache": "Headaches can be caused by stress, dehydration, or lack of sleep. Try drinking water and resting. If headaches persist or are severe, please consult your doctor. 💊",
        "fever": "For mild fever, stay hydrated and rest. Over-the-counter medications like acetaminophen may help. If fever exceeds 103°F (39.4°C) or lasts more than 3 days, seek medical attention. 🌡️",
        "cold": "Common colds usually resolve in 7-10 days. Rest, drink fluids, and consider over-the-counter decongestants. If symptoms worsen or you develop a high fever, consult your doctor. 🤧",
        "cough": "For a persistent cough, try warm liquids and honey. Avoid irritants. If the cough lasts more than 2 weeks or produces blood, please see your doctor immediately. 💨",
        "stomach": "Stomach issues can range from indigestion to infections. A bland diet (BRAT: bananas, rice, applesauce, toast) can help. Persistent pain warrants a doctor visit. 🍌",
        "sleep": "Good sleep hygiene includes a consistent schedule, avoiding screens before bed, and keeping your room dark and cool. If insomnia persists, discuss with your doctor. 😴",
        "stress": "Stress management techniques include deep breathing, meditation, regular exercise, and maintaining social connections. Chronic stress should be discussed with a healthcare provider. 🧘",
        "diet": "A balanced diet includes fruits, vegetables, lean proteins, whole grains, and healthy fats. Stay hydrated with 8 glasses of water daily. Consult a nutritionist for personalized advice. 🥗",
        "exercise": "Aim for 150 minutes of moderate aerobic activity per week. Include strength training 2-3 days per week. Always warm up and cool down. Start slowly if you're new to exercise. 🏃",
        "appointment": "You can book an appointment through the Patient Dashboard. Navigate to 'Book Appointment', select your preferred doctor and time slot. You'll receive a confirmation email! 📅",
    }

    reply = "Thank you for your question! I'm the Hospital BI Assistant. "
    matched = False
    for keyword, response in replies.items():
        if keyword in msg_lower:
            reply = response
            matched = True
            break

    if not matched:
        reply += (
            "I'd recommend discussing this with your assigned doctor for personalized medical advice. "
            "You can book an appointment through the dashboard. Is there anything else about general health I can help with? 😊"
        )

    reply += "\n\n⚠️ Disclaimer: This is general health information and not a substitute for professional medical advice."
    return reply, "fallback"


def confirmation_email_html(pat_user, doc_user, doc, appt):
    return f"""
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:linear-gradient(135deg,#0f172a,#1e293b);color:#e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#06b6d4,#8b5cf6);padding:24px 32px;">
                <h1 style="margin:0;color:#fff;font-size:24px;">🏥 Hospital BI</h1>
                <p style="margin:4px 0 0;color:#e0f2fe;font-size:14px;">Appointment Confirmation</p>
            </div>
            <div style="padding:32px;">
                <p style="font-size:18px;color:#67e8f9;">Dear <strong>{pat_user.name}</strong>,</p>
                <p>Your appointment has been confirmed with the following details:</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:10px;color:#94a3b8;">Doctor</td><td style="padding:10px;color:#f1f5f9;font-weight:600;">Dr. {doc_user.name}</td></tr>
                    <tr style="background:rgba(255,255,255,0.05);"><td style="padding:10px;color:#94a3b8;">Specialization</td><td style="padding:10px;color:#f1f5f9;">{doc.specialization}</td></tr>
                    <tr><td style="padding:10px;color:#94a3b8;">Date & Time</td><td style="padding:10px;color:#67e8f9;font-weight:600;">{appt.appointment_date.strftime('%B %d, %Y at %I:%M %p')}</td></tr>
                    <tr style="background:rgba(255,255,255,0.05);"><td style="padding:10px;color:#94a3b8;">Room</td><td style="padding:10px;color:#f1f5f9;">{appt.room_number or doc.room_number}</td></tr>
                </table>
                <p style="color:#94a3b8;font-size:13px;">Please arrive 15 minutes before your scheduled time.</p>
            </div>
            <div style="padding:16px 32px;background:rgba(0,0,0,0.3);text-align:center;color:#64748b;font-size:12px;">
                Hospital BI · Contact: +91-1234567890
            </div>
        </div>
        """


def deliver_appointment_confirmation(appt):
    pat = Patient.query.get(appt.patient_id)
    pat_user = User.query.get(pat.user_id)
    doc = Doctor.query.get(appt.doctor_id)
    doc_user = User.query.get(doc.user_id)
    msg = Message(
        subject="🏥 Hospital BI — Appointment Confirmation",
        recipients=[pat_user.email],
    )
    msg.html = confirmation_email_html(pat_user, doc_user, doc, appt)
    mail.send(msg)
    appt.email_sent = True
    db.session.commit()


# ========================== AUTH ROUTES ====================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        name=data["name"],
        email=data["email"],
        phone=data.get("phone", ""),
        role=data.get("role", "patient"),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    if user.role == "patient":
        patient = Patient(
            user_id=user.id,
            blood_group=data.get("blood_group", ""),
            emergency_contact=data.get("emergency_contact", ""),
            address=data.get("address", ""),
        )
        db.session.add(patient)
    elif user.role == "doctor":
        doctor = Doctor(
            user_id=user.id,
            specialization=data.get("specialization", "General Medicine"),
            category=data.get("category", "General"),
            room_number=data.get("room_number", "101"),
            qualification=data.get("qualification", ""),
            experience_years=data.get("experience_years", 0),
        )
        db.session.add(doctor)

    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": serialize_user(user)}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    token = create_access_token(identity=str(user.id))
    if user.role == "doctor" and user.doctor_profile:
        dal = DoctorActivityLog(
            doctor_id=user.doctor_profile.id,
            action="login",
            details="Doctor signed in",
        )
        db.session.add(dal)
        db.session.commit()
        _broadcast_doctor_log(dal)
    return jsonify({"token": token, "user": serialize_user(user)})


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user))


# ========================== DOCTOR ROUTES ==================================

@app.route("/api/doctors", methods=["GET"])
@jwt_required()
def get_doctors():
    category = request.args.get("category")
    q = Doctor.query
    if category:
        q = q.filter_by(category=category)
    doctors = [d.to_dict() for d in q.all()]
    return jsonify(doctors)


@app.route("/api/doctors/<int:doc_id>", methods=["GET"])
@jwt_required()
def get_doctor(doc_id):
    doc = Doctor.query.get_or_404(doc_id)
    return jsonify(doc.to_dict())


@app.route("/api/doctors", methods=["POST"])
@jwt_required()
def create_doctor():
    uid = int(get_jwt_identity())
    admin = User.query.get(uid)
    if not admin or admin.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    # Create user account for doctor
    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(name=data["name"], email=data["email"], phone=data.get("phone", ""), role="doctor")
    user.set_password(data.get("password", "doctor123"))
    db.session.add(user)
    db.session.flush()

    doctor = Doctor(
        user_id=user.id,
        specialization=data.get("specialization", "General Medicine"),
        category=data.get("category", "General"),
        room_number=data.get("room_number", "101"),
        image_url=data.get("image_url", ""),
        qualification=data.get("qualification", ""),
        experience_years=data.get("experience_years", 0),
    )
    db.session.add(doctor)
    db.session.commit()
    return jsonify(doctor.to_dict()), 201


@app.route("/api/doctors/<int:doc_id>", methods=["PUT"])
@jwt_required()
def update_doctor(doc_id):
    doc = Doctor.query.get_or_404(doc_id)
    data = request.get_json()
    for field in ("specialization", "category", "room_number", "image_url", "qualification", "experience_years", "is_available"):
        if field in data:
            setattr(doc, field, data[field])
    if "name" in data:
        user = User.query.get(doc.user_id)
        if user:
            user.name = data["name"]
    db.session.commit()
    return jsonify(doc.to_dict())


@app.route("/api/doctors/categories", methods=["GET"])
@jwt_required()
def get_categories():
    cats = db.session.query(Doctor.category).distinct().all()
    return jsonify([c[0] for c in cats])


# ========================== PATIENT ROUTES =================================

@app.route("/api/patients", methods=["GET"])
@jwt_required()
def get_patients():
    patients = [p.to_dict() for p in Patient.query.all()]
    return jsonify(patients)


@app.route("/api/patients/<int:pat_id>", methods=["GET"])
@jwt_required()
def get_patient(pat_id):
    pat = Patient.query.get_or_404(pat_id)
    return jsonify(pat.to_dict())


@app.route("/api/patients/<int:pat_id>", methods=["PUT"])
@jwt_required()
def update_patient(pat_id):
    uid = int(get_jwt_identity())
    actor = User.query.get(uid)
    pat = Patient.query.get_or_404(pat_id)
    data = request.get_json()

    if actor.role == "patient":
        if not actor.patient_profile or actor.patient_profile.id != pat.id:
            return jsonify({"error": "Forbidden"}), 403
        for field in ("blood_group", "emergency_contact", "address", "medical_history"):
            if field in data:
                setattr(pat, field, data[field])
    elif actor.role == "admin":
        for field in ("blood_group", "emergency_contact", "address", "medical_history"):
            if field in data:
                setattr(pat, field, data[field])
        if "assigned_doctor_id" in data:
            did = data["assigned_doctor_id"]
            if did is None:
                pat.assigned_doctor_id = None
            else:
                if not Doctor.query.get(did):
                    return jsonify({"error": "Doctor not found"}), 404
                pat.assigned_doctor_id = did
    else:
        return jsonify({"error": "Forbidden"}), 403

    db.session.commit()
    return jsonify(pat.to_dict())


# ========================== APPOINTMENT ROUTES =============================

@app.route("/api/appointments", methods=["GET"])
@jwt_required()
def get_appointments():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = Appointment.query

    if user.role == "doctor" and user.doctor_profile:
        q = q.filter_by(doctor_id=user.doctor_profile.id)
    elif user.role == "patient" and user.patient_profile:
        q = q.filter_by(patient_id=user.patient_profile.id)
    # admin sees all

    status = request.args.get("status")
    if status:
        q = q.filter_by(status=status)

    appointments = [a.to_dict() for a in q.order_by(Appointment.appointment_date.desc()).all()]
    return jsonify(appointments)


@app.route("/api/appointments", methods=["POST"])
@jwt_required()
def create_appointment():
    data = request.get_json()
    uid = int(get_jwt_identity())
    user = User.query.get(uid)

    # Determine patient_id
    if user.role == "patient" and user.patient_profile:
        patient_id = user.patient_profile.id
    else:
        patient_id = data.get("patient_id")

    doctor = Doctor.query.get(data["doctor_id"])
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    appt = Appointment(
        patient_id=patient_id,
        doctor_id=data["doctor_id"],
        appointment_date=datetime.fromisoformat(data["appointment_date"]),
        notes=data.get("notes", ""),
        room_number=doctor.room_number,
        status="scheduled",
    )
    db.session.add(appt)
    db.session.flush()

    # Create a patient log for this check-in
    log = PatientLog(
        patient_id=patient_id,
        doctor_id=data["doctor_id"],
        action="check-in",
        details=f"Appointment scheduled with Dr. {User.query.get(doctor.user_id).name} on {data['appointment_date']}",
    )
    db.session.add(log)
    db.session.commit()

    _broadcast_log(log)

    return jsonify(appt.to_dict()), 201


@app.route("/api/appointments/<int:appt_id>", methods=["PUT"])
@jwt_required()
def update_appointment(appt_id):
    appt = Appointment.query.get_or_404(appt_id)
    data = request.get_json()
    uid = int(get_jwt_identity())
    actor = User.query.get(uid)

    for field in ("status", "notes", "room_number"):
        if field in data:
            setattr(appt, field, data[field])

    if "status" in data:
        log = PatientLog(
            patient_id=appt.patient_id,
            doctor_id=appt.doctor_id,
            action=data["status"],
            details=data.get("notes", f"Appointment status changed to {data['status']}"),
        )
        db.session.add(log)
        db.session.flush()
        _broadcast_log(log)

        if actor and actor.role == "doctor" and actor.doctor_profile and actor.doctor_profile.id == appt.doctor_id:
            dal = DoctorActivityLog(
                doctor_id=appt.doctor_id,
                action="appointment",
                details=f"Updated appointment #{appt.id} → {data['status']}",
            )
            db.session.add(dal)
            db.session.flush()
            _broadcast_doctor_log(dal)

    db.session.commit()
    return jsonify(appt.to_dict())


@app.route("/api/appointments/<int:appt_id>/send-confirmation", methods=["POST"])
@jwt_required()
def send_confirmation(appt_id):
    appt = Appointment.query.get_or_404(appt_id)
    try:
        deliver_appointment_confirmation(appt)
        return jsonify({"message": "Confirmation email sent!", "email_sent": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Email sending failed (demo mode): {str(e)}", "email_sent": False, "demo": True}), 200


@app.route("/api/appointments/send-confirmation-by-phone", methods=["POST"])
@jwt_required()
def send_confirmation_by_phone():
    uid = int(get_jwt_identity())
    actor = User.query.get(uid)
    if not actor or actor.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json() or {}
    phone = (data.get("phone") or "").strip()
    appt_id = data.get("appointment_id")

    if not phone:
        return jsonify({"error": "Phone number required"}), 400

    patient_row = None
    for p in Patient.query.all():
        pu = User.query.get(p.user_id)
        if pu and phones_match(pu.phone, phone):
            patient_row = p
            break

    if not patient_row:
        return jsonify({"error": "No patient found with this phone number"}), 404

    if appt_id:
        appt = Appointment.query.filter_by(id=int(appt_id), patient_id=patient_row.id).first()
    else:
        appt = (
            Appointment.query.filter_by(patient_id=patient_row.id, status="scheduled")
            .order_by(Appointment.appointment_date.asc())
            .first()
        )

    if not appt:
        return jsonify({"error": "No matching appointment found"}), 404

    try:
        deliver_appointment_confirmation(appt)
        return jsonify({"message": "Confirmation email sent to patient email on file!", "email_sent": True, "appointment_id": appt.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Email sending failed (demo mode): {str(e)}", "email_sent": False, "demo": True}), 200


# ========================== PATIENT LOG ROUTES ==============================

@app.route("/api/patient-logs", methods=["GET"])
@jwt_required()
def get_patient_logs():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = PatientLog.query

    if user.role == "doctor" and user.doctor_profile:
        q = q.filter_by(doctor_id=user.doctor_profile.id)
    elif user.role == "patient" and user.patient_profile:
        q = q.filter_by(patient_id=user.patient_profile.id)

    logs = [l.to_dict() for l in q.order_by(PatientLog.timestamp.desc()).limit(100).all()]
    return jsonify(logs)


@app.route("/api/patient-logs", methods=["POST"])
@jwt_required()
def create_patient_log():
    data = request.get_json()
    uid = int(get_jwt_identity())
    user = User.query.get(uid)

    doctor_id = None
    if user.role == "doctor" and user.doctor_profile:
        doctor_id = user.doctor_profile.id

    log = PatientLog(
        patient_id=data["patient_id"],
        doctor_id=doctor_id or data.get("doctor_id"),
        action=data["action"],
        details=data.get("details", ""),
    )
    db.session.add(log)
    db.session.commit()

    _broadcast_log(log)
    return jsonify(log.to_dict()), 201


# ========================== HEALTH SLIP ROUTES ==============================

@app.route("/api/health-slips", methods=["GET"])
@jwt_required()
def get_health_slips():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = HealthSlip.query

    if user.role == "patient" and user.patient_profile:
        q = q.filter_by(patient_id=user.patient_profile.id)
    elif user.role == "doctor" and user.doctor_profile:
        q = q.filter_by(doctor_id=user.doctor_profile.id)

    slips = [s.to_dict() for s in q.order_by(HealthSlip.issued_at.desc()).all()]
    return jsonify(slips)


@app.route("/api/health-slips", methods=["POST"])
@jwt_required()
def create_health_slip():
    data = request.get_json()
    uid = int(get_jwt_identity())
    user = User.query.get(uid)

    doctor_id = None
    if user.role == "doctor" and user.doctor_profile:
        doctor_id = user.doctor_profile.id
    else:
        doctor_id = data.get("doctor_id")

    doc = Doctor.query.get(doctor_id)

    slip = HealthSlip(
        patient_id=data["patient_id"],
        doctor_id=doctor_id,
        appointment_id=data.get("appointment_id"),
        diagnosis=data.get("diagnosis", ""),
        prescription=data.get("prescription", ""),
        recommendations=data.get("recommendations", ""),
        doctor_room=doc.room_number if doc else data.get("doctor_room", ""),
    )
    db.session.add(slip)
    db.session.flush()

    # Also create a log entry
    log = PatientLog(
        patient_id=data["patient_id"],
        doctor_id=doctor_id,
        action="prescription",
        details=f"Health slip #{slip.id} issued — Diagnosis: {data.get('diagnosis', 'N/A')}",
    )
    db.session.add(log)

    dal = None
    if doctor_id:
        dal = DoctorActivityLog(
            doctor_id=doctor_id,
            action="health_slip",
            details=f"Issued health slip #{slip.id} for patient #{data['patient_id']}",
        )
        db.session.add(dal)

    db.session.commit()
    _broadcast_log(log)
    if dal:
        _broadcast_doctor_log(dal)

    return jsonify(slip.to_dict()), 201


@app.route("/api/health-slips/<int:slip_id>", methods=["GET"])
@jwt_required()
def get_health_slip(slip_id):
    slip = HealthSlip.query.get_or_404(slip_id)
    return jsonify(slip.to_dict())


# ========================== AI CHATBOT ROUTE ================================


@app.route("/api/chat/history", methods=["GET"])
@jwt_required()
def chat_history():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role != "patient":
        return jsonify({"error": "Patient portal only"}), 403
    msgs = (
        ChatMessage.query.filter_by(user_id=uid)
        .order_by(ChatMessage.created_at.asc())
        .limit(200)
        .all()
    )
    return jsonify([{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs])


@app.route("/api/admin/chat-messages", methods=["GET"])
@jwt_required()
def admin_chat_messages():
    uid = int(get_jwt_identity())
    actor = User.query.get(uid)
    if not actor or actor.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    msgs = ChatMessage.query.order_by(ChatMessage.created_at.desc()).limit(300).all()
    return jsonify([m.to_dict() for m in msgs])


@app.route("/api/doctor-logs", methods=["GET"])
@jwt_required()
def get_doctor_logs():
    uid = int(get_jwt_identity())
    actor = User.query.get(uid)
    if not actor or actor.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    rows = DoctorActivityLog.query.order_by(DoctorActivityLog.timestamp.desc()).limit(100).all()
    return jsonify([l.to_dict() for l in rows])


@app.route("/api/chat", methods=["POST"])
@jwt_required()
def ai_chat():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role != "patient":
        return jsonify({"error": "Patient portal only"}), 403

    data = request.get_json() or {}
    user_message = (data.get("message") or "").strip()
    if not user_message:
        return jsonify({"error": "Message required"}), 400

    db.session.add(ChatMessage(user_id=uid, role="user", content=user_message))
    db.session.flush()

    reply_text, source = generate_ai_reply(user_message)

    db.session.add(ChatMessage(user_id=uid, role="assistant", content=reply_text))
    db.session.commit()

    return jsonify({"reply": reply_text, "source": source})


# ========================== HOSPITAL MAP DATA ===============================

@app.route("/api/hospital/map", methods=["GET"])
@jwt_required()
def get_hospital_map():
    """Return hospital floor plan data for the interactive SVG map."""
    doctors = Doctor.query.all()
    doctor_rooms = {}
    for d in doctors:
        u = User.query.get(d.user_id)
        doctor_rooms[d.room_number] = {
            "doctor_name": u.name if u else "Unknown",
            "specialization": d.specialization,
            "category": d.category,
            "is_available": d.is_available,
        }

    floors = {
        "ground": {
            "name": "Ground Floor",
            "rooms": {
                "R-001": {"name": "Main Reception", "type": "reception", "x": 50, "y": 200, "w": 180, "h": 80},
                "R-002": {"name": "Emergency Room", "type": "emergency", "x": 280, "y": 200, "w": 160, "h": 80},
                "R-003": {"name": "Pharmacy", "type": "pharmacy", "x": 490, "y": 200, "w": 140, "h": 80},
                "R-004": {"name": "Billing Counter", "type": "billing", "x": 50, "y": 330, "w": 140, "h": 70},
                "R-005": {"name": "Waiting Lounge", "type": "waiting", "x": 240, "y": 330, "w": 200, "h": 70},
                "R-006": {"name": "Cafeteria", "type": "cafeteria", "x": 490, "y": 330, "w": 140, "h": 70},
            },
        },
        "first": {
            "name": "First Floor — Outpatient",
            "rooms": {
                "101": {"name": "Room 101", "type": "doctor", "x": 50, "y": 200, "w": 120, "h": 70},
                "102": {"name": "Room 102", "type": "doctor", "x": 200, "y": 200, "w": 120, "h": 70},
                "103": {"name": "Room 103", "type": "doctor", "x": 350, "y": 200, "w": 120, "h": 70},
                "104": {"name": "Room 104", "type": "doctor", "x": 500, "y": 200, "w": 120, "h": 70},
                "L-101": {"name": "Blood Lab", "type": "lab", "x": 50, "y": 320, "w": 140, "h": 70},
                "L-102": {"name": "X-Ray / Imaging", "type": "lab", "x": 230, "y": 320, "w": 160, "h": 70},
                "L-103": {"name": "ECG Room", "type": "lab", "x": 430, "y": 320, "w": 140, "h": 70},
            },
        },
        "second": {
            "name": "Second Floor — Specialist",
            "rooms": {
                "201": {"name": "Room 201", "type": "doctor", "x": 50, "y": 200, "w": 120, "h": 70},
                "202": {"name": "Room 202", "type": "doctor", "x": 200, "y": 200, "w": 120, "h": 70},
                "203": {"name": "Room 203", "type": "doctor", "x": 350, "y": 200, "w": 120, "h": 70},
                "204": {"name": "Room 204", "type": "doctor", "x": 500, "y": 200, "w": 120, "h": 70},
                "W-201": {"name": "Ward A (General)", "type": "ward", "x": 50, "y": 320, "w": 180, "h": 70},
                "W-202": {"name": "Ward B (ICU)", "type": "ward", "x": 270, "y": 320, "w": 160, "h": 70},
                "OT-1": {"name": "Operation Theater", "type": "surgery", "x": 470, "y": 320, "w": 160, "h": 70},
            },
        },
    }

    return jsonify({"floors": floors, "doctor_rooms": doctor_rooms})


# ========================== DASHBOARD STATS =================================

@app.route("/api/stats", methods=["GET"])
@jwt_required()
def get_stats():
    total_patients = Patient.query.count()
    total_doctors = Doctor.query.count()
    total_appointments = Appointment.query.count()
    active_appointments = Appointment.query.filter_by(status="scheduled").count()
    completed = Appointment.query.filter_by(status="completed").count()
    total_slips = HealthSlip.query.count()

    return jsonify({
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "active_appointments": active_appointments,
        "completed_appointments": completed,
        "total_slips": total_slips,
    })


# ========================== SOCKETIO EVENTS =================================

@socketio.on("connect", namespace="/admin")
def handle_admin_connect():
    print("Admin connected to live feed")
    emit("connected", {"message": "Connected to live patient log feed"})


@socketio.on("disconnect", namespace="/admin")
def handle_admin_disconnect():
    print("Admin disconnected from live feed")


# ========================== MAIN ============================================

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
