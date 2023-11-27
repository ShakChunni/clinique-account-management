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
const uuid = require("uuid"); // Import the uuid package

const pdf = require("html-pdf");

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

function getBase64Image(file) {
  const filePath = path.join(__dirname, file);
  const data = fs.readFileSync(filePath);
  return Buffer.from(data).toString("base64");
}

// Use uuid to generate unique session IDs
app.use(
  session({
    genid: (req) => {
      return uuid.v4(); // use UUID v4 for session IDs
    },
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.username) {
    // User is authenticated
    req.user = { username: req.session.username };
    next();
  } else {
    // User is not authenticated
    res.status(401).send("Unauthorized");
  }
};

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
app.use("/logo.png", express.static(path.join(__dirname, "/logo.png")));
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

// Operator signup
app.get("/clinique-accounts/operator/signup", (req, res) => {
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

// Operator login
app.get("/clinique-accounts/operator/login", (req, res) => {
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
// Admin side auth

// Admin signup
app.get("/clinique-accounts/admin/signup", (req, res) => {
  res.sendFile(__dirname + "/admin/signup.html");
});

app.post("/signupAdmin", async (req, res) => {
  const { name, username, password } = req.body;

  // Check if the username is already taken
  const checkUsernameQuery = "SELECT * FROM admin WHERE username = ?";
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
        "INSERT INTO admin (name, username, password) VALUES (?, ?, ?)";
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

// Admin login
app.get("/clinique-accounts/admin/login", (req, res) => {
  res.sendFile(__dirname + "/admin/login.html");
});

app.post("/loginAdmin", async (req, res) => {
  const { username, password } = req.body;

  // Fetch the user from the database
  const query = "SELECT * FROM admin WHERE username = ?";
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

// Fetch username route
app.get("/get-username", (req, res) => {
  if (req.session.username) {
    // Assuming req.session.username is set securely during the user authentication process
    const username = req.session.username;

    // Send the username as JSON
    res.json({ username });
  } else {
    // Handle the case where the username is not available
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
app.post("/formPost", isAuthenticated, (req, res) => {
  console.log("Received a POST request to /formPost");
  const { name, age, contact, doctor, admissionFee, date } = req.body;
  const username = req.user.username; // Now req.user should be defined
  const sql =
    "INSERT INTO patient (name, age, contact, doctor, admissionFee, totalCharge, totalPaid, date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    age,
    contact,
    doctor,
    admissionFee,
    admissionFee,
    admissionFee,
    date,
    username,
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

// Pathology

app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/pathology.html");
});

app.post("/addPathology", isAuthenticated, (req, res) => {
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
  const username = req.user.username; // Now req.user should be defined
  // Format the date
  const formattedDate = moment(date, "YYYY-MM-DD HH:mm").format(
    "YYYY-MM-DD HH:mm"
  );

  const sql =
    "INSERT INTO patient (name, age, contact, doctor, pathologyCost, totalPaid, discount, dueAmount, totalCharge, date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
    username,
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
// Endpoint to update patient data in the database
app.post("/update-patient/:id", isAuthenticated, (req, res) => {
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

  const username = req.user.username; // Now req.user should be defined

  const sql =
    "UPDATE patient SET doctorCharge = ?, otCharge = ?, seatRent = ?, serviceCharge = ?, totalPaid = ?, totalCharge = ?, discount = ?, dueAmount = ?, operator = ? WHERE id = ?";
  const values = [
    doctorCharge,
    otCharge,
    seatRent,
    serviceCharge,
    totalPaid,
    totalCharge,
    discount,
    dueAmount,
    username,
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
      console.log("Result:", username);
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

// Update the endpoint to handle the form submission and insert data into the database
app.post("/additional-income", isAuthenticated, (req, res) => {
  console.log("Received a POST request to /additional-income");

  const { incomeType, incomeAmount, date } = req.body;
  const username = req.user.username; // Now req.user should be defined

  const sql =
    "INSERT INTO otherincome (incomeType, income, date, operator) VALUES (?, ?, ?, ?)";
  const values = [incomeType, incomeAmount, date, username];

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
app.post("/add-expenditure", isAuthenticated, (req, res) => {
  console.log("Received a POST request to /add-expenditure");

  const { description, cost, date } = req.body; // Updated to include admissionDate
  const username = req.user.username; // Now req.user should be defined
  const imageName = req.file.filename;

  // Modify the SQL query to include admission date
  const sql =
    "INSERT INTO expenditure (description, cost, image_name, operator, date) VALUES (?, ?, ?, ?, ?)";
  const values = [description, cost, imageName, date, username, date];

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

//addmission voucher

app.get("/generate-pdf", (req, res) => {
  // Fetch the latest patient data from the database
  const sql = "SELECT * FROM patient ORDER BY id DESC LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching latest patient data:", err);
      res.status(500).json({
        error: "An error occurred while generating the PDF voucher.",
      });
    } else {
      const patientData = result[0];
      const html = `
        <html>
        <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
    
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #fff;
          }
    
          .header {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background-color: #f0f0f0;
            text align: center;
          }
      
          #logo {
            max-width: 80px;
            max-height: 400px;
            margin-right: 40px;
             /* Adjust the margin as needed */
          }
      
          .clinic-name {
            margin-left: 10px; /* Adjust the margin as needed */
            margin-bottom: 250px;
            font-size: 32px;
            font-weight: bold;
            color: #189ab4;
          }
    
          h1 {
            font-size: 26px;
            margin-bottom: 2px;
            font-weight: bold;
            color: #189ab4;
            text-align: center;
          }
    
          h2 {
            font-size: 24px;
            margin-bottom: 35px;
            color: #189ab4;
            background-color: #f0f0f0;
            text-align: center;
          }
    
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
    
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
    
          th {
            background-color: #f2f2f2;
          }
    
          .info-data {
            font-weight: italic;
            text-align: right;
            font-size: 14px;
          }
        </style>

        </head>
        <body>
          <div class="header">
            <img src="data:image/png;base64,${getBase64Image(
              "logo.png"
            )}" alt="Logo" id="logo" />
            <span class="clinic-name">FEROZA NURSING HOME</span>
          </div>
          <h2>Kharampatty, Kishoreganj</h2>
          <table>
            <tr>
              <th>Patient ID</th>
              <td>${patientData.id}</td>
            </tr>
            <tr>
              <th>Patient Name</th>
              <td>${patientData.name}</td>
            </tr>
            <tr>
              <th>Patient Age</th>
              <td>${patientData.age}</td>
            </tr>
            <tr>
              <th>Contact Number</th>
              <td>${patientData.contact}</td>
            </tr>
            <tr>
              <th>Admitted Under</th>
              <td>${patientData.doctor}</td>
            </tr>
            <tr>
              <th>Admission Fee</th>
              <td>${String.fromCharCode(0x09f3)}${patientData.admissionFee}</td>
            </tr>
            <tr>
              <th>Admission Date</th>
              <td>${patientData.date}</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const options = {
        format: "Letter",
        orientation: "portrait",
        border: "10mm",
      };

      pdf.create(html, options).toStream((err, stream) => {
        if (err) {
          console.error("Error creating PDF:", err);
          res.status(500).json({
            error: "An error occurred while generating the PDF voucher.",
          });
        } else {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=voucher.pdf"
          );
          stream.pipe(res);
        }
      });
    }
  });
});

// Use path.join to create the correct path to the HTML file
app.get("/voucher.html", (req, res) => {
  const filePath = path.join(__dirname, "operators", "voucher.html");
  res.sendFile(filePath);
});

//final pdf

app.get("/generate-patient-pdf", (req, res) => {
  const patientId = req.query.patientId;

  const sql = "SELECT * FROM patient WHERE id = ?";
  db.query(sql, [patientId], (err, result) => {
    if (err) {
      console.error("Error fetching patient data:", err);
      return res.status(500).json({
        error: "An error occurred while fetching patient data.",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const patientData = result[0];

    const html = `
      <html>
      <head>
      <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        background: #fff;
      }

      .header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        background-color: #f0f0f0;
        text align: center;
      }
  
      #logo {
        max-width: 80px;
        max-height: 400px;
        margin-right: 40px;
         /* Adjust the margin as needed */
      }
  
      .clinic-name {
        margin-left: 10px; /* Adjust the margin as needed */
        margin-bottom: 250px;
        font-size: 32px;
        font-weight: bold;
        color: #189ab4;
      }

      h1 {
        font-size: 26px;
        margin-bottom: 2px;
        font-weight: bold;
        color: #189ab4;
        text-align: center;
      }

      h2 {
        font-size: 24px;
        margin-bottom: 35px;
        color: #189ab4;
        background-color: #f0f0f0;
        text-align: center;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      th {
        background-color: #f2f2f2;
      }

      .info-data {
        font-weight: italic;
        text-align: right;
        font-size: 14px;
      }
    </style>
      </head>
      <body>
        <div class="header">
          <img src="data:image/png;base64,${getBase64Image(
            "logo.png"
          )}" alt="Logo" id="logo" />
          <span class="clinic-name">FEROZA NURSING HOME</span>
        </div>
        <h2>Kharampatty, Kishoreganj</h2>
        <table>
          <tr>
            <th>Patient ID</th>
            <td>${patientData.id}</td>
          </tr>
          <tr>
            <th>Patient Name</th>
            <td>${patientData.name}</td>
          </tr>
          <tr>
            <th>Patient Age</th>
            <td>${patientData.age}</td>
          </tr>
          <tr>
            <th>Contact Number</th>
            <td>${patientData.contact}</td>
          </tr>
          <tr>
            <th>Admission Fee</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.admissionFee}</td>
          </tr>
          <tr>
            <th>Admission Date</th>
            <td>${patientData.date}</td>
          </tr>
          <tr>
            <th>OT Charge</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.otCharge}</td>
          </tr>
          <tr>
            <th>Service Charge</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.serviceCharge}</td>
          </tr>
          <tr>
            <th>Pathology Charge</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.pathologyCost}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const options = {
      format: "Letter",
      orientation: "portrait",
      border: "10mm",
    };

    pdf.create(html, options).toStream((err, stream) => {
      if (err) {
        console.error("Error creating PDF:", err);
        res.status(500).json({
          error: "An error occurred while generating the PDF voucher.",
        });
      } else {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=patient_information_${patientId}.pdf`
        );
        stream.pipe(res);
      }
    });
  });
});

// Use path.join to create the correct path to the HTML file
app.get("/final-voucher.html", (req, res) => {
  const filePath = path.join(__dirname, "operators", "final-voucher.html");
  res.sendFile(filePath);
});
//pathology information pdf

app.get("/generate-patient-pathology-pdf", (req, res) => {
  const sql = "SELECT * FROM patient ORDER BY id DESC LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching latest patient data:", err);
      res.status(500).json({
        error: "An error occurred while generating the PDF voucher.",
      });
    } else {
      const patientData = result[0];
      const html = `
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
    
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #fff;
          }
    
          .header {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background-color: #f0f0f0;
            text align: center;
          }
      
          #logo {
            max-width: 80px;
            max-height: 400px;
            margin-right: 40px;
             /* Adjust the margin as needed */
          }
      
          .clinic-name {
            margin-left: 10px; /* Adjust the margin as needed */
            margin-bottom: 250px;
            font-size: 32px;
            font-weight: bold;
            color: #189ab4;
          }
    
          h1 {
            font-size: 26px;
            margin-bottom: 2px;
            font-weight: bold;
            color: #189ab4;
            text-align: center;
          }
    
          h2 {
            font-size: 24px;
            margin-bottom: 35px;
            color: #189ab4;
            background-color: #f0f0f0;
            text-align: center;
          }
    
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
    
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
    
          th {
            background-color: #f2f2f2;
          }
    
          .info-data {
            font-weight: italic;
            text-align: right;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
      
      <div class="header">
      <img
        src="data:image/png;base64,${getBase64Image("logo.png")}"
        alt="Logo"
        id="logo"
      />
      <span class="clinic-name">
        FEROZA NURSING HOME
      </span>
    </div>
        <h2>Kharampatty, Kishoreganj</h2>  
        <table>
          <tr>
            <th>ID</th>
            <td>${patientData.id}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td>${patientData.name}</td>
          </tr>
          <tr>
          <th>Age</th>
          <td>${patientData.age}</td>
        </tr>
          <tr>
            <th>Contact</th>
            <td>${patientData.contact}</td>
          </tr>
          <tr>
            <th>Doctor</th>
            <td>${patientData.doctor}</td>
          </tr>
          <tr>
            <th>Total Cost</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.pathologyCost}</td>
          </tr>
          <tr>
            <th>Total Paid</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.totalPaid}</td>
          </tr>
          <tr>
            <th>Discount Amount</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.discount}</td>
          </tr>
          <tr>
            <th>Due Amount</th>
            <td>${String.fromCharCode(0x09f3)}${patientData.dueAmount}</td>
          </tr>
        </table>
      </body>
    </html>
     
`;

      const options = {
        format: "Letter",
        orientation: "portrait",
        border: "10mm",
      };

      pdf.create(html, options).toStream((err, stream) => {
        if (err) {
          console.error("Error creating PDF:", err);
          res.status(500).json({
            error: "An error occurred while generating the PDF voucher.",
          });
        } else {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=voucher.pdf"
          );
          stream.pipe(res);
        }
      });
    }
  });
});

//admin part
// Create a new endpoint to calculate and retrieve income and expenditure
app.get("/getIncomeExpenditure", (req, res) => {
  const sqlIncome = `
    SELECT SUM(otCharge + serviceCharge + admissionFee) AS totalIncome FROM patient
    UNION
    SELECT SUM(income) AS totalIncome FROM otherincome
`;

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

// Endpoint to get other income data
app.get("/getOtherIncome", (req, res) => {
  const sql = "SELECT * FROM otherincome";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching other income data:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json(result);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
