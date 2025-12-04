const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use("/api/data", express.static(path.join(__dirname, '../data')));
app.use("/api/data/images", express.static(path.join(__dirname, '../data/images')));
app.use("/api/data/avatar", express.static(path.join(__dirname, '../data/avatar')));
app.use("/api/data/pfp", express.static(path.join(__dirname, '../data/pfp')));

// Pages Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/main/index.html'));
});

// Car routes
const carsRoutes = require('./routes/car.js');
app.use('/api/cars', carsRoutes);

// Sales routes
const salesRoutes = require('./routes/sales.js');
app.use('/api/sales', salesRoutes);

// Login routes
const loginRoutes = require('./routes/login.js');
app.use('/api/login', loginRoutes);

// Analytics routes
const analyticsRoutes = require('./routes/analytics.js');
app.use('/api/analytics', analyticsRoutes);


// Start server
app.listen(port, '0.0.0.0', () => {
    console.log("Server running on port: " + port);
});
