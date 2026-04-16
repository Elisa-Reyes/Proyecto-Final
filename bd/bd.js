//main table content :D
//CREATE DATABASE todo;
// USE todo;
// CREATE TABLE usuarios (id INT AUTO_INCREMENT PRIMARY KEY,
//  nombre VARCHAR(100), email VARCHAR(100), password VARCHAR(100));
//  CREATE TABLE tasks (id INT AUTO_INCREMENT PRIMARY KEY,
//                      completed BOOLEAN DEFAULT FALSE,
//                      usuario_id INT,
//                      title VARCHAR(100) NOT NULL,
//                      description TEXT,
//                      due DATE,
//                     FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "todo",
});

db.connect((err) => {
  if (err) {
    console.err("error de conexion: ", err);
  }
  console.log("conectado, todobien");
});

module.exports = db;
