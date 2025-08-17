// server/routes/analytics.js

const express = require('express');
const router = express.Router();
const db = require('../database');

// Retorna vendas filtradas por mês e ano (opcional)
router.get('/sales', async (req, res) => {
    try {
        const { month, year } = req.query;

        let query = `SELECT * FROM sales_history WHERE 1=1`;
        const params = [];

        if (month) {
            query += ` AND strftime('%m', date) = ?`;
            params.push(month.padStart(2, '0')); // garante 2 dígitos
        }

        if (year) {
            query += ` AND strftime('%Y', date) = ?`;
            params.push(year);
        }

        query += ` ORDER BY date DESC`;

        db.all(query, params, async (err, sales) => {
            if (err) return res.status(500).json({ error: err.message });

            // Calcula lucro/prejuízo para cada venda
            const salesWithProfit = await Promise.all(
                sales.map(async (sale) => {
                    return new Promise((resolve, reject) => {
                        db.get(`SELECT price FROM cars WHERE license_plate = ?`, [sale.car_license_plate], (err2, car) => {
                            if (err2) return reject(err2);

                            const profit = car ? sale.sale_value - car.price : 0;
                            resolve({
                                ...sale,
                                profit
                            });
                        });
                    });
                })
            );

            res.json(salesWithProfit);
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
