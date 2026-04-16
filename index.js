const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

const registro = require("./js/registro");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));

app.use(
  session({
    secret: "secreto",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use("/signin", registro);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "html/registro.html"));
});

app.listen(3000, () => {
  console.log("servidor funcionando en http://localhost:3000 :p");
});
