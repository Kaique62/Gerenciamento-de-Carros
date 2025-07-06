const express = require('express');
const router = express.Router();
const db = require('../database');

//#region Sales History

// Adiciona uma nova venda
router.post('/sales/add', (req, res) => {
    const { car_license_plate, date, sale_value, payment_method } = req.body;

    if (!car_license_plate || !date || !sale_value || !payment_method) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const query = `
        INSERT INTO sales_history (car_license_plate, date, sale_value, payment_method)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [car_license_plate, date, sale_value, payment_method], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: 'Venda registrada com sucesso.',
            id: this.lastID
        });
    });

    const queryUpdate = `
        UPDATE cars
        SET status = 'sold'
        WHERE license_plate = ?
    `;
    // Atualiza o status do carro para 'sold'
    db.run(queryUpdate, [car_license_plate], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Carro não encontrado.' });
        }
    });
});

// filtro uau
router.get('/sales/:license_plate', (req, res) => {
    const licensePlate = req.params.license_plate;

    const query = `
        SELECT * FROM sales_history
        WHERE car_license_plate LIKE ?
        ORDER BY date DESC
    `;

    db.all(query, [`%${licensePlate}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Consulta filtrada por data
router.get('/sales', (req, res) => {
    const { from, to } = req.query;

    let query = `SELECT * FROM sales_history WHERE 1=1`;
    const params = [];

    if (from) {
        query += ` AND date >= ?`;
        params.push(from);
    }

    if (to) {
        query += ` AND date <= ?`;
        params.push(to);
    }

    query += ` ORDER BY date DESC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Ta ai por existir, gpt gerou isso, n vi motivos para excluir so q é código obsoleto
router.delete('/sales/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM sales_history WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Registro não encontrado.' });
        }

        res.json({ message: 'Venda removida com sucesso.' });
    });
});

//#endregion

module.exports = router;
