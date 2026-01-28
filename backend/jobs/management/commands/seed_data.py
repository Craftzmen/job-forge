import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import Job, Application
from resumes.models import Resume

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with sample jobs and users data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # 1. Create Users
        admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'username': 'admin',
                'name': 'Admin User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write('Created admin user: admin / admin123')
        else:
            self.stdout.write('Admin user already exists')

        test_users = []
        for i in range(1, 6):
            email = f'user{i}@example.com'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'name': f'Test User {i}',
                    'role': 'user'
                }
            )
            if created:
                user.set_password('user123')
                user.save()
                self.stdout.write(f'Created user: {email} / user123')
            test_users.append(user)

        # 2. Create Resumes
        resume_templates = [
            {
                'title': 'Software Engineer',
                'summary': 'Experienced Software Engineer with a focus on web technologies and distributed systems.',
                'skills': ['Python', 'Django', 'React', 'JavaScript', 'PostgreSQL', 'Docker'],
                'experience': [
                    {
                        'title': 'Senior Developer',
                        'company': 'Tech Innovations',
                        'startDate': '2021-01-01',
                        'endDate': 'Present',
                        'description': 'Led the development of a flagship SaaS product using Django and React.'
                    }
                ]
            },
            {
                'title': 'Frontend Developer',
                'summary': 'Passionate Frontend Developer specializing in React and modern UI/UX design.',
                'skills': ['JavaScript', 'React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Figma'],
                'experience': [
                    {
                        'title': 'Frontend Lead',
                        'company': 'Creative Web Agency',
                        'startDate': '2019-05-01',
                        'endDate': '2020-12-31',
                        'description': 'Designed and implemented responsive web interfaces for multiple clients.'
                    }
                ]
            },
            {
                'title': 'Backend Developer',
                'summary': 'Backend specialist with extensive experience in Python, API design, and cloud infrastructure.',
                'skills': ['Python', 'FastAPI', 'AWS', 'Redis', 'Kubernetes', 'SQL'],
                'experience': [
                    {
                        'title': 'Systems architect',
                        'company': 'Cloud Scale Solutions',
                        'startDate': '2020-03-01',
                        'endDate': 'Present',
                        'description': 'Developed scalable microservices handling millions of requests daily.'
                    }
                ]
            },
            {
                'title': 'DevOps Engineer',
                'summary': 'DevOps Engineer focused on automation, CI/CD pipelines, and infrastructure as code.',
                'skills': ['Terraform', 'CI/CD', 'GitLab', 'Jenkins', 'Go', 'Bash'],
                'experience': [
                    {
                        'title': 'DevOps Lead',
                        'company': 'AutoOps Inc',
                        'startDate': '2018-02-01',
                        'endDate': 'Present',
                        'description': 'Reduced deployment time by 50% using automated canary deployments.'
                    }
                ]
            },
            {
                'title': 'Data Scientist',
                'summary': 'Data Scientist with a strong background in machine learning and statistical analysis.',
                'skills': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NLP'],
                'experience': [
                    {
                        'title': 'ML Researcher',
                        'company': 'AITech Lab',
                        'startDate': '2022-06-01',
                        'endDate': 'Present',
                        'description': 'Developed and deployed NLP models for sentiment analysis on large datasets.'
                    }
                ]
            }
        ]

        for i, user in enumerate(test_users):
            template = resume_templates[i % len(resume_templates)]
            resume, created = Resume.objects.get_or_create(
                user=user,
                title=template['title'],
                defaults={
                    'name': user.name,
                    'email': user.email,
                    'phone': f'555-{random.randint(100, 999)}-{random.randint(1000, 9999)}',
                    'location': random.choice(['San Francisco, CA', 'New York, NY', 'Remote', 'London, UK']),
                    'summary': template['summary'],
                    'skills': template['skills'],
                    'experience': template['experience'],
                    'education': [{'degree': 'B.S. Computer Science', 'institution': 'State University', 'year': '2018', 'field': 'Computer Science'}],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Created resume for {user.email}')

        # 3. Create Jobs
        job_data = [
            {
                'title': 'Senior Python Developer',
                'company': 'Google',
                'location': 'Mountain View, CA',
                'description': 'We are looking for a Senior Python Developer to join our team working on search infrastructure. You will be responsible for designing and implementing high-performance services.',
                'requirements': ['5+ years of Python experience', 'Expert knowledge of Django', 'Experience with large-scale distributed systems'],
                'skills': ['Python', 'Django', 'Distributed Systems', 'C++'],
                'experience_level': 'senior'
            },
            {
                'title': 'Frontend Engineer (React)',
                'company': 'Microsoft',
                'location': 'Redmond, WA',
                'description': 'Join the Microsoft Teams frontend team to build modern collaboration tools. We need someone who is passionate about building accessible and performant web applications.',
                'requirements': ['3+ years of experience with React', 'Strong TypeScript skills', 'Experience with state management libraries'],
                'skills': ['React', 'TypeScript', 'Redux', 'Accessibility'],
                'experience_level': 'mid'
            },
            {
                'title': 'Junior Web Developer',
                'company': 'Seedbox StartUp',
                'location': 'Remote',
                'description': 'Exciting opportunity for a fresh graduate or someone with limited experience to join a fast-paced startup. You will work closely with senior developers to build new features.',
                'requirements': ['Basic understanding of web technologies (HTML/CSS/JS)', 'Willingness to learn and grow', 'Good communication skills'],
                'skills': ['HTML', 'CSS', 'JavaScript', 'Git'],
                'experience_level': 'entry'
            },
            {
                'title': 'Full Stack Developer',
                'company': 'Amazon',
                'location': 'Seattle, WA',
                'description': 'Looking for a generalist who can work across the entire stack. You will be responsible for building end-to-end features for our retail platform.',
                'requirements': ['Experience with both frontend and backend development', 'Knowledge of AWS services', 'Ability to work in a fast-paced environment'],
                'skills': ['Node.js', 'React', 'AWS', 'DynamoDB'],
                'experience_level': 'mid'
            },
            {
                'title': 'Cloud Architect',
                'company': 'Netflix',
                'location': 'Los Gatos, CA',
                'description': 'Help us design and maintain our global infrastructure that delivers content to millions of users worldwide.',
                'requirements': ['8+ years of infrastructure experience', 'Deep knowledge of AWS or GCP', 'Experience with container orchestration'],
                'skills': ['AWS', 'Kubernetes', 'Go', 'Infrastructure as Code'],
                'experience_level': 'senior'
            },
            {
                'title': 'Machine Learning Engineer',
                'company': 'OpenAI',
                'location': 'San Francisco, CA',
                'description': 'Work on the cutting edge of AI. You will be responsible for training and deploying large language models.',
                'requirements': ['Strong background in Deep Learning', 'Proficiency in PyTorch or TensorFlow', 'Published research is a plus'],
                'skills': ['Python', 'PyTorch', 'Transformers', 'Deep Learning'],
                'experience_level': 'senior'
            }
        ]

        for data in job_data:
            job, created = Job.objects.get_or_create(
                title=data['title'],
                company=data['company'],
                defaults={
                    'location': data['location'],
                    'description': data['description'],
                    'requirements': data['requirements'],
                    'skills': data['skills'],
                    'experience_level': data['experience_level'],
                    'posted_by': admin_user
                }
            )
            if created:
                self.stdout.write(f'Created job: {data["title"]} at {data["company"]}')

        # 4. Create Applications
        jobs = list(Job.objects.all())
        for user in test_users:
            # Each user applies to 1-2 random jobs
            num_apps = random.randint(1, 2)
            applied_jobs = random.sample(jobs, num_apps)
            
            resume = Resume.objects.filter(user=user, is_active=True).first()
            if not resume:
                continue

            for job in applied_jobs:
                Application.objects.get_or_create(
                    job=job,
                    user=user,
                    defaults={
                        'resume': resume,
                        'status': random.choice(['pending', 'reviewing', 'accepted']),
                        'cover_letter': f'I am very excited to apply for the {job.title} role at {job.company}. My background in {resume.title} aligns perfectly with your requirements.',
                        'match_score': round(random.uniform(65, 98), 2),
                        'match_breakdown': {
                            'skills': random.randint(70, 100),
                            'experience': random.randint(60, 95),
                            'education': random.randint(80, 100)
                        }
                    }
                )
                self.stdout.write(f'User {user.email} applied to {job.title}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))
