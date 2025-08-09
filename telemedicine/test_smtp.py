import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()
GMAIL_USER = os.getenv('GMAIL_USER')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD')

def test_smtp():
    msg = MIMEText('Test email from MediCare.')
    msg['Subject'] = 'Test SMTP'
    msg['From'] = GMAIL_USER
    msg['To'] = GMAIL_USER
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.send_message(msg)
            print("Test email sent successfully!")
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

if __name__ == '__main__':
    test_smtp()