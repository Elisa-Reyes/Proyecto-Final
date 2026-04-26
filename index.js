const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

const registro = require("./js/registro");
const login = require("./js/login");
const tasks = require("./js/tasks");

app.use(
  session({
    secret: "secreto",
    resave: true,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use("/signin", registro);
app.use("/log-in", login);
app.use("/tasks", tasks);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "./html/registro.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "./html/login.html"));
});

app.get("/todo", (req, res) => {
  res.sendFile(path.join(__dirname, "./html/main.html"));
});

app.use(express.static(__dirname));

app.listen(3000, "0.0.0.0", () => {
  console.log("servidor funcionando en http://localhost:3000 :p");
});
