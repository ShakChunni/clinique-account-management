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
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use("/operators", express.static(__dirname + "/operators"));
app.use("/admin", express.static(__dirname + "/admin"));

// multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images/"); // destination directory for uploaded files {doesnt work outside of admin folder, why?}
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

app.use("/images", express.static(__dirname + "/images"));

const upload = multer({ storage });
app.use(upload.single("image"));

// Endpoint to add a new patient to the database
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

//addmitting new patient
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

// Pathology

app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/pathology.html");
});
app.post("/addPathology", (req, res) => {
  console.log("Received a POST request to /addPathology");
  const { name, age, contact, totalCost, totalPaid, dueAmount, date } =
    req.body;
  const sql =
    "INSERT INTO patient (name, age, contact, pathologyCost, totalPaid, dueAmount, date) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [name, age, contact, totalCost, totalPaid, dueAmount, date];

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

  const sql =
    "UPDATE patient SET otCharge = ?, serviceCharge = ?,  WHERE id = ?";
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

      const tableStyle = {
        margin: 10,
      };

      const cellStyle = {
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        fontSize: 40,
        padding: 10,
      };

      const takaFont = __dirname + "/fonts/FN Hasan Kolkata Unicode.ttf"; // Taka symbol font

      doc.pipe(res);

      doc.text("Firoza Nursing Home", { ...titleStyle, fontSize: 50 });

      // Create a table-like structure
      const table = {
        "Patient ID": patientData.id,
        "Patient Name": patientData.name,
        "Patient Age": patientData.age,
        "Contact Number": patientData.contact,
        "Admission Fee": `${String.fromCharCode(0x09f3)}${
          patientData.admissionFee
        }`,
        "Admission Date": patientData.date,
      };

      // Set up the initial position
      const tableX = 50;
      const tableY = 150;
      const col1X = tableX;
      const col2X = tableX + 300;

      doc.font(__dirname + "/fonts/OpenSans-Bold.ttf");
      const rowHeight = 40;

      Object.keys(table).forEach((label, index) => {
        const yPos = tableY + index * rowHeight;
        doc
          .font(__dirname + "/fonts/OpenSans-Regular.ttf")
          .text(label, col1X, yPos, cellStyle)
          .font(takaFont) // Use the Taka symbol font
          .text(table[label], col2X, yPos, cellStyle);

        if (index < Object.keys(table).length - 1) {
          const lineYPos = yPos + rowHeight;
          doc
            .moveTo(col1X, lineYPos)
            .lineTo(col2X + 300, lineYPos)
            .stroke();
        }
      });

      doc.end();
    }
  });
});

//final pdf
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
      margin: 0, // Removed extra margin
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
      const yPos = tableY + i * rowHeight; // Removed + 1
      doc
        .font(__dirname + "/fonts/OpenSans-Regular.ttf")
        .text(label, 50, yPos, cellStyle)
        .font(takaFont) // Use the Taka symbol font
        .text(value, 300, yPos, cellStyle);

      if (i < rows.length - 1) {
        const lineYPos = yPos + rowHeight;
        doc
          .moveTo(col1X, lineYPos)
          .lineTo(col2X + 300, lineYPos)
          .stroke();
      }
    }

    doc.end();
  });
});

//admin part
// Create a new endpoint to calculate and retrieve income and expenditure
app.get("/getIncomeExpenditure", (req, res) => {
  const sqlIncome =
    "SELECT SUM(otCharge + serviceCharge + admissionFee) AS totalIncome FROM patient";
  const sqlExpenditure =
    "SELECT SUM(cost) AS totalExpenditure FROM expenditure";

  db.query(sqlIncome, (err, resultIncome) => {
    if (err) {
      console.error("Error calculating total income:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while calculating total income." });
    }

    db.query(sqlExpenditure, (err, resultExpenditure) => {
      if (err) {
        console.error("Error calculating total expenditure:", err);
        return res.status(500).json({
          error: "An error occurred while calculating total expenditure.",
        });
      }

      const totalIncome = resultIncome[0].totalIncome || 0;
      const totalExpenditure = resultExpenditure[0].totalExpenditure || 0;
      const difference = totalIncome - totalExpenditure;

      res.status(200).json({
        totalIncome,
        totalExpenditure,
        difference,
      });
    });
  });
});

// ...
// Endpoint to retrieve all income data
app.get("/getIncome", (req, res) => {
  const sql = "SELECT * FROM patient ORDER BY id";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching income data from the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching income data." });
    } else {
      res.status(200).json(result);
    }
  });
});

// Endpoint to retrieve all expenditure data
app.get("/getExpenditure", (req, res) => {
  const sql = "SELECT * FROM expenditure";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching expenditure data from the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching expenditure data." });
    } else {
      res.status(200).json(result);
    }
  });
});

// Route to get patient data for editing
app.get("/getPatientAdmin", (req, res) => {
  const patientId = req.query.id;
  const query = "SELECT * FROM patient WHERE id = ?";

  db.query(query, [patientId], (err, result) => {
    if (err) {
      console.log(err);
      res.json(null);
    } else {
      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.json(null); // Patient not found
      }
    }
  });
});

// Route to update patient data
app.post("/updatePatientAdmin", (req, res) => {
  const patientId = req.body.id;
  const updatedData = {
    age: req.body.age,
    contact: req.body.contact,
    otCharge: req.body.otCharge,
    serviceCharge: req.body.serviceCharge,
    admissionFee: req.body.admissionFee,
    pathologyCost: req.body.pathologyCost,
  };
  const query = "UPDATE patient SET ? WHERE id = ?";

  db.query(query, [updatedData, patientId], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
