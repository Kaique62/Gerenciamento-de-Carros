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
            name TEXT NOT NULL,
            year TEXT NOT NULL,
            chassis TEXT,
            registration_number INTEGER,
            ownership_document INTEGER,
            mileage INTEGER,
            description TEXT,
            price INTEGER,
            ipva_tax_years TEXT, -- armazenar como JSON: ["2023", "2024"]
            status TEXT CHECK(status IN ('available', 'sold', 'maintenance')) DEFAULT 'available'
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

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          acc_type INT NOT NULL,
          avatarUrl TEXT
        );
    `);
});


//         INSERT INTO users (name, acc_type, password, avatarUrl) values ('Daniel', 1, 'adm2025', 'https://viagem.cnnbrasil.com.br/wp-content/uploads/sites/5/2022/05/origem-do-hambuguer-cnn4.jpg?w=1200&h=900&crop=1')

module.exports = db;
