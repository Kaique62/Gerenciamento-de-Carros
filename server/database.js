const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco:", err.message);
        return;
    }
    db.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
        if (pragmaErr) {
            console.error("Erro ao habilitar foreign keys:", pragmaErr.message);
        }
    });
    console.log("Conectado ao banco de dados SQLite com foreign keys ON.");
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.exec(`
        CREATE TABLE IF NOT EXISTS cars (
            license_plate TEXT PRIMARY KEY,
            year TEXT CHECK(length(year) <= 9),
            chassis TEXT,
            registration_number INTEGER,
            ownership_document INTEGER,
            mileage INTEGER,
            description TEXT,
            registration_date TEXT,
            price INTEGER,
            ipva_tax_years TEXT -- armazenar como JSON: ["2023", "2024"]
        );

        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            car_license_plate TEXT NOT NULL,
            link TEXT NOT NULL,
            idx INTEGER DEFAULT 0,
            FOREIGN KEY (car_license_plate) REFERENCES cars(license_plate) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sales_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            car_license_plate TEXT NOT NULL,
            date TEXT NOT NULL,
            sale_value INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            FOREIGN KEY (car_license_plate) REFERENCES cars(license_plate) ON DELETE CASCADE
        );
`);

});

module.exports = db;
