const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 5000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "clinique-management",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("operators"));

// Serve the HTML page for adding patients
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

// Endpoint to add a new patient to the database
app.post("/formPost", (req, res) => {
  console.log("Received a POST request to /formPost");
  const { name, age, contact, admissionFee, date } = req.body;
  const sql =
    "INSERT INTO patient (name, age, contact, admissionFee, date) VALUES (?, ?, ?, ?, ?)" ;
  const values = [name, age, contact, admissionFee, date];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting data into the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while adding the patient." });
    } else {
      console.log("Data inserted into the database.");
      res.status(200).json({ message: "Patient added successfully." });
    }
  });
});

// Endpoint to retrieve patient information by ID
app.get("/getPatient/:id", (req, res) => {
  const patientId = req.params.id;
  const sql = "SELECT * FROM patient WHERE id = ?";

  db.query(sql, [patientId], (err, result) => {
    if (err) {
      console.error("Error retrieving patient data from the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching patient data." });
    } else {
      if (result.length === 0) {
        // Patient not found
        res.status(404).json({ message: "Patient not found." });
      } else {
        // Patient found, send the data
        const patientData = result[0];
        res.status(200).json(patientData);
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
