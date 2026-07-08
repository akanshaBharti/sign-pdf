# Sign PDF

Full-stack PDF signing app with a React + Tailwind frontend and Django backend.

## Run Backend

```bash
cd Backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py runserver 8000
```

## Run Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and sends signing requests to `http://localhost:8000/api/sign-pdf/`.
