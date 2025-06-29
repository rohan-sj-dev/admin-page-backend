# Alumni Backend API

REST API for managing alumni data with MySQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database in `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=alumni_db
PORT=5000
```

3. Make sure MySQL is running on your system

4. Start the server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/alumni` - Get all alumni (with optional filters)
- `GET /api/alumni/:id` - Get single alumni
- `POST /api/alumni` - Create new alumni
- `PUT /api/alumni/:id` - Update alumni
- `DELETE /api/alumni/:id` - Delete alumni
- `GET /api/alumni/filters/options` - Get filter options
- `GET /api/health` - Health check

## For filtering(Query params)

- `degree` - Filter by degree
- `graduation_year` - Filter by graduation year
- `branch` - Filter by major

