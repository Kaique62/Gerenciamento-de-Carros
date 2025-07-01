//Requirements
const app = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cookieParser = require("cookie-parser");

//Express
const app = express();
const port = 4000;

//Data & image stuff
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')))
app.use("/api/data", path.join(__dirname, '../data'))
app.use("/api/data/images", path.join(__dirname, '../data/images'))
app.use("/api/data/pfp", path.join(__dirname, '../data/pfp'))

//Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/main/index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log("Server running on port: " + port)
})