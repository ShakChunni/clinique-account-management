const mysql = require("mysql");

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: "localhost", // Your MySQL host
  user: "root", // Your MySQL username
  password: "", // Your MySQL password
  database: "clinique-management", // Your MySQL database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
  } else {
    console.log("Connected to the database");
  }
});

// Export the database connection for use in other files
module.exports = connection;
