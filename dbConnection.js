const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 5000;
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");

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

// ... Existing code
// Serve the HTML page for the PDF voucher
app.get("/voucher.html", (req, res) => {
  res.sendFile(__dirname + "/operators/voucher.html");
});

app.get("/generate-pdf", async (req, res) => {
  // Fetch the latest patient data from the database
  const sql = "SELECT * FROM patient ORDER BY id DESC LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching latest patient data:", err);
      res
        .status(500)
        .json({ error: "An error occurred while generating the PDF voucher." });
    } else {
      const patientData = result[0]; // Get the latest patient data

      // Create a new PDF document
      const doc = new PDFDocument();

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=voucher.pdf");

      // Define styling for the PDF content
      const titleStyle = {
        fontSize: 24,
        font: "Helvetica-Bold",
        align: "center",
        margin: 20,
      };

      const cellStyle = {
        font: "Helvetica-Bold",
        fontSize: 16,
        padding: 10,
        margin: 10,
      };

      const tableStyle = {
        margin: { top: 50, right: 50, bottom: 100, left: 50 },
      };

      // Pipe the PDF document to the response stream
      doc.pipe(res);

      // Add the hospital name
      doc.text("Firoza Nursing Home", { ...titleStyle, fontSize: 18 });

      // Create a table for patient information
      const tableX = 50;
      const tableY = 150;
      const col1X = tableX;
      const col2X = tableX + 250;

      doc
        .font("Helvetica-Bold")
        .text("Patient ID", col1X, tableY, { continued: true })
        .text("Patient Name", col2X, tableY, cellStyle);

      const rowHeight = 30;
      const rows = [
        [patientData.id, patientData.name],
        ["Patient Age", patientData.age],
        ["Contact Number", patientData.contact],
        ["Admission Fee", `$${patientData.admissionFee}`],
        ["Admission Date", patientData.date],
      ];

      for (let i = 0; i < rows.length; i++) {
        const [label, value] = rows[i];
        const yPos = tableY + (i + 1) * rowHeight;
        doc
          .font("Helvetica")
          .text(label, col1X, yPos, cellStyle)
          .text(value, col2X, yPos, cellStyle);
      }

      // Add a footer with hospital information
      doc
        .font("Helvetica-Oblique")
        .text(
          "Thank you for choosing Firoza Nursing Home for your healthcare needs.",
          { align: "center", margin: 20 }
        );

      // End and finalize the PDF
      doc.end();
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
