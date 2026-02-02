# Job Forge - Brand New Windows Setup Guide

This guide describes how to set up the Job Forge project on a brand new Windows laptop that has no development tools installed.

## Phase 1: System Preparation (The "One-Time" Stuff)

Before you can run the code, you need to install the fundamental tools. We recommend using **Winget** (Windows Package Manager), which comes built-in with Windows 10/11, or downloading installers manually.

### 1. Install Git, Node.js, and Python
Open **PowerShell** as Administrator (Search "PowerShell", right-click > Run as Administrator) and run:

```powershell
winget install -e --id Git.Git
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.11
```
*   **Important**: During Python installation (if manual), make sure to check **"Add Python to PATH"**.
*   **Note**: Close and reopen PowerShell after installation to refresh your path.

### 2. Install PostgreSQL
We recommend downloading the installer for the best experience.
1.  Download PostgreSQL 14+ from [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
2.  Run the installer:
    *   **Password**: Remember the password you set for the `postgres` user (e.g., `admin` or `root`).
    *   **Port**: Keep default `5432`.
    *   **Components**: Keep all checked (specifically Command Line Tools).

### 3. Verify Installations
Open a **new** PowerShell window and check versions:
```powershell
git --version
node --version
python --version
psql --version
```

---

## Phase 2: Project Setup

### 1. Clone the Repository
Navigate to where you want the project (e.g., `C:\Projects`) and clone it.
```powershell
mkdir C:\Projects
cd C:\Projects
git clone <YOUR_REPO_URL_HERE> job-forge
cd job-forge
```

---

## Phase 3: Database Configuration

You need to create the specific database the app uses.

1.  Open the **SQL Shell (psql)** app from your Start Menu.
    *   Server, Database, Port, Username: Default is usually fine (press Enter).
    *   **Password**: Enter the password you set during installation.
2.  Run this SQL command:
```sql
CREATE DATABASE job_forge;
```
3.  Type `\q` to exit.

---

## Phase 4: Backend Setup

The backend handles the data and AI logic.

### 1. Navigate to Backend
```powershell
cd backend
```

### 2. Create a Virtual Environment
This keeps project libraries separate from your system.
```powershell
python -m venv venv
.\venv\Scripts\Activate
```
*(You should see `(venv)` appear at the start of your command prompt line)*
*   *Note*: If you verify a permission error, run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 3. Install Dependencies
Run these commands exactly:
```powershell
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
```powershell
python manage.py migrate
```

### 5. Create Admin User
You'll use this to log into the admin panel.
```powershell
python manage.py createsuperuser
```
*(Enter a username, email, and password when prompted)*

### 6. Start Backend Server
```powershell
python manage.py runserver 8001
```
*Leave this terminal window OPEN. It is running the backend.*

---

## Phase 5: Frontend Setup

Open a **NEW PowerShell window** for the frontend.

### 1. Navigate to Project Root
```powershell
cd C:\Projects\job-forge
```

### 2. Install Components
```powershell
npm install
```

### 3. Start Frontend Server
```powershell
npm run dev
```

---

## Phase 6: Verify It Works!

1.  **Frontend (User Interface)**: Open http://localhost:3000
    *   You should see the Job Forge landing page.
2.  **Backend (Admin Panel)**: Open http://localhost:8001/admin/
    *   Log in with the superuser credentials you created in Phase 4.

## Troubleshooting

*   **'python' is not recognized**: Ensure you checked "Add Python to PATH" during installation. You might need to reinstall or add it manually to Environment Variables.
*   **Command not found**: Remember to close and reopen terminals after installing new tools.
*   **Script execution disabled**: If `Activate` fails, run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell.
*   **Database connection failed**: Check `backend/job_forge_backend/settings.py` (or `.env` file) if you used a different password than default. You might need to update the `DATABASES` setting.
