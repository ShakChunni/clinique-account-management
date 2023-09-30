const express = require('express');
const app = express();
const dbConnectionModule = require('./dbConnection'); // Import your modified database connection module
const path = require('path');
const bodyParser = require('body-parser'); // Add bodyParser middleware


// Serve static files from the 'operators' directory
app.use(express.static(path.join(__dirname, 'operators')));

// Use bodyParser middleware to parse JSON requests
app.use(bodyParser.json());

// Define a route to serve your HTML file
app.get('/', async (req, res) => {
  try {
    const dbConnection = await dbConnectionModule.connectToDatabase();
    // You can use dbConnection to interact with the database
    // For example: dbConnection.query(...);

    res.sendFile(path.join(__dirname, 'operators', 'index.html'));
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

// Define a route to handle form submission and insert data into the database
app.post('/add-patient', async (req, res) => {
  try {
    const dbConnection = await dbConnectionModule.connectToDatabase();
    // You can use dbConnection to interact with the database
    // For example: dbConnection.query(...);

    const patientData = req.body;

    // Insert the patient data into the 'patient' table
    const insertQuery = 'INSERT INTO patient (name, age, contact, date) VALUES (?, ?, ?, ?)';
    const values = [patientData.name, patientData.age, patientData.contact, patientData.date];

    dbConnection.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Error inserting data into the database');
      } else {
        console.log('Patient data inserted:', result);
        res.sendStatus(200); // Send a success status
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
