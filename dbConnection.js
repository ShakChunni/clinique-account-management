const mysql = require("mysql");

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

const express = require("express");
const port = 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("operators"));

app.get("/clinique-accounts", (req, res) => {
  res.sendFile(__dirname + "/operators/add-patient.html");
});

app.post("/formPost", (req, res) => {
  console.log("Received a POST request to /formPost");

  // Extract data from the request body
  const { name, age, contact, date } = req.body;

  // Insert data into the MySQL database
  const sql =
    "INSERT INTO patient (name, age, contact, date) VALUES (?, ?, ?, ?)";
  const values = [name, age, contact, date];

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
