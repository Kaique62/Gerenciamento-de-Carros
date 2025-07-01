//Requirements
const app = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cookieParser = require("cookie-parser");

//Express
const app = express();
const port = 4000;

//Data stuff
app.use(cookieParser());
app.use("/api/data", path.join(__dirname, '../data'))
app.use("/api/data/images", path.join(__dirname, '../data/images'))

//Routes