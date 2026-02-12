# testing-site-totolist

/backend/app uv run -m uvicorn main:app
/backend/app uv run -m uvicorn main:app  --reload


http://localhost:8000/docs


Створіть файл ../backend/app/.env

з такими строками

DEBUG=true

PGHOST=Тут свої данні
PGDATABASE=Тут свої данні
PGUSER=Тут свої данні
PGPASSWORD=Тут свої данні


Використовуем цю базу https://neon.com/