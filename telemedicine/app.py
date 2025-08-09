from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import pdfkit
import os
from datetime import datetime
import smtplib
import secrets
from email.mime.text import MIMEText
from dotenv import load_dotenv
import re
from urllib.parse import urlencode
import pdfkit
from flask import url_for, render_template, make_response

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

load_dotenv()
GMAIL_USER = os.getenv('GMAIL_USER')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD')

wkhtmltopdf_path = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
if not os.path.exists(wkhtmltopdf_path):
    raise FileNotFoundError(
        f"wkhtmltopdf not found at {wkhtmltopdf_path}. "
        "Please install wkhtmltopdf from https://wkhtmltopdf.org/downloads.html "
        "and ensure it is installed to C:\Program Files\wkhtmltopdf."
    )
pdfkit_config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, nullable=False)
    doctor_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    video_link = db.Column(db.String(200), default='https://192.168.110.177:8181')

class Prescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, nullable=False)
    doctor_id = db.Column(db.Integer, nullable=False)
    medication = db.Column(db.Text, nullable=False)
    dosage = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    file_path = db.Column(db.String(200))

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def send_otp_email(email, otp):
    msg = MIMEText(f'Your OTP for MediCare verification is: {otp}')
    msg['Subject'] = 'MediCare OTP Verification'
    msg['From'] = GMAIL_USER
    msg['To'] = email
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.send_message(msg)
            print(f"OTP {otp} sent successfully to {email}")
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            if user.role == 'patient' and not user.is_verified:
                flash('Please verify your email with OTP.')
                return redirect(url_for('verify', user_id=user.id))
            login_user(user)
            if user.role == 'patient':
                return redirect(url_for('patient_dashboard'))
            else:
                return redirect(url_for('doctor_dashboard'))
        flash('Invalid credentials.')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        if role != 'patient':
            flash('Doctor registration is disabled.')
            return redirect(url_for('register'))
        if User.query.filter_by(username=username).first():
            flash('Username already exists.')
            return redirect(url_for('register'))
        password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])[A-Za-z\d@#$%^&*]{8,}$'
        if not re.match(password_pattern, password):
            flash('Password must be at least 8 characters, with uppercase, lowercase, digit, and special character.')
            return redirect(url_for('register'))
        user = User(
            username=username,
            password=generate_password_hash(password),
            role=role,
            is_verified=False
        )
        db.session.add(user)
        db.session.commit()
        otp = secrets.token_hex(3).upper()[:6]
        otp_entry = OTP(user_id=user.id, otp=otp)
        db.session.add(otp_entry)
        db.session.commit()
        email = username if '@' in username else f"{username}@example.com"
        if send_otp_email(email, otp):
            flash('OTP sent to your email.')
            return redirect(url_for('verify', user_id=user.id))
        else:
            flash('Failed to send OTP. Please try again.')
            db.session.delete(user)
            db.session.delete(otp_entry)
            db.session.commit()
            return redirect(url_for('register'))
    return render_template('register.html')

@app.route('/verify/<int:user_id>', methods=['GET', 'POST'])
def verify(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != 'patient':
        flash('Verification is for patients only.')
        return redirect(url_for('login'))
    if request.method == 'POST':
        otp = request.form['otp']
        otp_entry = OTP.query.filter_by(user_id=user_id, otp=otp).first()
        if otp_entry and (datetime.utcnow() - otp_entry.created_at).seconds < 300:
            user.is_verified = True
            db.session.delete(otp_entry)
            db.session.commit()
            flash('Email verified successfully!')
            login_user(user)
            return redirect(url_for('patient_dashboard'))
        flash('Invalid or expired OTP.')
    return render_template('verify.html', user_id=user_id)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/patient_dashboard')
@login_required
def patient_dashboard():
    if current_user.role != 'patient':
        flash('Access denied.')
        return redirect(url_for('home'))
    appointments = Appointment.query.filter_by(patient_id=current_user.id).all()
    prescriptions = Prescription.query.filter_by(patient_id=current_user.id).all()
    doctors = User.query.filter_by(role='doctor').all()
    return render_template('patient_dashboard.html', appointments=appointments, prescriptions=prescriptions, doctors=doctors)

@app.route('/doctor_dashboard')
@login_required
def doctor_dashboard():
    if current_user.role != 'doctor':
        flash('Access denied.')
        return redirect(url_for('home'))
    appointments = Appointment.query.filter_by(doctor_id=current_user.id).all()
    patients = User.query.filter_by(role='patient').all()
    return render_template('doctor_dashboard.html', appointments=appointments, patients=patients)

@app.route('/book_appointment', methods=['GET', 'POST'])
@login_required
def book_appointment():
    if current_user.role != 'patient':
        flash('Access denied.')
        return redirect(url_for('home'))
    doctors = User.query.filter_by(role='doctor').all()
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        doctor_id = request.form['doctor_id']
        date = request.form['date']
        try:
            appointment_date = datetime.strptime(date, '%Y-%m-%dT%H:%M')
            appointment = Appointment(
                patient_id=patient_id,
                doctor_id=doctor_id,
                date=appointment_date
            )
            db.session.add(appointment)
            db.session.commit()
            flash('Appointment booked successfully!')
            return redirect(url_for('patient_dashboard'))
        except ValueError:
            flash('Invalid date format.')
    return render_template('book_appointment.html', doctors=doctors)

@app.route('/write_prescription/<int:appointment_id>', methods=['GET', 'POST'])
@login_required
def write_prescription(appointment_id):
    if current_user.role != 'doctor':
        flash('Access denied.')
        return redirect(url_for('home'))
    appointment = Appointment.query.get_or_404(appointment_id)
    if request.method == 'POST':
        medication = request.form['medication']
        dosage = request.form['dosage']
        prescription = Prescription(
            patient_id=appointment.patient_id,
            doctor_id=current_user.id,
            medication=medication,
            dosage=dosage
        )
        db.session.add(prescription)
        db.session.commit()
        patient_username = User.query.get(appointment.patient_id).username
        doctor_username = current_user.username
        html = render_template('prescription_pdf.html', 
                             prescription=prescription,
                             patient_username=patient_username,
                             doctor_username=doctor_username)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f'prescription_{prescription.id}.pdf')
        try:
            pdfkit.from_string(html, pdf_path, configuration=pdfkit_config)
            prescription.file_path = pdf_path
            db.session.commit()
            flash('Prescription created successfully!')
            return redirect(url_for('doctor_dashboard'))
        except Exception as e:
            db.session.delete(prescription)
            db.session.commit()
            flash(f'Error generating PDF: {str(e)}')
    return render_template('prescription_form.html', appointment_id=appointment_id)

@app.route('/view_prescription/<int:prescription_id>')
@login_required
def view_prescription(prescription_id):
    prescription = Prescription.query.get_or_404(prescription_id)
    if current_user.id not in (prescription.patient_id, prescription.doctor_id):
        flash('Access denied.')
        return redirect(url_for('home'))
    if prescription.file_path and os.path.exists(prescription.file_path):
        return send_file(prescription.file_path, as_attachment=True)
    flash('Prescription file not found.')
    return redirect(url_for('patient_dashboard'))

@app.route('/join_video/<int:appointment_id>')
@login_required
def join_video(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    if current_user.id not in (appointment.patient_id, appointment.doctor_id):
        flash('Access denied.')
        return redirect(url_for('home'))
    if appointment.status == 'Pending':
        appointment.status = 'In Progress'
        db.session.commit()
        flash('Video call started. Status updated to In Progress.')
    # Append GET query parameters
    params = {
        'appointment_id': appointment.id,
        'user_id': current_user.id,
        'role': current_user.role,
        'username': current_user.username
    }
    video_url = f"{appointment.video_link}?{urlencode(params)}"
    return redirect(video_url)

@app.route('/complete_appointment/<int:appointment_id>')
@login_required
def complete_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    if current_user.id not in (appointment.patient_id, appointment.doctor_id):
        flash('Access denied.')
        return redirect(url_for('home'))
    if appointment.status == 'In Progress':
        appointment.status = 'Completed'
        db.session.commit()
        flash('Appointment marked as Completed.')
    return redirect(url_for('patient_dashboard' if current_user.role == 'patient' else 'doctor_dashboard'))

if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("Database schema initialized successfully.")
        except Exception as e:
            print(f"Error initializing database: {e}")
            raise
    app.run(debug=True)
    