const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 5000;
const multer = require("multer");

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
app.use(express.urlencoded({ extended: true }));
app.use(express.static("operators"));

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "uploads/"); // Specify the destination directory for uploaded files
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Add multer middleware for handling file uploads
app.use(upload.single("image")); // 'image' should match the input field name in the form

// Serve the HTML page for adding patients
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

// Endpoint to add a new patient to the database
app.post("/formPost", (req, res) => {
  console.log("Received a POST request to /formPost");
  const { name, age, contact, admissionFee, date } = req.body;
  const sql =
    "INSERT INTO patient (name, age, contact, admissionFee, date) VALUES (?, ?, ?, ?, ?)";
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

app.get("/update-patient", (req, res) => {
  res.sendFile(__dirname + "/operators/existing-patient.html");
});

// Endpoint to update patient information
app.post("/update-patient/:id", (req, res) => {
  const patientId = req.params.id;
  const { otCharge, serviceCharge } = req.body;

  // Update otCharge and serviceCharge for the patient
  const sql = "UPDATE patient SET otCharge = ?, serviceCharge = ? WHERE id = ?";
  const values = [otCharge, serviceCharge, patientId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating patient data:", err);
      res
        .status(500)
        .json({ error: "An error occurred while updating patient data." });
    } else {
      console.log("Patient data updated.");
      res.status(200).json({ message: "Patient data updated successfully." });
    }
  });
});

// Serve the HTML page for adding expenditures
app.get("/add-expenditure", (req, res) => {
  res.sendFile(__dirname + "/operators/expenditure.html");
});

// Endpoint to add a new expenditure to the database
app.post("/add-expenditure", (req, res) => {
  console.log("Received a POST request to /add-expenditure");

  // Handle form data, including file uploads
  const { description, cost } = req.body;
  const imageName = req.file.filename; // Assuming you're using multer for file uploads

  // Insert the data into the "expenditure" table
  const sql =
    "INSERT INTO expenditure (description, cost, image_name) VALUES (?, ?, ?)";
  const values = [description, cost, imageName];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting expenditure data into the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while adding the expenditure." });
    } else {
      console.log("Expenditure data inserted into the database.");
      res.status(200).json({ message: "Expenditure added successfully." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
