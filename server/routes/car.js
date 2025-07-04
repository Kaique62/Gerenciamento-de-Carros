const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

//#region IMAGE STUFF
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../data/images'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, ''); 
        cb(null, `${timestamp}${ext}`);
    }
});

const upload = multer({ storage });

router.post('/images/upload', upload.array('images', 10), async (req, res) => {
    /*
        Todo: carrosel de imagens,
        Imagem entra com index e link,
        index 0 = imagem principal,
        index > 0 = imagens adicionais,
        possibilidade de exclusão de imagem, via idx e car_plate
    */

    const licensePlate = req.body.license_plate;
  
    const checkExistingImage = db.prepare(`
        Select * FROM images WHERE car_license_plate = ${req.body.license_plate}
    `).get();

    if (!licensePlate) {
        return res.status(400).json({ error: 'license_plate is required in body' });
    }
  
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    let insertImage;
    const imagePath = "/api/data/images/" + req.files[0].filename;

    if (checkExistingImage.length == 0) {
        insertImage = db.prepare(`
            UPDATE images
            SET link = ?
            WHERE car_license_plate = ?
        `);
        insertImage.run(`/api/data/images/${req.files[0].filename}`, licensePlate);
    } else {
        insertImage = db.prepare(`
            INSERT INTO images (car_license_plate, link, idx)
            VALUES (?, ?, ?)
        `);
        insertImage.run(req.body.license_plate, `/api/data/images/${req.files[0].filename}`, 0);
    }

    insertImage.finalize();
  
    res.json({ message: 'Images uploaded successfully', files: req.files.map(f => f.filename) });
});

// Get images for a car
router.get('/images/:license_plate', (req, res) => {
    const licensePlate = req.params.license_plate;

    db.all(
        "SELECT * FROM images WHERE car_license_plate = ? ORDER BY idx ASC",
        [licensePlate],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

//#endregion
//#region Car Data stuff
router.post('/upload', (req, res) => {
    let {
        name,
        license_plate,
        year,
        chassis,
        registration_number,
        ownership_document,
        mileage,
        description,
        registration_date,
        price,
        ipva_tax_years,
        status
    } = req.body;

    if (!license_plate || !price) {
        return res.status(400).json({ error: "license_plate and price are required" });
    }
    
    const query = `
        INSERT INTO cars (
            license_plate,
            name,
            year,
            chassis,
            registration_number,
            ownership_document,
            mileage,
            description,
            registration_date,
            price,
            ipva_tax_years,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
        license_plate,
        name || null,               // ✅ Corrigido aqui
        year || null,
        chassis || null,
        registration_number || null,
        ownership_document || null,
        mileage || null,
        description || null,
        registration_date || null,
        price,
        ipva_tax_years ? JSON.stringify(ipva_tax_years) : '[]',
        status || 'available'
    ], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ error: "A car with this license plate already exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Car uploaded successfully", license_plate });
    });
});

router.get('/retrieve', (req, res) => {
    const {
        license_plate,
        year,
        chassis,
        registration_number,
        priceMin,
        priceMax
    } = req.query;

    //Kinda of a stoopid way to not condition the WHERE
    let query = "SELECT * FROM cars WHERE 1=1";
    const params = [];

    if (license_plate) {
        query += " AND license_plate = ?";
        params.push(license_plate);
    }
    if (year) {
        query += " AND year = ?";
        params.push(year);
    }
    if (chassis) {
        query += " AND chassis = ?";
        params.push(chassis);
    }
    if (registration_number) {
        query += " AND registration_number = ?";
        params.push(registration_number);
    }
    if (priceMin) {
        query += " AND price >= ?";
        params.push(priceMin);
    }
    if (priceMax) {
        query += " AND price <= ?";
        params.push(priceMax);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const carsWithParsedData = rows.map(car => {
            try {
                return {
                    ...car,
                    ipva_tax_years: car.ipva_tax_years ? JSON.parse(car.ipva_tax_years) : []
                };
            } catch (e) {
                return {
                    ...car,
                    ipva_tax_years: []
                };
            }
        });

        res.json(carsWithParsedData);
    });
});

module.exports = router;