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
    const licensePlate = req.body.license_plate;

    if (!licensePlate) {
        return res.status(400).json({ error: 'license_plate is required in body' });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
        const existingImage = db.prepare(`
            SELECT * FROM images WHERE car_license_plate = ?
        `).get(licensePlate);

        const imagePath = `/api/data/images/${req.files[0].filename}`;

        if (existingImage) {
            // Atualiza imagem principal existente
            const updateImage = db.prepare(`
                UPDATE images
                SET link = ?
                WHERE car_license_plate = ? AND idx = 0
            `);
            updateImage.run(imagePath, licensePlate);
        } else {
            // Insere nova imagem principal
            const insertImage = db.prepare(`
                INSERT INTO images (car_license_plate, link, idx)
                VALUES (?, ?, 0)
            `);
            insertImage.run(licensePlate, imagePath);
        }

        res.json({
            message: 'Images uploaded successfully',
            files: req.files.map(f => f.filename)
        });
    } catch (error) {
        console.error("Erro ao salvar imagem:", error.message);
        res.status(500).json({ error: error.message });
    }
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
            price,
            ipva_tax_years,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
        license_plate,
        name || null,
        year || null,
        chassis || null,
        registration_number || null,
        ownership_document || null,
        mileage || null,
        description || null,
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

router.post('/update', (req, res) => {
    let {
        name,
        license_plate,
        year,
        chassis,
        registration_number,
        ownership_document,
        mileage,
        description,
        price,
        ipva_tax_years,
        status
    } = req.body;

    console.log(`
        name: ${name},
        license_plate: ${license_plate},
        year: ${year},
        chassis: ${chassis},
        registration_number: ${registration_number},
        ownership_document: ${ownership_document},
        mileage: ${mileage},
        description: ${description},
        price: ${price},
        ipva_tax_years: ${ipva_tax_years},
        status: ${status}
    `);

    if (
        !name || !license_plate || !year || !chassis || !registration_number ||
        !ownership_document || !mileage || !price ||
        !ipva_tax_years || !status
    ) {
        return res.status(400).json({ error: "alguns campos estão faltando!" });
    }

    const query = `
        UPDATE cars SET
            name = ?,
            year = ?,
            chassis = ?,
            registration_number = ?,
            ownership_document = ?,
            mileage = ?,
            description = ?,
            price = ?,
            ipva_tax_years = ?,
            status = ?
        WHERE license_plate = ?
    `;

    const values = [
        name,
        year,
        chassis,
        registration_number,
        ownership_document,
        mileage,
        description,
        price,
        JSON.stringify(ipva_tax_years),
        status,
        license_plate
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error("Erro ao atualizar:", err.message);
            return res.status(500).json({ error: err.message });
        }

        return res.status(200).json({ message: "Dados Atualizados!" });
    });
});

router.get('/retrieve', (req, res) => {
    const {
        license_plate,
        year,
        chassis,
        registration_number,
        priceMin,
        priceMax,
        status
    } = req.query;

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
    if (status) {
        query += " AND status = ?";
        params.push(status);
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

router.get("/car_name/:license_plate", (req, res) => {
    const licensePlate = req.params.license_plate;

    const query = `SELECT name FROM cars WHERE license_plate = ?`;

    db.get(query, [licensePlate], (err, row) => {
        if (err) {
            console.error("Erro ao buscar nome do carro:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "Carro não encontrado." });
        }

        return res.status(200).json({ name: row.name });
    });
});

module.exports = router;
