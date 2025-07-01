const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../data/database.sqlite'), (err) => {
    if (err) console.error('DB connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

const getCars = (req, res) => {
    db
}

module.exports = {
    db,
    getCars,
};
