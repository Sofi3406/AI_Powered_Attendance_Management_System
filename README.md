# AI-Powered Visual Attendance System

A hybrid AI web application for automated attendance tracking. It combines a
React dashboard, a Node/Express API, MongoDB, and a Python FastAPI computer
vision service using `face_recognition`/`dlib`.

The system can register people from webcam photos, recognize them in a live
camera feed, record attendance, and display attendance reports.

```
Browser (React)  --photos/frames-->  Node/Express API  --frame+encodings-->  Python FastAPI (dlib)
                                            |
                                            v
                                        MongoDB
```

This is a full-stack web application with an AI recognition service. It does not
run inside Jupyter Notebook. MongoDB, the recognition service, the backend, and
the frontend run as separate processes.

## Technology stack

- **Frontend:** React, Vite, React Router, CSS
- **Backend:** Node.js, Express, Multer, Mongoose
- **Database:** MongoDB
- **AI service:** Python, FastAPI, `face_recognition`, `dlib`

## Features

- Register a person with a roll number, name, and webcam photos
- Validate photos and create face encodings with the AI service
- Recognize faces from a live webcam session
- Mark people as Present or Absent
- View attendance records and summaries by date
- Store face encodings and attendance records in MongoDB

## 1. Recognition service (Python / FastAPI)

This service requires Python dependencies such as `face_recognition` and
`dlib`. The project can use a local virtual environment named `.venv`.

```bash
cd recognition-service
python -m venv .venv
source .venv/Scripts/activate       # Git Bash on Windows
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Verify it's up: open http://localhost:8001/health — should return `{"status":"ok"}`.

## 2. Backend (Node.js / Express / MongoDB)

Requires Node.js and a running MongoDB instance (local `mongod`, or a free
MongoDB Atlas cluster — either works, just update `MONGO_URI`).

```bash
cd backend
cp .env.example .env      # Git Bash; copy .env.example .env in PowerShell
# edit MONGO_URI / RECOGNITION_SERVICE_URL if needed
npm install
npm run dev                # nodemon, restarts on file changes
```

Verify it's up: http://localhost:5000/health should return `{"status":"ok"}`.

### API summary

| Method | Route                          | Purpose                                    |
|--------|---------------------------------|---------------------------------------------|
| POST   | `/api/employees`                | Register a person (`rollNo`, `name`, `photos[]`) |
| GET    | `/api/employees`                | List registered people                     |
| DELETE | `/api/employees/:rollNo`        | Remove a person                            |
| POST   | `/api/attendance/recognize`     | Send one camera frame (`frame`), get matches + newly marked Present |
| POST   | `/api/attendance/mark-absentees`| Mark everyone not seen today as Absent     |
| GET    | `/api/attendance?date=YYYY-MM-DD`| List attendance records (optionally filtered) |
| GET    | `/api/attendance/summary`       | Present/Absent counts per person           |

## 3. Frontend (React / Vite)

```bash
cd frontend
cp .env.example .env       # Git Bash; copy .env.example .env in PowerShell
# edit VITE_API_BASE if your backend is not on port 5000
npm install
npm run dev                 # opens on http://localhost:3000
```

The dashboard contains three pages:
- **Live Attendance** — starts your webcam, sends a frame to the backend every
  2 seconds, shows who's been marked present, and lets you end the session
  (which marks everyone else absent for the day).
- **Register** — capture 5+ photos of a new person and submit their Roll No/Name.
- **Reports** — attendance table (filterable by date) and a per-person
  Present/Absent summary.

## Run order

Start these in three separate terminals, in this order:

1. MongoDB (if running locally: `mongod`)
2. Recognition service (`uvicorn main:app --port 8001`)
3. Backend (`npm run dev` in `backend/`)
4. Frontend (`npm run dev` in `frontend/`)

Then open http://localhost:3000.

## Service health checks

Use these URLs to confirm that the services are running:

- Recognition service: http://localhost:8001/health
- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000

If registration reports `ECONNREFUSED` for port `8001`, start the recognition
service before submitting photos. The backend and recognition service must both
be running for registration and live recognition to work.

## Notes / things to double check before treating this as production-ready

- **CORS** is wide open (`*`) on the recognition service for convenience during
  development — restrict `allow_origins` to your backend's URL before deploying.
- **No authentication** on the dashboard yet — anyone who can reach the backend
  can register people or view attendance. Add auth (e.g. JWT + a login page)
  before exposing this beyond your own machine.
- **Face encodings live in MongoDB** as plain arrays. That's fine for a
  class project; for anything more sensitive, consider encrypting them at rest.
- **Duplicate people**: registering the same person under two different Roll
  Numbers will confuse recognition, exactly like in the notebook version —
  reuse the same Roll No to update someone's photos instead of creating a
  second entry.
- The Python service is intentionally **stateless** — it never stores anything
  itself. MongoDB (via the Node backend) is the single source of truth, which
  makes it easy to later swap in a different recognition engine without
  touching your data.
