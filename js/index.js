const express = require("express");
const cors = require("cors");
const session = require("express-session");
// const bcrypt = require("bcrypt");
//also, we added moment: yarn add moment

const app = express();

app.use(express.json());
app.use(cors());
