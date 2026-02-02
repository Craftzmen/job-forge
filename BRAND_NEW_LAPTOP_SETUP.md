# Job Forge - Brand New Laptop Setup Guide

This guide describes how to set up the Job Forge project on a brand new Mac laptop that has no development tools installed.

## Phase 1: System Preparation (The "One-Time" Stuff)

Before you can run the code, you need to install the fundamental tools. We will use **Homebrew**, the standard package manager for Mac, to install everything else.

### 1. Install Homebrew
Open your **Terminal** app (Command + Space, type "Terminal") and paste this command:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
*Follow the on-screen instructions (you may need to enter your laptop password).*
*After it finishes, it might tell you to run some "echo" commands to add brew to your PATH. Run those if asked!*

### 2. Install Git, Node.js, Python, and PostgreSQL
Once Homebrew is installed, run this single command to install all core dependencies:
```bash
brew install git node python postgresql@14
```
*Note: We use PostgreSQL 14, but other versions (12+) are also fine.*

### 3. Start PostgreSQL Service
Start the database server so it runs in the background:
```bash
brew services start postgresql@14
```

---

## Phase 2: Project Setup

### 1. Clone the Repository
Navigate to where you want the project (e.g., a "Projects" folder) and clone it.
```bash
mkdir -p ~/Projects
cd ~/Projects
git clone <YOUR_REPO_URL_HERE> job-forge
cd job-forge
```

---

## Phase 3: Database Configuration

You need to create the specific database the app uses.
```bash
createdb job_forge
```
*If this command fails saying "role does not exist", you might need to create a postgres user first. Usually `createdb` works out of the box on Homebrew installs.*

---

## Phase 4: Backend Setup

The backend handles the data and AI logic.

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Create a Virtual Environment
This keeps project libraries separate from your system.
```bash
python3 -m venv venv
source venv/bin/activate
```
*(You should see `(venv)` appear at the start of your command prompt line)*

### 3. Install Dependencies
Run these commands exactly:
```bash
# Upgrade pip just in case
pip install --upgrade pip

# Install core Django requirements
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv

# Install AI requirements
pip install -r requirements-ai.txt

# Download English language model for AI
python -m spacy download en_core_web_sm
```

### 4. Initialize Database Schema
```bash
python manage.py migrate
```

### 5. Create Admin User
You'll use this to log into the admin panel.
```bash
python manage.py createsuperuser
```
*(Enter a username, email, and password when prompted)*

### 6. Start Backend Server
```bash
python manage.py runserver 8001
```
*Leave this terminal window OPEN. It is running the backend.*

---

## Phase 5: Frontend Setup

Open a **NEW Terminal window** (Command + T) for the frontend.

### 1. Navigate to Project Root
```bash
cd ~/Projects/job-forge
```

### 2. Install Components
```bash
npm install
```

### 3. Start Frontend Server
```bash
npm run dev
```

---

## Phase 6: Verify It Works!

1.  **Frontend (User Interface)**: Open http://localhost:3000
    *   You should see the Job Forge landing page.
2.  **Backend (Admin Panel)**: Open http://localhost:8001/admin/
    *   Log in with the superuser credentials you created in Phase 4.

## Troubleshooting

*   **Port already in use**: If you see an error about port 3000 or 8001 being in use, close other terminal windows or running processes.
*   **Database connection refused**: Ensure Postgres is running with `brew services list`. If it's stopped, run `brew services restart postgresql@14`.
*   **Python Command not found**: Try using `python3` instead of `python`.
