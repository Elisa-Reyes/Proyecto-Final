const bcrypt = require("bcrypt");
const session = require("express-session");
const express = require("express");
const router = express.Router();
const db = require("../bd/bd");
const moment = require("moment");

//also, we added moment: yarn add moment
//all tasks here
