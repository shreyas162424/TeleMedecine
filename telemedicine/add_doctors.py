from app import app, db, User
from werkzeug.security import generate_password_hash

def add_doctors():
    doctors = [
        {'username': 'dr_emma', 'password': 'Pass@1234', 'role': 'doctor'},
        {'username': 'dr_liam', 'password': 'Pass@1234', 'role': 'doctor'},
        {'username': 'dr_sofia', 'password': 'Pass@1234', 'role': 'doctor'},
        {'username': 'dr_noah', 'password': 'Pass@1234', 'role': 'doctor'},
    ]
    with app.app_context():
        for doctor in doctors:
            if not User.query.filter_by(username=doctor['username']).first():
                user = User(
                    username=doctor['username'],
                    password=generate_password_hash(doctor['password']),
                    role=doctor['role'],
                    is_verified=True
                )
                db.session.add(user)
        db.session.commit()
        print("Doctors added successfully!")

if __name__ == '__main__':
    add_doctors()