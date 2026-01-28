# Job Forge - Quick Setup

A job application platform with AI features for matching and resume help.

## Prerequisites
- Node.js (18+) - [nodejs.org](https://nodejs.org/)
- Python (3.8+) - [python.org](https://python.org/)
- PostgreSQL (12+) - [postgresql.org](https://postgresql.org/)

## Setup Steps

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd job-forge
npm install
```

### 2. Database Setup
Start PostgreSQL and create database:
```sql
CREATE DATABASE job_forge;
```

### 3. Backend Setup
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv
pip install -r requirements-ai.txt
python -m spacy download en_core_web_sm

# Setup
python manage.py migrate
python manage.py createsuperuser

# Add to .env file:
# HF_TOKEN=your_hugging_face_token_here
# Get token from: https://huggingface.co/settings/tokens

# Start backend
python manage.py runserver 8001
```

### 4. Frontend Setup (New Terminal)
```bash
cd ..  # Back to project root
npm run dev
```

### 5. Access App
- Frontend: http://localhost:3000
- Admin: http://localhost:8001/admin/

## Quick Commands
- Frontend: `npm run dev`
- Backend: `python manage.py runserver 8001`
- Create admin: `python manage.py createsuperuser`

## Issues?
- Check PostgreSQL is running
- Verify HF_TOKEN in .env
- Ensure ports 3000 & 8001 are free</content>
<parameter name="filePath">/Users/apple/Projects/job-forge/SETUP_GUIDE.md