# Django + React Monorepo

This project contains a monorepo setup with:

- `backend/` — Django & Django REST Framework
- `frontend/` — React (Vite or Create React App)

- 'password is changeme123'
- super user: admin, gmail, C@rlsberg9075
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


## Vendor Work
1. Pull the vendor list from: https://www.gencon.com/api/v1/exhibitors; using fetch_vendors.py
fetch_vendors will writes to exhibitor.json
2. Extract the vendor data from the API using vendor_extract.py
This places the vendor data from exhibitor.json into the vendor table. It also de-duplicates the list into a vendor.txt and adds in the URL
3. Alter the vendor.txt to a CSV and separate the URL into its own column. Insert into assets folder
4. Add the tags to the vendors using scrape_vendor.py
This will iterate over the vendors list (full_vendor_list.csv) in a batch of 10 and return tags that are associated in an array. This writes to the vendor_tagged_playwright.csv
5. Will need to take the vendor_tagged_playwright.csv and iterate over to find and update vendors based on name with the tags, using assign_tags_to_vendors.py


## Aliases for Python
1. djmm = python manage.py makemigrations
2. djm = python manage.py migrate
3. djr = python manage.py runserver