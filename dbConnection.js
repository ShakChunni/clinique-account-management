const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 5000;
const multer = require("multer");
const PDFKit = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const bcrypt = require("bcrypt");
const session = require("express-session");

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

app.set("view engine", "ejs");

// Use the express-session middleware
app.use(
  session({
    secret: "myVeryStrongAndSecretPassphraseForSession", // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
  })
);

// ... rest of your code

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
    callback(null, "images/"); // destination directory for uploaded files
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

app.use("/images", express.static(__dirname + "/images"));
app.use("/logo.png", express.static(__dirname + "/logo.png"));
app.use("/index.html", express.static(__dirname + "/index.html"));
app.use(
  "/operators/dashboard.html",
  express.static(__dirname + "/operators/dashboard.html")
);
const upload = multer({ storage });
app.use(upload.single("image"));

//auth operator
//auth operator
app.get("/dashboard.html", (req, res) => {
  // Check if the user is logged in by verifying the session
  if (req.session.username) {
    // Output the username to the server's console
    console.log("Username:", req.session.username);

    res.sendFile(__dirname + "/operators/dashboard.html");
  } else {
    // Redirect to the login page if the user is not logged in
    res.redirect(__dirname + "/index.html");
  }
});

// Handle signup
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/signup.html");
});

app.post("/signupOperator", async (req, res) => {
  const { name, username, password } = req.body;

  // Check if the username is already taken
  const checkUsernameQuery = "SELECT * FROM operator WHERE username = ?";
  db.query(checkUsernameQuery, [username], (err, results) => {
    if (err) {
      console.error("Error checking username:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error("Error hashing password:", hashErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Insert new operator into the database
      const insertOperatorQuery =
        "INSERT INTO operator (name, username, password) VALUES (?, ?, ?)";
      db.query(
        insertOperatorQuery,
        [name, username, hashedPassword],
        (insertErr) => {
          if (insertErr) {
            console.error("Error inserting operator:", insertErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          res.status(200).json({ message: "Signup successful" });
        }
      );
    });
  });
});

// ... rest of your code
// Handle login form submission
// Handle login form submission
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/login.html");
});

app.post("/loginOperator", async (req, res) => {
  const { username, password } = req.body;

  // Fetch the user from the database
  const query = "SELECT * FROM operator WHERE username = ?";
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error("Database error: ", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (results.length > 0) {
        // User found, check password
        const match = await bcrypt.compare(password, results[0].password);

        if (match) {
          // Passwords match, login successful
          // Set a session with the username
          req.session.username = username;

          res.status(200).send("Login Successful");
        } else {
          // Passwords don't match
          res.status(401).send("Invalid Credentials");
        }
      } else {
        // User not found
        res.status(401).send("Invalid Credentials");
      }
    }
  });
});
// Add these routes to your server-side code

// Fetch username route
app.get("/get-username", (req, res) => {
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.json({ username: null });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.json({ success: false });
    } else {
      res.json({ success: true });
    }
  });
});

// Endpoint to add a new patient to the database
app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

//addmitting new patient
app.post("/formPost", (req, res) => {
  console.log("Received a POST request to /formPost");
  const { name, age, contact, doctor, admissionFee, date } = req.body;
  const sql =
    "INSERT INTO patient (name, age, contact, doctor, admissionFee, date) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [name, age, contact, doctor, admissionFee, date];

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
  const {
    name,
    age,
    contact,
    doctor,
    totalCost,
    totalPaid,
    discountAmount,
    dueAmount,
    totalCharge,
    date,
  } = req.body;

  // Format the date
  const formattedDate = moment(date, "YYYY-MM-DD HH:mm").format(
    "YYYY-MM-DD HH:mm"
  );

  const sql =
    "INSERT INTO patient (name, age, contact, doctor, pathologyCost, totalPaid, discount, dueAmount, totalCharge, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    age,
    contact,
    doctor,
    totalCost,
    totalPaid,
    discountAmount,
    dueAmount,
    totalCharge,
    formattedDate,
  ];

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
  const {
    doctorCharge,
    otCharge,
    seatRent,
    serviceCharge,
    totalPaid,
    totalCharge,
    discount,
    dueAmount,
  } = req.body;

  const sql =
    "UPDATE patient SET doctorCharge = ?, otCharge = ?, seatRent = ?, serviceCharge = ?, totalPaid = ? , totalCharge = ?, discount = ?, dueAmount = ?  WHERE id = ?";
  const values = [
    doctorCharge,
    otCharge,
    seatRent,
    serviceCharge,
    totalPaid,
    totalCharge,
    discount,
    dueAmount,
    patientId,
  ];

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

// Endpoint to otPathology
app.use(express.static(path.join(__dirname, "operators")));

app.get("/otPathology.html", (req, res) => {
  // Use path.join to create the correct path to the HTML file
  const filePath = path.join(__dirname, "operators", "otPathology.html");

  // Send the file to the client
  res.sendFile(filePath);
});

app.post("/addOtPathology/:id", (req, res) => {
  console.log("Received a POST request to /addOtPathology");
  const patientId = req.params.id;
  const {
    name,
    age,
    contact,
    doctor,
    pathologyCost,
    totalCharge,
    totalPaid,
    discountAmount,
    dueAmount,
    date,
  } = req.body;

  const sql =
    "UPDATE patient SET name=?, age=?, contact=?, doctor=?, pathologyCost=?, totalCharge = ?, totalPaid=?, discount=?, dueAmount=?, date=? WHERE id=?";
  const values = [
    name,
    age,
    contact,
    doctor,
    pathologyCost,
    totalCharge,
    totalPaid,
    discountAmount,
    dueAmount,
    date,
    patientId,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating data in the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while updating the patient." });
    } else {
      console.log("Data updated in the database.");
      res.status(200).json({ message: "Patient updated successfully." });
    }
  });
});

