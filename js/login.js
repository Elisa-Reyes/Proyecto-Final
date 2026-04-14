const bcrypt = require("bcrypt");
const session = require("express-session");

app.use(
  session({
    secret: "secreto",
    resave: false,
    saveUninitialized: true,
  }),
);
