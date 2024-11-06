import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';



const { Pool } = pg;

const app = express();
app.use(express.json());
const port = 5000 || process.env.PORT;

dotenv.config({
    path : '.env'
})



// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
    
});

// Automatically create tables on connection
const createTablesOnConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');

        // Create the "user" table if it doesn't exist
        await client.query(`
        CREATE TABLE IF NOT EXISTS Users (
    customer_id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE,
    password VARCHAR(50) NOT NULL,
    phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Fest (
    fest_id INT PRIMARY KEY,
    fest_name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    organiser VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Event_Details (
    event_id INT PRIMARY KEY, 
    event_name VARCHAR(100), 
    fest_id INT,
    FOREIGN KEY (fest_id) REFERENCES Fest(fest_id)
);

CREATE TABLE IF NOT EXISTS Fest_Events (
    fest_id INT,
    event_name VARCHAR(100),
    event_date DATE,
    event_time TIME,
    ticket_price DECIMAL(10,2),
    capacity INT,
    PRIMARY KEY (fest_id, event_name),
    FOREIGN KEY (fest_id) REFERENCES Fest(fest_id)
);

CREATE TABLE IF NOT EXISTS Orders ( 
    order_id INT PRIMARY KEY, 
    event_id INT, 
    customer_id INT,
    amount DECIMAL (10, 2), 
    order_date DATE,
    FOREIGN KEY (event_id) REFERENCES Event_Details(event_id),
    FOREIGN KEY (customer_id) REFERENCES Users (customer_id)
);

CREATE TABLE IF NOT EXISTS Customer_Event (
    customer_id INT,
    event_id INT,
    registration_date DATE, 
    status VARCHAR(50),
    PRIMARY KEY (customer_id, event_id),
    FOREIGN KEY (customer_id) REFERENCES Users (customer_id),
    FOREIGN KEY (event_id) REFERENCES Event_Details(event_id)
);


        
      `);


        console.log('Table created (if not already present).');
        client.release();
    } catch (err) {
        console.error('Database connection failed', err);
    }
};



app.post('/query', async (req, res) => {
    const { query } = req.body;

    try {
        const client = await pool.connect();
        const result = await client.query(query);
        res.send(result.rows);
        client.release();
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error executing query');
    }
});



// Start the server
app.listen(port, () => {
    createTablesOnConnection();  // Create tables as soon as the app starts
    console.log(`Server is running on http://localhost:${port}`);
});