//additional-income

// Endpoint to render the HTML form
app.get("/additional-income", (req, res) => {
  res.sendFile(__dirname + "/path_to_your_html_file.html");
});

// Endpoint to handle the form submission and insert data into the database
app.post("/additional-income", (req, res) => {
  console.log("Received a POST request to /additional-income");

  const { incomeType, incomeAmount, date } = req.body;
  const operator = ""; // You can update this later

  const sql =
    "INSERT INTO otherincome (incomeType, income, date, operator) VALUES (?, ?, ?, ?)";
  const values = [incomeType, incomeAmount, date, operator];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting income data into the database:", err);
      res
        .status(500)
        .json({ error: "An error occurred while adding the income." });
    } else {
      console.log("Income data inserted into the database.");
      res.status(200).json({ message: "Income added successfully." });
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
  // Use path.join to create the correct path to the HTML file
  const filePath = path.join(__dirname, "operators", "voucher.html");

  // Send the file to the client
  res.sendFile(filePath);
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
        fontSize: 1000, // Increased font size
        font: __dirname + "/fonts/OpenSans-Bold.ttf",
        align: "center",
        margin: 800,
        // Changed color to blue
      };

      const locationStyle = {
        fontSize: 20, // Font size for location
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        align: "center",
        margin: 10,
      };

      const cellStyle = {
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        fontSize: 40,
        padding: 10,
      };

      const takaFont = __dirname + "/fonts/FN Hasan Kolkata Unicode.ttf"; // Taka symbol font

      doc.pipe(res);

      // Add your logo at the top left
      const logoPath = __dirname + "/logo.png";
      doc.image(logoPath, 50, 50, { width: 50 });

      doc.fillColor("#0000ff").text("FEROZA NURSING HOME", { ...titleStyle });
      doc
        .fillColor("#0000ff")
        .text("Kharampatty, Kishoreganj", { ...locationStyle });

      // Create a table-like structure
      const table = {
        "Patient ID": patientData.id,
        "Patient Name": patientData.name,
        "Patient Age": patientData.age,
        "Contact Number": patientData.contact,
        "Admitted Under": patientData.doctor,
        "Admission Fee": `${String.fromCharCode(0x09f3)}${
          patientData.admissionFee
        }`,
        "Admission Date": patientData.date,
      };

      // Set up the initial position
      const tableX = 50;
      const tableY = 250; // Adjusted the starting Y position for the table
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
app.get("/final-voucher.html", (req, res) => {
  // Use path.join to create the correct path to the HTML file
  const filePath = path.join(__dirname, "operators", "final-voucher.html");

  // Send the file to the client
  res.sendFile(filePath);
});
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
      ],
      [
        "Pathology Charge",
        `${String.fromCharCode(0x09f3)}${patientData.pathologyCost}`,
      ],
      // Insert Taka symbol
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

//pathology pdf
app.get("/pathology-voucher.html", (req, res) => {
  // Use path.join to create the correct path to the HTML file
  const filePath = path.join(__dirname, "operators", "pathology-voucher.html");

  // Send the file to the client
  res.sendFile(filePath);
});

//pathology pdf

app.get("/generate-patient-pathology-pdf", (req, res) => {
  const patientId = req.query.patientId; // Retrieve patientId from the query parameter
  console.log("Received patientId:", patientId);
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
        fontSize: 1000, // Increased font size
        font: __dirname + "/fonts/OpenSans-Bold.ttf",
        align: "center",
        margin: 800,
        // Changed color to blue
      };

      const locationStyle = {
        fontSize: 20, // Font size for location
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        align: "center",
        margin: 10,
      };

      const cellStyle = {
        font: __dirname + "/fonts/OpenSans-Regular.ttf",
        fontSize: 40,
        padding: 10,
      };

      const takaFont = __dirname + "/fonts/FN Hasan Kolkata Unicode.ttf"; // Taka symbol font

      doc.pipe(res);

      // Add your logo at the top left
      const logoPath = __dirname + "/logo.png";
      doc.image(logoPath, 50, 50, { width: 50 });

      doc.fillColor("#0000ff").text("FEROZA NURSING HOME", { ...titleStyle });
      doc
        .fillColor("#0000ff")
        .text("Kharampatty, Kishoreganj", { ...locationStyle });

      // Create a table-like structure
      const table = {
        "Patient ID": patientData.id,
        "Patient Name": patientData.name,
        "Patient Age": patientData.age,
        "Contact Number": patientData.contact,
        "Blood test Under": patientData.doctor,
        "Total Cost": `${String.fromCharCode(0x09f3)}${
          patientData.pathologyCost
        }`,
        "Discount Amount": `${String.fromCharCode(0x09f3)}${
          patientData.discount
        }`,
        "Total Paid": `${String.fromCharCode(0x09f3)}${
          patientData.pathologyPaid
        }`,
        "Due Amount": `${String.fromCharCode(0x09f3)}${patientData.dueAmount}`,
        "Admission Date": patientData.date,
      };

      // Set up the initial position
      const tableX = 50;
      const tableY = 250; // Adjusted the starting Y position for the table
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
    name: req.body.name,
    age: req.body.age,
    contact: req.body.contact,
    doctor: req.body.doctor,
    admissionFee: req.body.admissionFee,
    otCharge: req.body.otCharge,
    seatRent: req.body.seatRent,
    serviceCharge: req.body.serviceCharge,
    pathologyCost: req.body.pathologyCost,
    totalCharge: req.body.totalCharge,
    discount: req.body.discount,
    totalPaid: req.body.totalPaid,
    dueAmount: req.body.dueAmount,
    doctorCharge: req.body.doctorCharge,
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
