from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="patient")  # admin, doctor, patient
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor_profile = db.relationship("Doctor", backref="user", uselist=False, cascade="all, delete-orphan")
    patient_profile = db.relationship("Patient", backref="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Doctor(db.Model):
    __tablename__ = "doctors"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    room_number = db.Column(db.String(20), nullable=False)
    image_url = db.Column(db.String(255), default="")
    qualification = db.Column(db.String(200), default="")
    experience_years = db.Column(db.Integer, default=0)
    is_available = db.Column(db.Boolean, default=True)

    appointments = db.relationship("Appointment", backref="doctor", lazy=True)
    patient_logs = db.relationship("PatientLog", backref="doctor", lazy=True)
    health_slips = db.relationship("HealthSlip", backref="doctor", lazy=True)

    def to_dict(self):
        user = User.query.get(self.user_id)
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "phone": user.phone if user else "",
            "specialization": self.specialization,
            "category": self.category,
            "room_number": self.room_number,
            "image_url": self.image_url,
            "qualification": self.qualification,
            "experience_years": self.experience_years,
            "is_available": self.is_available,
        }


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=True)
    blood_group = db.Column(db.String(10), default="")
    emergency_contact = db.Column(db.String(20), default="")
    address = db.Column(db.Text, default="")
    medical_history = db.Column(db.Text, default="")
    admitted_at = db.Column(db.DateTime, nullable=True)

    assigned_doctor = db.relationship("Doctor", foreign_keys=[assigned_doctor_id])

    appointments = db.relationship("Appointment", backref="patient", lazy=True)
    patient_logs = db.relationship("PatientLog", backref="patient", lazy=True)
    health_slips = db.relationship("HealthSlip", backref="patient", lazy=True)

    def to_dict(self):
        user = User.query.get(self.user_id)
        ad = self.assigned_doctor
        ad_user = User.query.get(ad.user_id) if ad else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "phone": user.phone if user else "",
            "assigned_doctor_id": self.assigned_doctor_id,
            "assigned_doctor_name": ad_user.name if ad_user else None,
            "assigned_doctor_specialization": ad.specialization if ad else None,
            "assigned_doctor_room": ad.room_number if ad else None,
            "blood_group": self.blood_group,
            "emergency_contact": self.emergency_contact,
            "address": self.address,
            "medical_history": self.medical_history,
            "admitted_at": self.admitted_at.isoformat() if self.admitted_at else None,
            "created_at": user.created_at.isoformat() if user and user.created_at else None,
        }


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="scheduled")  # scheduled, completed, cancelled
    notes = db.Column(db.Text, default="")
    room_number = db.Column(db.String(20), default="")
    email_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    health_slip = db.relationship("HealthSlip", backref="appointment", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        doc = Doctor.query.get(self.doctor_id)
        pat = Patient.query.get(self.patient_id)
        doc_user = User.query.get(doc.user_id) if doc else None
        pat_user = User.query.get(pat.user_id) if pat else None
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": pat_user.name if pat_user else "Unknown",
            "patient_email": pat_user.email if pat_user else "",
            "patient_phone": pat_user.phone if pat_user else "",
            "doctor_id": self.doctor_id,
            "doctor_name": doc_user.name if doc_user else "Unknown",
            "doctor_specialization": doc.specialization if doc else "",
            "appointment_date": self.appointment_date.isoformat() if self.appointment_date else None,
            "status": self.status,
            "notes": self.notes,
            "room_number": self.room_number or (doc.room_number if doc else ""),
            "email_sent": self.email_sent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PatientLog(db.Model):
    __tablename__ = "patient_logs"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=True)
    action = db.Column(db.String(50), nullable=False)  # check-in, diagnosis, prescription, discharge
    details = db.Column(db.Text, default="")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        pat = Patient.query.get(self.patient_id)
        pat_user = User.query.get(pat.user_id) if pat else None
        doc = Doctor.query.get(self.doctor_id) if self.doctor_id else None
        doc_user = User.query.get(doc.user_id) if doc else None
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": pat_user.name if pat_user else "Unknown",
            "doctor_id": self.doctor_id,
            "doctor_name": doc_user.name if doc_user else "System",
            "action": self.action,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class DoctorActivityLog(db.Model):
    __tablename__ = "doctor_activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text, default="")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        doc = Doctor.query.get(self.doctor_id)
        doc_user = User.query.get(doc.user_id) if doc else None
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "doctor_name": doc_user.name if doc_user else "Unknown",
            "action": self.action,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        user = User.query.get(self.user_id)
        return {
            "id": self.id,
            "user_id": self.user_id,
            "patient_name": user.name if user else "Unknown",
            "patient_phone": user.phone if user else "",
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HealthSlip(db.Model):
    __tablename__ = "health_slips"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=True)
    diagnosis = db.Column(db.Text, default="")
    prescription = db.Column(db.Text, default="")
    recommendations = db.Column(db.Text, default="")
    doctor_room = db.Column(db.String(20), default="")
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        pat = Patient.query.get(self.patient_id)
        pat_user = User.query.get(pat.user_id) if pat else None
        doc = Doctor.query.get(self.doctor_id)
        doc_user = User.query.get(doc.user_id) if doc else None
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": pat_user.name if pat_user else "Unknown",
            "patient_phone": pat_user.phone if pat_user else "",
            "patient_blood_group": pat.blood_group if pat else "",
            "doctor_id": self.doctor_id,
            "doctor_name": doc_user.name if doc_user else "Unknown",
            "doctor_specialization": doc.specialization if doc else "",
            "doctor_room": self.doctor_room or (doc.room_number if doc else ""),
            "appointment_id": self.appointment_id,
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "recommendations": self.recommendations,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
        }
