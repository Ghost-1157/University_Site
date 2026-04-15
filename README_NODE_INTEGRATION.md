Node.js integration for university_transport_food_home

Overview
- This integration is intentionally scoped to one table: university_transport_food_home.
- Database engine: PostgreSQL.

Setup
1. Open a terminal in this folder.
2. Install dependencies:
   npm install
3. Copy environment file:
   copy .env.example .env
4. Edit .env and set DB_PASSWORD.
5. Optional for separate frontend host: set FRONTEND_ORIGIN to your website URL.

Run
- Production mode:
  npm start
- Watch mode:
  npm run dev

Connect to a website
Option 1: Serve website from this Node app
1. Put your website files in the website folder.
2. Start the API with npm start.
3. Open http://localhost:3000 in your browser.
4. The old demo site remains available at http://localhost:3000/public.

Option 2: Use a separate frontend app (React, Vue, static site)
1. Keep API running on http://localhost:3000.
2. Set FRONTEND_ORIGIN in .env to your frontend URL, for example http://127.0.0.1:5500.
3. In your website JavaScript, call the API directly:

Example frontend fetch
const response = await fetch("http://localhost:3000/api/university-transport-food-home?limit=20&offset=0");
const data = await response.json();
console.log(data.rows);

API endpoints
- GET /health
  Checks API and database connectivity.

- GET /api/university-transport-food-home?limit=50&offset=0
  Returns paginated rows from university_transport_food_home.

- GET /api/university-table-corrected?limit=50&offset=0
  Legacy alias for the same table.

- GET /api/university-transport-food-home/columns
  Returns table column metadata from information_schema.

- GET /api/university-table-corrected/columns
  Legacy alias for the same table.

- GET /api/university-transport-food-home/row/1
  Returns a row by its row number in the current table ordering.

- GET /api/university-table-corrected/row/1
  Legacy alias for the same table.

- POST /api/university-transport-food-home
  Inserts one row. Body must be a JSON object using valid table column names only.

- POST /api/university-table-corrected
  Legacy alias for the same table.

- PATCH /api/university-transport-food-home/row/1
  Updates one row by row number. Body must include one or more valid column names.

- PATCH /api/university-table-corrected/row/1
  Legacy alias for the same table.

- DELETE /api/university-transport-food-home/row/1
  Deletes one row by row number.

- DELETE /api/university-table-corrected/row/1
  Legacy alias for the same table.

Example POST body
{
  "university_name": "Example University",
  "country": "India"
}

Example PATCH body
{
  "country": "United States"
}

Notes
- The service does not access other tables.
- Insert requests are validated against existing columns in university_transport_food_home.
- Update requests are validated against existing columns in university_transport_food_home.
