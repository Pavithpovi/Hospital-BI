"""Seed the database with sample doctors, patients, appointments, and logs."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app import app, db
from models import User, Doctor, Patient, Appointment, PatientLog, HealthSlip


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # ── Admin ────────────────────────────────────────────────────
        admin = User(name="Admin Hospital BI", email="admin@medvista.com", phone="+91-9000000000", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)

        # ── Doctors ──────────────────────────────────────────────────
        clinic_images = {
            "Cardiology": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop",
            "Neurology": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop",
            "Orthopedics": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=400&fit=crop",
            "Pediatrics": "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=400&fit=crop",
            "Dermatology": "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=400&fit=crop",
            "General Medicine": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
            "ENT": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=400&fit=crop",
            "Ophthalmology": "https://images.unsplash.com/photo-1579684385277-dafd92904251?w=400&h=400&fit=crop",
        }

        doctors_data = [
            {"name": "Dr. Aisha Patel",    "email": "aisha@medvista.com",    "phone": "+91-9100000001", "spec": "Cardiology",       "cat": "Cardiology",       "room": "201", "qual": "MD, DM Cardiology", "exp": 15},
            {"name": "Dr. Rajesh Kumar",   "email": "rajesh@medvista.com",   "phone": "+91-9100000002", "spec": "Neurology",        "cat": "Neurology",        "room": "202", "qual": "MD, DM Neurology",  "exp": 12},
            {"name": "Dr. Priya Sharma",   "email": "priya@medvista.com",    "phone": "+91-9100000003", "spec": "Orthopedics",      "cat": "Orthopedics",      "room": "101", "qual": "MS Orthopedics",    "exp": 10},
            {"name": "Dr. David Chen",     "email": "david@medvista.com",    "phone": "+91-9100000004", "spec": "Pediatrics",       "cat": "Pediatrics",       "room": "102", "qual": "MD Pediatrics",     "exp": 8},
            {"name": "Dr. Fatima Ali",     "email": "fatima@medvista.com",   "phone": "+91-9100000005", "spec": "Dermatology",      "cat": "Dermatology",      "room": "103", "qual": "MD Dermatology",    "exp": 9},
            {"name": "Dr. Vikram Singh",   "email": "vikram@medvista.com",   "phone": "+91-9100000006", "spec": "General Medicine", "cat": "General Medicine",  "room": "104", "qual": "MD General",       "exp": 20},
            {"name": "Dr. Sarah Johnson",  "email": "sarah@medvista.com",    "phone": "+91-9100000007", "spec": "ENT",              "cat": "ENT",              "room": "203", "qual": "MS ENT",           "exp": 7},
            {"name": "Dr. Arjun Reddy",    "email": "arjun@medvista.com",    "phone": "+91-9100000008", "spec": "Ophthalmology",    "cat": "Ophthalmology",    "room": "204", "qual": "MS Ophthalmology", "exp": 11},
        ]

        doctor_objs = []
        for dd in doctors_data:
            u = User(name=dd["name"], email=dd["email"], phone=dd["phone"], role="doctor")
            u.set_password("doctor123")
            db.session.add(u)
            db.session.flush()
            d = Doctor(
                user_id=u.id,
                specialization=dd["spec"],
                category=dd["cat"],
                room_number=dd["room"],
                qualification=dd["qual"],
                experience_years=dd["exp"],
                image_url=clinic_images.get(dd["cat"], ""),
            )
            db.session.add(d)
            db.session.flush()
            doctor_objs.append(d)

        # ── Patients ─────────────────────────────────────────────────
        patients_data = [
            {"name": "Rahul Verma",     "email": "rahul.v@email.com",     "phone": "+91-9200000001", "blood": "A+",  "emergency": "+91-9200000010", "addr": "12 MG Road, Mumbai"},
            {"name": "Sneha Iyer",      "email": "sneha.i@email.com",     "phone": "+91-9200000002", "blood": "B+",  "emergency": "+91-9200000011", "addr": "45 Anna Nagar, Chennai"},
            {"name": "Mohammed Farhan", "email": "farhan.m@email.com",    "phone": "+91-9200000003", "blood": "O+",  "emergency": "+91-9200000012", "addr": "78 Jubilee Hills, Hyderabad"},
            {"name": "Ananya Das",      "email": "ananya.d@email.com",    "phone": "+91-9200000004", "blood": "AB+", "emergency": "+91-9200000013", "addr": "23 Salt Lake, Kolkata"},
            {"name": "Karthik Nair",    "email": "karthik.n@email.com",   "phone": "+91-9200000005", "blood": "A-",  "emergency": "+91-9200000014", "addr": "56 Koramangala, Bangalore"},
            {"name": "Pooja Gupta",     "email": "pooja.g@email.com",     "phone": "+91-9200000006", "blood": "B-",  "emergency": "+91-9200000015", "addr": "89 Gomti Nagar, Lucknow"},
        ]

        patient_objs = []
        for pd in patients_data:
            u = User(name=pd["name"], email=pd["email"], phone=pd["phone"], role="patient")
            u.set_password("patient123")
            db.session.add(u)
            db.session.flush()
            p = Patient(
                user_id=u.id,
                blood_group=pd["blood"],
                emergency_contact=pd["emergency"],
                address=pd["addr"],
                medical_history="No significant history",
            )
            db.session.add(p)
            db.session.flush()
            patient_objs.append(p)

        # ── Assign primary doctors (care team) ────────────────────────
        assignments = [
            (0, 0),
            (1, 1),
            (2, 2),
            (3, 3),
            (4, 5),
            (5, 4),
        ]
        for pi, di in assignments:
            patient_objs[pi].assigned_doctor_id = doctor_objs[di].id

        # ── Appointments ─────────────────────────────────────────────
        now = datetime.utcnow()
        appointments_data = [
            (0, 0, now + timedelta(days=1, hours=2),  "scheduled",  "Routine heart checkup"),
            (1, 1, now + timedelta(days=1, hours=4),  "scheduled",  "Migraine follow-up"),
            (2, 2, now + timedelta(days=2, hours=1),  "scheduled",  "Knee pain consultation"),
            (3, 3, now + timedelta(days=2, hours=3),  "scheduled",  "Child vaccination"),
            (4, 4, now - timedelta(days=2),           "completed",  "Skin rash treatment"),
            (5, 5, now - timedelta(days=1),           "completed",  "General health checkup"),
            (0, 5, now + timedelta(days=3, hours=5),  "scheduled",  "Follow-up on blood pressure"),
            (1, 0, now + timedelta(days=4, hours=2),  "scheduled",  "Cardiac stress test"),
        ]

        appt_objs = []
        for pi, di, dt, status, notes in appointments_data:
            a = Appointment(
                patient_id=patient_objs[pi].id,
                doctor_id=doctor_objs[di].id,
                appointment_date=dt,
                status=status,
                notes=notes,
                room_number=doctor_objs[di].room_number,
            )
            db.session.add(a)
            db.session.flush()
            appt_objs.append(a)

        # ── Patient Logs ─────────────────────────────────────────────
        log_entries = [
            (0, 0, "check-in",     "Patient checked in for heart checkup"),
            (1, 1, "check-in",     "Patient checked in for migraine consultation"),
            (4, 4, "check-in",     "Patient checked in for skin examination"),
            (4, 4, "diagnosis",    "Diagnosed with contact dermatitis"),
            (4, 4, "prescription", "Prescribed hydrocortisone cream and antihistamines"),
            (4, 4, "discharge",    "Patient discharged with follow-up in 2 weeks"),
            (5, 5, "check-in",     "Patient checked in for routine checkup"),
            (5, 5, "diagnosis",    "All vitals normal, mild vitamin D deficiency"),
            (5, 5, "prescription", "Prescribed vitamin D3 supplements"),
            (5, 5, "discharge",    "Patient discharged, schedule review in 3 months"),
        ]

        for pi, di, action, details in log_entries:
            log = PatientLog(
                patient_id=patient_objs[pi].id,
                doctor_id=doctor_objs[di].id,
                action=action,
                details=details,
                timestamp=now - timedelta(hours=len(log_entries)),
            )
            db.session.add(log)
            now_offset = now  # keep original

        # ── Health Slips for completed appointments ──────────────────
        slip1 = HealthSlip(
            patient_id=patient_objs[4].id,
            doctor_id=doctor_objs[4].id,
            appointment_id=appt_objs[4].id,
            diagnosis="Contact Dermatitis — mild to moderate",
            prescription="1. Hydrocortisone cream 1% — apply twice daily\n2. Cetirizine 10mg — once daily for 5 days\n3. Moisturizer — apply after bathing",
            recommendations="Avoid harsh soaps and detergents. Wear cotton clothing. Follow-up in 2 weeks if symptoms persist.",
            doctor_room=doctor_objs[4].room_number,
        )
        slip2 = HealthSlip(
            patient_id=patient_objs[5].id,
            doctor_id=doctor_objs[5].id,
            appointment_id=appt_objs[5].id,
            diagnosis="Vitamin D Deficiency (mild) — otherwise healthy",
            prescription="1. Vitamin D3 60000IU — once weekly for 8 weeks\n2. Calcium 500mg — once daily\n3. Continue balanced diet",
            recommendations="30 minutes of morning sunlight exposure daily. Increase intake of dairy, eggs, and fatty fish. Review after 3 months.",
            doctor_room=doctor_objs[5].room_number,
        )
        db.session.add_all([slip1, slip2])

        db.session.commit()
        print("[OK] Database seeded successfully!")
        print(f"   - {len(doctors_data)} Doctors")
        print(f"   - {len(patients_data)} Patients")
        print(f"   - {len(appointments_data)} Appointments")
        print(f"   - {len(log_entries)} Patient Logs")
        print(f"   - 2 Health Slips")
        print()
        print("Login Credentials:")
        print("  Admin:   admin@medvista.com / admin123")
        print("  Doctor:  aisha@medvista.com / doctor123")
        print("  Patient: rahul.v@email.com  / patient123")


if __name__ == "__main__":
    seed()
