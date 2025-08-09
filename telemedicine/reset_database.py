from app import app, db
import os

def reset_database():
    db_file = 'database.db'
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Deleted {db_file}")
    with app.app_context():
        db.create_all()
        print("Database schema initialized successfully.")
    print("Database reset complete. Run 'python add_doctors.py' to repopulate doctors.")

if __name__ == '__main__':
    reset_database()