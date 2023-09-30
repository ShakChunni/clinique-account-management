const mysql = require('mysql');

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'clinique-management',
});

function connectToDatabase() {
  return new Promise((resolve, reject) => {
    dbConnection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        reject(err);
      } else {
        console.log('Connected to the database');
        resolve(dbConnection);
      }
    });
  });
}

module.exports = {
  connectToDatabase,
};
