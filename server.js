import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || ''
};

let connection;

async function initDatabase() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS alumni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(20),
        graduation_year INT,
        degree VARCHAR(100),
        branch VARCHAR(100),
        current_company VARCHAR(150),
        current_position VARCHAR(150),
        location VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('Alumni table verified/created');
    
  } catch (error) {
    console.error('Database creation error:', error);
    throw error;
  }
}


app.get('/api/alumni', async (req, res) => {
  try {
    const { degree, graduation_year, branch } = req.query;
    
    let query = 'SELECT * FROM alumni WHERE 1=1';
    const params = [];
    
    if (degree) {
      query += ` AND degree = ?`;
      params.push(degree);
    }
    
    if (graduation_year) {
      query += ` AND graduation_year = ?`;
      params.push(graduation_year);
    }
    
    if (branch) {
      query += ` AND branch = ?`;
      params.push(branch);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
});

app.get('/api/alumni/:id', async (req, res) => {
  try {
    const [rows] = await connection.execute('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumni not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
});

app.post('/api/alumni', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, graduation_year,
      degree, branch, current_company, current_position, location
    } = req.body;
    
    const query = `
      INSERT INTO alumni (first_name, last_name, email, phone, graduation_year, degree, branch, current_company, current_position, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      first_name, last_name, email, phone, graduation_year,
      degree, branch, current_company, current_position, location
    ]);
    
    const [newAlumni] = await connection.execute('SELECT * FROM alumni WHERE id = ?', [result.insertId]);
    res.status(201).json(newAlumni[0]);
  } catch (error) {
    console.error('Error creating alumni:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create alumni' });
    }
  }
});

app.put('/api/alumni/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, graduation_year,
      degree, branch, current_company, current_position, location
    } = req.body;
    
    const query = `
      UPDATE alumni 
      SET first_name=?, last_name=?, email=?, phone=?, graduation_year=?, degree=?, branch=?, current_company=?, current_position=?, location=?
      WHERE id=?
    `;
    
    const [result] = await connection.execute(query, [
      first_name, last_name, email, phone, graduation_year,
      degree, branch, current_company, current_position, location, req.params.id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumni not found' });
    }
    
    const [updatedAlumni] = await connection.execute('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    res.json(updatedAlumni[0]);
  } catch (error) {
    console.error('Error updating alumni:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update alumni' });
    }
  }
});

app.delete('/api/alumni/:id', async (req, res) => {
  try {
    const [result] = await connection.execute('DELETE FROM alumni WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumni not found' });
    }
    
    res.json({ message: 'Alumni deleted successfully' });
  } catch (error) {
    console.error('Error deleting alumni:', error);
    res.status(500).json({ error: 'Failed to delete alumni' });
  }
});

// GET filter options
app.get('/api/alumni/filters/options', async (req, res) => {
  try {
    const [degrees] = await connection.execute('SELECT DISTINCT degree FROM alumni WHERE degree IS NOT NULL ORDER BY degree');
    const [years] = await connection.execute('SELECT DISTINCT graduation_year FROM alumni WHERE graduation_year IS NOT NULL ORDER BY graduation_year DESC');
    const [branches] = await connection.execute('SELECT DISTINCT branch FROM alumni WHERE branch IS NOT NULL ORDER BY branch');
    
    res.json({
      degrees: degrees.map(row => row.degree),
      graduation_years: years.map(row => row.graduation_year),
      branches: branches.map(row => row.branch)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Alumni API is running' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
});
