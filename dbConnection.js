const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 5000;
const multer = require("multer");
const PDFKit = require("pdfkit");
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

// multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "uploads/"); // destination directory for uploaded files
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
app.use(upload.single("image"));

// Endpoint to add a new patient to the database
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

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
        res.status(404).json({ message: "Patient not found." });
      } else {
        const patientData = result[0];
        res.status(200).json(patientData);
      }
    }
  });
});

// Endpoint to update patient information
app.get("/update-patient", (req, res) => {
  res.sendFile(__dirname + "/operators/existing-patient.html");
});

// Endpoint to update patient information
app.post("/update-patient/:id", (req, res) => {
  const patientId = req.params.id;
  const { otCharge, serviceCharge } = req.body;

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

// Endpoint to add a new expenditure to the database
app.get("/add-expenditure", (req, res) => {
  res.sendFile(__dirname + "/operators/expenditure.html");
});

app.post("/add-expenditure", (req, res) => {
  console.log("Received a POST request to /add-expenditure");

  const { description, cost } = req.body;
  const imageName = req.file.filename;
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
      const patientData = result[0];
      const doc = new PDFKit();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=voucher.pdf");

      // Styling for the PDF
      const titleStyle = {
        fontSize: 40,
        font: __dirname + "/fonts/OpenSans-Bold.ttf",
        align: "center",
        margin: 30,
      };

      const cellStyle = {
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        fontSize: 40,
        padding: 10,
        margin: 10,
      };

      const takaFont = __dirname + "/fonts/FN Hasan Kolkata Unicode.ttf"; // Taka symbol font

      doc.pipe(res);

      doc.text("Firoza Nursing Home", { ...titleStyle, fontSize: 50 });

      const tableX = 50;
      const tableY = 150;
      const col1X = tableX;
      const col2X = tableX + 300;

      doc.font(__dirname + "/fonts/OpenSans-Bold.ttf");
      const rowHeight = 40;
      const rows = [
        [patientData.id, patientData.name],
        ["Patient Age", patientData.age],
        ["Contact Number", patientData.contact],
        [
          "Admission Fee",
          `${String.fromCharCode(0x09f3)}${patientData.admissionFee}`,
        ], // Insert Taka symbol
        ["Admission Date", patientData.date],
      ];

      for (let i = 0; i < rows.length; i++) {
        const [label, value] = rows[i];
        const yPos = tableY + (i + 1) * rowHeight;
        doc
          .font(__dirname + "/fonts/OpenSans-Regular.ttf")
          .text(label, col1X, yPos, cellStyle)
          .font(takaFont) // Use the Taka symbol font
          .text(value, col2X, yPos, cellStyle);
      }

      // Add visible lines for the table
      for (let i = 0; i < rows.length + 2; i++) {
        const yPos = tableY + i * rowHeight;
        doc
          .moveTo(col1X, yPos)
          .lineTo(col2X + 300, yPos)
          .stroke();
      }

      doc.end();
    }
  });
});

// Update the endpoint route to use a query parameter
app.get("/generate-patient-pdf", (req, res) => {
  const patientId = req.query.patientId; // Retrieve patientId from the query parameter
  console.log("Received patientId:", patientId);

  // Fetch patient data from the database
  const sql = "SELECT * FROM patient WHERE id = ?";
  db.query(sql, [patientId], (err, result) => {
    if (err) {
      console.error("Error fetching patient data:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching patient data." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const patientData = result[0];

    const doc = new PDFKit();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=patient_information_${patientId}.pdf`
    );

    doc.pipe(res);

    // Styling for the PDF
    const titleStyle = {
      fontSize: 35,
      font: __dirname + "/fonts/OpenSans-Bold.ttf",
      align: "center",
      margin: 30,
    };

    const cellStyle = {
      font: __dirname + "/fonts/OpenSans-Regular.ttf",
      fontSize: 35,
      padding: 10,
      margin: 10,
    };

    const takaFont = __dirname + "/fonts/FN Hasan Kolkata Unicode.ttf"; // Taka symbol font

    doc.text("Patient Admission Form", { ...titleStyle, fontSize: 35 });

    const tableX = 50;
    const tableY = 150;
    const col1X = tableX;
    const col2X = tableX + 300;

    doc.font(__dirname + "/fonts/OpenSans-Bold.ttf");

    const rowHeight = 40;
    const rows = [
      ["Patient ID", patientData.id],
      ["Patient Name", patientData.name],
      ["Patient Age", patientData.age],
      ["Contact Number", patientData.contact],
      [
        "Admission Fee",
        `${String.fromCharCode(0x09f3)}${patientData.admissionFee}`,
      ], // Insert Taka symbol
      ["Admission Date", patientData.date],
      ["OT Charge", `${String.fromCharCode(0x09f3)}${patientData.otCharge}`], // Insert Taka symbol
      [
        "Service Charge",
        `${String.fromCharCode(0x09f3)}${patientData.serviceCharge}`,
      ], // Insert Taka symbol
    ];

    for (let i = 0; i < rows.length; i++) {
      const [label, value] = rows[i];
      const yPos = tableY + (i + 1) * rowHeight;
      doc
        .font(__dirname + "/fonts/OpenSans-Regular.ttf")
        .text(label, 50, yPos, cellStyle)
        .font(takaFont) // Use the Taka symbol font
        .text(value, 300, yPos, cellStyle);
    }

    // Add visible lines for the table
    for (let i = 0; i < rows.length + 2; i++) {
      const yPos = tableY + i * rowHeight;
      doc
        .moveTo(col1X, yPos)
        .lineTo(col2X + 300, yPos)
        .stroke();
    }

    doc.end();
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
