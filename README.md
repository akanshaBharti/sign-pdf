# Sign PDF

Full-stack PDF signing app with a React + Tailwind frontend and Django backend.

## Run Backend

```bash
cd Backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/python manage.py runserver 8000
```

Set real values in `Backend/.env` for local development or deployment. At minimum, production should use:

```bash
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
```

Never commit `Backend/.env`; use `Backend/.env.example` as the public template.

## Run Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and sends signing requests to `http://localhost:8000/api/sign-pdf/`.

<img width="1468" height="831" alt="image" src="https://github.com/user-attachments/assets/33633dbe-92e3-4a8d-9c2a-740ad54009c7" />

<img width="1470" height="830" alt="image" src="https://github.com/user-attachments/assets/25b966a9-fd6f-4983-833f-6a51e7a58495" />


