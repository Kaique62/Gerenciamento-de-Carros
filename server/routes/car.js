const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const { triggerAsyncId } = require('async_hooks');

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

    // fetch existing images for this car
    const existingImages = db.prepare(`
        SELECT * FROM images WHERE car_license_plate = ?
        ORDER BY idx ASC
    `).all(licensePlate);

    const insertImage = db.prepare(`
        INSERT INTO images (car_license_plate, link, idx)
        VALUES (?, ?, ?)
    `);

    let nextIdx = existingImages.length; // continue indexing

    req.files.forEach((file, i) => {
        insertImage.run(
            licensePlate,
            `/api/data/images/${file.filename}`,
            nextIdx + i
        );
    });

    res.json({
        message: 'Images uploaded successfully',
        files: req.files.map(f => f.filename)
    });
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
        ipva_tax_years ? JSON.stringify(ipva_tax_years) : '[]',
        status,
        license_plate // usado no WHERE
    ];

    console.log("a rodar!");

    db.run(query, values, function(err) {
        if (err) {
            console.error("Erro ao atualizar:", err.message);
            return res.status(500).json({ error: err.message });
        }

        console.log("rodou");
        return res.status(200).json({ message: "Dados Atualizados!" });
    });
});

router.get('/remove/:plate', (req, res) => {
    let plate = req.params.plate;
    console.log(plate)

    let query = "DELETE FROM cars WHERE license_plate = ?"

    db.get(query, plate, (err) => {
        if (err) {
            console.error("Erro ao remover veículo: ", err.messages);
            return res.status(500).json({error: err.message});
        }
        return res.status(200).json({message: "Veículo Removido com sucesso!"})
    })
})

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

// Get full car data by license plate
router.get('/car/:license_plate', (req, res) => {
    const licensePlate = req.params.license_plate;

    const query = `SELECT * FROM cars WHERE license_plate = ?`;

    db.get(query, [licensePlate], (err, row) => {
        if (err) {
            console.error("Erro ao buscar carro:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "Carro não encontrado." });
        }

        // Parse JSON fields like ipva_tax_years
        try {
            row.ipva_tax_years = row.ipva_tax_years ? JSON.parse(row.ipva_tax_years) : [];
        } catch (e) {
            row.ipva_tax_years = [];
        }

        return res.status(200).json(row);
    });
});


router.get("/price/:license_plate", (req, res) => {
    const licensePlate = req.params.license_plate;

    const query = `SELECT price FROM cars WHERE license_plate = ?`;

    db.get(query, [licensePlate], (err, row) => {
        if (err) {
            console.error("Erro ao buscar nome do carro:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "Carro não encontrado." });
        }

        return res.status(200).json(row);
    });
});

router.post("/changes/add", (req, res) => {
    const { type, author, authorAvatar, dateTime, tagText, tagColor, vehiclePlate, vehicleName } = req.body;

    console.log("Body recebido:", req.body);

    if (!type) {
        return res.status(400).json({ error: "O campo 'type' é obrigatório" });
    }

    const query = `INSERT INTO changes 
        (type, author_name, author_avatar, date_time, tagText, tagColor, vehicle_plate, vehicle_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [type, author, authorAvatar, dateTime, tagText, tagColor, vehiclePlate, vehicleName], function(err) {
        if (err) {
            console.error("Erro ao inserir:", err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json("success");
    });
});

router.post("/changes/update", (req, res) => {
    const { type, author, authorAvatar, dateTime, tagText, tagColor, vehiclePlate, vehicleName, changes } = req.body;

    console.log("Body recebido:", req.body);

    if (!type || type !== "edit") {
        return res.status(400).json({ error: "O campo 'type' deve ser 'edit'" });
    }

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ error: "O campo 'changes' é obrigatório e deve conter pelo menos uma alteração" });
    }

    // Serialize changes array to JSON string
    const changesJSON = JSON.stringify(changes);

    const stmt = db.prepare(`
        INSERT INTO changes
        (type, author_name, author_avatar, date_time, tagText, tagColor, vehicle_plate, vehicle_name, changes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        type,
        author,
        authorAvatar,
        dateTime,
        tagText,
        tagColor,
        vehiclePlate,
        vehicleName,
        changesJSON,
        (err) => {
            if (err) {
                console.error("Erro ao inserir alterações:", err);
                return res.status(500).json({ error: err.message });
            }
            return res.status(200).json({ message: "Alterações registradas com sucesso!" });
        }
    );

    stmt.finalize();
});



router.get("/changes/retireve/add", (req, res) => {
    const query = "SELECT * FROM changes";

    db.all(query, (err, rows) => {
        if (err) {
            console.error("Erro ao buscar alterações:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "alterações não encontradas." });
        }

        return res.status(200).json(rows); // retorna todos os registros
    });
});

router.get("/changes/retrieve/all", (req, res) => {
    const query = `
        SELECT 
            type, 
            author_name, 
            author_avatar, 
            date_time, 
            tagText, 
            tagColor, 
            vehicle_plate, 
            vehicle_name,
            changes
        FROM changes
        ORDER BY date_time DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar alterações:", err);
            return res.status(500).json({ error: err.message });
        }

        const formatted = rows.map(row => {
            let parsedChanges = [];
            if (row.type === "edit" && row.changes) {
                try {
                    parsedChanges = JSON.parse(row.changes);
                } catch (err) {
                    console.warn(`Falha ao parsear changes para veículo ${row.vehicle_plate}:`, err);
                }
            }

            return {
                type: row.type,
                author_name: row.author_name,
                author_avatar: row.author_avatar,
                date_time: row.date_time,
                tagText: row.tagText,
                tagColor: row.tagColor || (row.type === "edit" ? "orange" : "green"),
                vehicle_plate: row.vehicle_plate,
                vehicle_name: row.vehicle_name,
                changes: parsedChanges
            };
        });

        res.json(formatted);
    });
});


module.exports = router;