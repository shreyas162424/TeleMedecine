# 🏥 Telemedicine Video Calling App

A full-stack **Telemedicine Platform** that allows patients and doctors to connect through **secure video calls**, manage appointments, and maintain medical records online.  
This project integrates **Flask (Python)** for backend services, **HTML/CSS/JavaScript** for frontend, and **WebRTC** for real-time video calling.

---

## 📌 Features

- 🔐 **User Authentication** – Separate login for doctors and patients.
- 📅 **Appointment Scheduling** – Patients can book appointments with available doctors.
- 📹 **Secure Video Calling** – Real-time video communication using WebRTC & Socket.IO.
- 📄 **Medical Records** – Store and view patient details and medical history.
- 📢 **Live Chat** – Text chat alongside video calls for sharing quick notes.
- 🛠 **Database Management** – MySQL database for storing all records.
- 🔄 **Admin Tools** – Scripts for adding doctors and resetting the database.

---

## 🖼 Screenshots



![Home Page](https://github.com/shreyas162424/TeleMedecine/blob/main/Telemedicine%20Consultation%20Webpage%20Design.png)


---

## 🛠 Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Bootstrap for responsive UI

**Backend:**
- Python 3.x
- Flask
- Flask-SocketIO

**Database:**
- MySQL

**Real-time Communication:**
- WebRTC
- Socket.IO

---

## 📂 Project Structure
```
Telemedicine-VideoCall/
│
├── app.py # Main Flask application
├── add_doctors.py # Script to add doctor data to DB
├── reset_database.py # Script to reset DB tables
├── requirements.txt # Python dependencies
├── database.db # SQLite/MySQL database file (if SQLite)
├── templates/ # HTML templates
├── static/ # CSS, JS, Images
├── videocall/ # WebRTC client-side scripts
└── README.md # Project documentatio
```

---

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/telemedicine-videocall.git
cd telemedicine-videocall
```
### 2️⃣ Create & Activate Virtual Environment
```
python -m venv venv
# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate
```
### 3️⃣ Install Dependencies
```
pip install -r requirements.txt
```
### 4️⃣ Setup Database
-Update app.py with your MySQL credentials or SQLite path.

-Run:

```
python reset_database.py
python add_doctors.py
```
### 5️⃣ Run the Application
```
python app.py
```
Access it at: http://localhost:5000


## 🎯 Usage
- Sign Up / Log In as a patient or doctor.

- Book or accept appointments.

- Start the video call when the appointment time arrives.

- Use live chat during the call for sharing notes.

### 📦 Dependencies
- Flask

- Flask-SocketIO

- eventlet

- MySQL Connector / SQLite3

- WebRTC compatible browser

Install all dependencies via:

```
pip install -r requirements.txt
```
## 🤝 Contributing
Pull requests are welcome!
If you want to contribute:

1.Fork the repo

2.Create a new branch

3.Make your changes

4.Submit a PR
