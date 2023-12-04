const mysql = require("mysql");
const express = require("express");
const app = express();
const port = 3306;
const multer = require("multer");
const PDFKit = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const bcrypt = require("bcrypt");
const session = require("express-session");
const uuid = require("uuid"); // Import the uuid package
const pdf = require("html-pdf");
const jwt = require("jsonwebtoken");

const db = mysql.createConnection({
  host: "localhost",
  user: "****",
  password: "*****",
  database: "******",
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

//pore
const crypto = require("crypto");

const allowedUsernames = ["ash", "amina", "zayed", "maruf"];

const isAuthenticated = (req, res, next) => {
  const { username } = req.query;

  if (username && allowedUsernames.includes(username.toLowerCase())) {
    // User is authenticated using username from URL parameters
    req.user = { username };
    next();
  } else {
    // User is not authenticated
    res.status(401).send("Unauthorized");
  }
};

// Apply the isAuthenticated middleware to all admin routes
const adminRoutes = [
  "dashboard",
  "edit-data",
  "expenditure",
  "income",
  "other-income",
  "types-of-income",
  "operator-income",
  "doctor-income", // Add the new route
];
//admin side files serve
adminRoutes.forEach((route) => {
  app.get(`/app/admin/${route}`, isAuthenticated, (req, res) => {
    res.sendFile(__dirname + `/admin/${route}.html`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/app", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use("/operators", express.static(__dirname + "/app/operators"));
app.use("/admin", express.static(__dirname + "/app/admin"));

app.get("/app/admin/styles", (req, res) => {
  res.sendFile(__dirname + "/admin/styles.css");
});

//images
app.use("/app/images", express.static(__dirname + "/images"));
// multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images/"); // destination directory for uploaded files
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
app.use(upload.single("image"));

//static files

app.use("/app/logo", express.static(path.join(__dirname, "/logo.png")));
app.use("/app/index.html", express.static(__dirname + "/index.html"));

const allowedOpUsernames = ["arshadullah", "koli", "rakib", "maruf"];

const isOpAuthenticated = (req, res, next) => {
  const { username } = req.query;

  if (username && allowedOpUsernames.includes(username.toLowerCase())) {
    // User is authenticated using username from URL parameters
    req.user = { username };
    next();
  } else {
    // User is not authenticated
    res.status(401).send("Unauthorized");
  }
};

//operators serving
const opRoutes = [
  "dashboard",
  "add-patient",
  "pathology",
  "additional-income",
  "add-expenditure",
  "existing-patient",
  "otPathology",
  "voucher",
  "final-voucher",
  "pathology-voucher",
];

// Operator side files serve
opRoutes.forEach((route) => {
  app.get(`/app/operators/${route}`, isOpAuthenticated, (req, res) => {
    res.sendFile(__dirname + `/operators/${route}.html`);
  });
});

// Endpoint to serve static files for /app/operators
app.use(
  "/app/operators",
  express.static(path.join(__dirname, "/app/operators"))
);

app.get("/app/operators/mainStyles", (req, res) => {
  res.sendFile(__dirname + "/operators/mainStyles.css");
});

app.get("/app/operators/genStyles", (req, res) => {
  res.sendFile(__dirname + "/operators/genStyles.css");
});

// Operator signup
app.get("/app/operators/signup", (req, res) => {
  res.sendFile(__dirname + "/operators/signup.html");
});

app.post("/app/signupOperator", async (req, res) => {
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
app.get("/app/operators/login", (req, res) => {
  res.sendFile(__dirname + "/operators/login.html");
});

app.post("/app/loginOperator", async (req, res) => {
  const { username, password } = req.body;
  // Fetch the 
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
app.get("/app/admin/signup", (req, res) => {
  res.sendFile(__dirname + "/admin/signup.html");
});

app.post("/app/admin/signupAdmin", async (req, res) => {
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
app.get("/app/admin/login", (req, res) => {
  res.sendFile(__dirname + "/admin/login.html");
});

app.post("/app/admin/loginAdmin", async (req, res) => {
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

// Add this route to handle logout
app.get("/app/admin/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Redirect to the login page after logout
      res.redirect("/app/admin/login");
    }
  });
});

// Assuming isOpAuthenticated middleware is used before this route
app.post("/app/add-patient", (req, res) => {
  console.log("Received a POST request to /formPost");
  // Retrieve user information from the request object
  const {
    name,
    fname,
    age,
    address,
    contact,
    cabin,
    doctor,
    department,
    admissionFee,
    date,
    username,
  } = req.body;

  const sql =
    "INSERT INTO patient (name, fname, age, address, contact, seatNumber, doctor, department, admissionFee, date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    fname,
    age,
    address,
    contact,
    cabin,
    doctor,
    department,
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

app.post("/app/addPathology", (req, res) => {
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
    username,
  } = req.body;

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
app.get("/app/operators/getPatient/:id", (req, res) => {
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
app.post("/app/update-patient/:id", (req, res) => {
  const patientId = req.params.id;
  const username = req.query.username;
  const {
    otType,
    doctorCharge,
    otCharge,
    seatNumber,
    seatRent,
    serviceCharge,
    totalPaid,
    totalCharge,
    discount,
    dueAmount,
  } = req.body;

  const sql =
    "UPDATE patient SET doctorCharge = ?, otType = ?, otCharge = ?, seatNumber = ?, seatRent = ?, serviceCharge = ?, totalPaid = ?, totalCharge = ?, discount = ?, dueAmount = ?, operator = ? WHERE id = ?";
  const values = [
    doctorCharge,
    otType,
    otCharge,
    seatNumber,
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

app.post("/app/addOtPathology/:id", (req, res) => {
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

// Update the endpoint to handle the form submission and insert data into the database
app.post("/app/additional-income", (req, res) => {
  console.log("Received a POST request to /additional-income");

  const { incomeType, incomeAmount, date, username } = req.body;
  // Now req.user should be defined

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

app.post("/app/add-expenditure", (req, res) => {
  console.log("Received a POST request to /add-expenditure");

  const { description, cost, username, date } = req.body;
  const imageName = req.file.filename;

  // Modify the SQL query to include admission date
  const sql =
    "INSERT INTO expenditure (description, cost, image_name, operator, date) VALUES (?, ?, ?, ?, ?)";
  const values = [description, cost, imageName, username, date];

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

app.get("/app/generate-pdf", (req, res) => {
  const username = req.query.username;
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
      // Get current date and time
      const currentDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka", // Adjust the time zone as needed
        hour12: true, // Use 12-hour format
      });

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
            display: flex; /* Use inline-block to keep elements on the same line */
            background-color: #f0f0f0; /* Background color of the header */
            padding: 10px; /* Adjust padding as needed */
          }
        
          #logo {
            max-width: 30px; /* Adjust the max-width as needed */
            vertical-align: middle;/* Adjust the margin as needed */
          }
        

          .small-text {
            font-size: 80%;
            color: #0e6880;/* Adjust the font size as needed */
          }
            
          h2 {
            flex-grow: 1;
            font-size: 12px;
            font-weight: bold;
            color: #189ab4;
            margin: 0; /* Remove default margin */
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
            font-size: 8px;
          }
    
          th {
            background-color: #f2f2f2;
            font-size: 8px;
          }
    
          .info-data {
            font-weight: italic;
            text-align: right;
            font-size: 10px;
          }
        </style>

        </head>
        <body>
            <div class="header">
              <img src="data:image/png;base64,${getBase64Image(
                "logo.png"
              )}" alt="Logo" id="logo" />
              <h2>FEROZA NURSING HOME<br><span class="small-text">Kharampatty, Kishoreganj</span></h2>
            </div>
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
              <th>Patient Father/Husband's Name</th>
              <td>${patientData.fname}</td>
            </tr> 
            <tr>
              <th>Patient Age</th>
              <td>${patientData.age}</td>
            </tr>
            <tr>
              <th>Patient Address</th>
              <td>${patientData.address}</td>
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
              <th>Admitted Under</th>
              <td>${patientData.department}</td>
            </tr>            
            <tr>
              <th>Admission Fee</th>
              <td>${patientData.admissionFee}</td>
            </tr>
            <tr>
              <th>Admission Date</th>
              <td>${patientData.date}</td>
            </tr>
            <tr>
              <th>Printed By</th>
              <td>${username} on ${currentDate}</td>
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

//final pdf

app.get("/app/generate-patient-pdf", (req, res) => {
  const patientId = req.query.patientId;
  const username = req.query.username;

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
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka", // Adjust the time zone as needed
      hour12: true, // Use 12-hour format
    });

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
            display: flex; /* Use inline-block to keep elements on the same line */
            background-color: #f0f0f0; /* Background color of the header */
            padding: 10px; /* Adjust padding as needed */
          }
        
          #logo {
            max-width: 30px; /* Adjust the max-width as needed */
            vertical-align: middle;/* Adjust the margin as needed */
          }
        

          .small-text {
            font-size: 80%;
            color: #0e6880;/* Adjust the font size as needed */
          }
            
          h2 {
            flex-grow: 1;
            font-size: 12px;
            font-weight: bold;
            color: #189ab4;
            margin: 0; /* Remove default margin */
            text-align: center;
          }
    
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            margin-top: 20px;
          }
    
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 8px;
          }
    
          th {
            background-color: #f2f2f2;
            font-size: 8px;
          }
    
          .info-data {
            font-weight: italic;
            text-align: right;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
      <div class="header-content">
            <div class="header">
              <img src="data:image/png;base64,${getBase64Image(
                "logo.png"
              )}" alt="Logo" id="logo" />
              <h2>FEROZA NURSING HOME<br><span class="small-text">Kharampatty, Kishoreganj</span></h2>
            </div>
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
            <td>${patientData.admissionFee}</td>
          </tr>
          <tr>
            <th>Admission Date</th>
            <td>${patientData.date}</td>
          </tr>
          <tr>
            <th>Department</th>
            <td>${patientData.department}</td>
          </tr>          
          <tr>
            <th>Doctor</th>
            <td>${patientData.doctor}</td>
          </tr>
           <tr>
            <th>Doctor Charge</th>
            <td>${patientData.doctorCharge}</td>
          </tr>
            <tr>
            <th>Seat Numbert</th>
            <td>${patientData.seatNumber}</td>
          </tr>
           <tr>
            <th>Seat Rent</th>
            <td>${patientData.seatRent}</td>
          </tr>
          <tr>
          <th>OT Type</th>
          <td>${patientData.otType}</td>
          </tr>
          <tr>
            <th>OT Charge</th>
            <td>${patientData.otCharge}</td>
          </tr>
          <tr>
            <th>Service Charge</th>
            <td>${patientData.serviceCharge}</td>
          </tr>
          <tr>
            <th>Pathology Cost</th>
            <td>${patientData.pathologyCost}</td>
          </tr>
          <tr>
            <th>Discount Amount</th>
            <td>${patientData.discount}</td>
          </tr>
           <tr>
            <th>Total Charge</th>
            <td>${patientData.totalCharge}</td>
          </tr>
          <tr>
            <th>Total Paid</th>
            <td>${patientData.totalPaid}</td>
          </tr>
          <tr>
            <th>Due Amount</th>
            <td>${patientData.dueAmount}</td>
          </tr>
            <tr>
              <th>Printed By</th>
              <td>${username} on ${currentDate}</td>
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

//pathology information pdf

app.get("/app/generate-patient-pathology-pdf", (req, res) => {
  const username = req.query.username;
  const sql = "SELECT * FROM patient ORDER BY id DESC LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching latest patient data:", err);
      res.status(500).json({
        error: "An error occurred while generating the PDF voucher.",
      });
    } else {
      const patientData = result[0];
      const currentDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka", // Adjust the time zone as needed
        hour12: true, // Use 12-hour format
      });
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
            display: flex; /* Use inline-block to keep elements on the same line */
            background-color: #f0f0f0; /* Background color of the header */
            padding: 10px; /* Adjust padding as needed */
          }
        
          #logo {
            max-width: 30px; /* Adjust the max-width as needed */
            vertical-align: middle;/* Adjust the margin as needed */
          }
        

          .small-text {
            font-size: 80%;
            color: #0e6880;/* Adjust the font size as needed */
          }
            
          h2 {
            flex-grow: 1;
            font-size: 12px;
            font-weight: bold;
            color: #189ab4;
            margin: 0; /* Remove default margin */
            text-align: center;
          }
    
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            margin-top: 20px;
          }
    
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 8px;
          }
    
          th {
            background-color: #f2f2f2;
            font-size: 8px;
          }
    
          .info-data {
            font-weight: italic;
            text-align: right;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
      <div class="header-content">
        <img src="data:image/png;base64,${getBase64Image(
          "logo.png"
        )}" alt="Logo" id="logo" />
        <h2>FEROZA NURSING HOME<br><span class="small-text">Kharampatty, Kishoreganj</span></h2>
      </div>
    </div>

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
            <th>Pathology Cost</th>
            <td>${patientData.pathologyCost}</td>
          </tr>
          <tr>
            <th>Discount Amount</th>
            <td>${patientData.discount}</td>
          </tr>
          <tr>
            <th>Total Paid</th>
            <td>${patientData.totalPaid}</td>
          </tr>
          <tr>
            <th>Due Amount</th>
            <td>${patientData.dueAmount}</td>
          </tr>
          <tr>
            <th>Printed By</th>
             <td>${username} on ${currentDate}</td>
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
app.get("/app/getIncomeExpenditure", (req, res) => {
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
app.get("/app/getIncome", (req, res) => {
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
app.get("/app/admin/getExpenditure", (req, res) => {
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
app.get("/app/admin/getPatientAdmin", (req, res) => {
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
app.post("/app/admin/updatePatientAdmin", (req, res) => {
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
app.get("/app/getOtherIncome", (req, res) => {
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

// Endpoint to retrieve filtered income data
// ...
app.get("/app/getOperatorIncome", (req, res) => {
  const operatorName = req.query.operator || "";
  const dateRange = req.query.dateRange || "";

  // Modify the SQL query to filter by operator and date range
  let sql = "SELECT * FROM patient WHERE operator = ?";
  const queryParams = [operatorName];

  if (dateRange) {
    sql += " AND date BETWEEN ? AND ?";
    const dateRangeArray = dateRange.split(" to ");
    queryParams.push(dateRangeArray[0], dateRangeArray[1]);
  }

  sql += " ORDER BY id";

  db.query(sql, queryParams, (err, result) => {
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
// ...
app.get("/app/getDoctorIncome", (req, res) => {
  const doctorName = req.query.doctor || "";
  const dateRange = req.query.dateRange || "";

  // Modify the SQL query to filter by doctor and date range
  let sql = "SELECT * FROM patient WHERE doctor = ?";
  const queryParams = [doctorName];

  if (dateRange) {
    sql += " AND date BETWEEN ? AND ?";
    const dateRangeArray = dateRange.split(" to ");
    queryParams.push(dateRangeArray[0], dateRangeArray[1]);
  }

  sql += " ORDER BY id";

  db.query(sql, queryParams, (err, result) => {
    if (err) {
      console.error(
        "Error fetching doctor income data from the database:",
        err
      );
      res
        .status(500)
        .json({
          error: "An error occurred while fetching doctor income data.",
        });
    } else {
      res.status(200).json(result);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
