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

router.post('/images/upload', upload.array('images', 10), (req, res) => {
    const licensePlate = req.body.license_plate;
  
    if (!licensePlate) {
        return res.status(400).json({ error: 'license_plate is required in body' });
    }
  
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
  
    const insertImage = db.prepare(`
        INSERT INTO images (car_license_plate, link, idx)
        VALUES (?, ?, ?)
    `);
  
    req.files.forEach((file, index) => {
        const relativePath = `/api/data/images/${file.filename}`;
        insertImage.run(licensePlate, relativePath, index);
    });
  
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

// In router.patch('/update'):
router.patch('/update', (req, res) => {
    const { license_plate, ...updateFields } = req.body;

    if (!license_plate) {
        return res.status(400).json({ error: "license_plate is required" });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateFields)) {
        if (value !== undefined) {
            let dbValue = value;
            
            // Handle special fields
            if (key === 'ipva_tax_years') {
                if (!Array.isArray(value)) {
                    return res.status(400).json({ error: "ipva_tax_years must be an array" });
                }
                dbValue = JSON.stringify(value);
            }
            else if (['mileage', 'registration_number', 'ownership_document'].includes(key)) {
                dbValue = parseInt(value) || null;
            }
            else if (key === 'price') {
                dbValue = parseFloat(value);
            }
            
            updates.push(`${key} = ?`);
            values.push(dbValue);
        }
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(license_plate);
    
    const query = `UPDATE cars SET ${updates.join(', ')} WHERE license_plate = ?`;
    
    db.run(query, values, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Car not found" });
        res.json({ message: "Car updated successfully", changes: this.changes });
    });
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