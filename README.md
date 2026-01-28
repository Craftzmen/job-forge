# Job Forge

A full-stack job application platform with AI-powered features for job matching, resume assistance, and cover letter generation.

## Quick Start

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Django 6.0, Django REST Framework, JWT Authentication
- **Database**: PostgreSQL
- **AI/ML**: Hugging Face Transformers, Sentence Transformers, spaCy

## Features

- 🔐 User authentication and authorization
- 💼 Job posting and application management
- 📄 Resume upload and parsing
- 🤖 AI-powered job-resume matching
- ✍️ Automated cover letter generation
- 👨‍💼 Admin dashboard for management
- 🎨 Modern, responsive UI

## Development

```bash
# Frontend
npm install
npm run dev

# Backend (in separate terminal)
cd backend
source venv/bin/activate
python manage.py runserver 8001
```

Visit `http://localhost:3000` for the frontend and `http://localhost:8001/admin/` for Django admin.
