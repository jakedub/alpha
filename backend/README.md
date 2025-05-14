# Django + React Monorepo

This project contains a monorepo setup with:

- `backend/` — Django & Django REST Framework
- `frontend/` — React (Vite or Create React App)

---

## 🔧 Setup

### Django (Backend)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # or manually install: django djangorestframework psycopg2-binary
```

### React (Frontend)
```bash
cd frontend
npm install
```

---

## 🚀 Running Locally

### Start Backend
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Start Frontend
```bash
cd frontend
npm run dev  # or npm start (if using CRA)
```

---

## 🧪 Common Django Commands

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
```

---

## 🔗 Helpful URLs

- [http://127.0.0.1:8000/](http://127.0.0.1:8000/) — root API response or 404
- [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) — Django admin
- [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/) — API root
- [http://localhost:5173](http://localhost:5173) — React frontend (Vite default)

---

## ⚙️ Local Configuration

Create `backend/.env`:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://youruser:yourpass@localhost:5432/alpha
```

---

## 🛑 Stopping

- Stop Django: `Ctrl+C`
- Stop React: `Ctrl+C`

---

## 🧼 VS Code Tips

Add this to `.vscode/settings.json`:
```json
{
  "python.analysis.extraPaths": ["./backend/app"],
  "python.envFile": "${workspaceFolder}/backend/.env",
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python"
}
```

---

## 🗃 Notes

- Ensure PostgreSQL is running, and the `alpha` database exists.
- Use `createdb alpha` to create the DB if needed.


TO DO
Upload locations