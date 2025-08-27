const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../data/avatar');
        console.log(dir)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `avatar_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// ==============================
// GET /api/users
// Lista todos os usuários (sem senha)
// ==============================
router.get('/users', (req, res) => {
    const query = "SELECT id, name, acc_type, avatarUrl FROM users";
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar usuários." });
        return res.status(200).json({ users: rows });
    });
});

// ==============================
// POST /api/users
// Cria um novo usuário
// ==============================
router.post('/users', async (req, res) => {
    const { name, password, acc_type = 0 } = req.body;
    if (!name || !password) return res.status(400).json({ error: "Campos obrigatórios." });

    db.get("SELECT * FROM users WHERE name = ?", [name], async (err, existingUser) => {
        if (err) return res.status(500).json({ error: "Erro ao verificar usuário." });
        if (existingUser) return res.status(400).json({ error: "Nome de usuário já existe." });

        const hashedPassword = password;
        const query = "INSERT INTO users (name, password, acc_type) VALUES (?, ?, ?)";
        db.run(query, [name, hashedPassword, acc_type], function (err) {
            if (err) return res.status(500).json({ error: "Erro ao registrar usuário." });
            return res.status(201).json({ message: "Usuário registrado com sucesso!", userId: this.lastID });
        });
    });
});

// ==============================
// POST /api/login
// Faz login e retorna dados do usuário
// ==============================
router.post('/authenticate', (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) return res.status(400).json({ error: "Credenciais obrigatórias." });

    const query = "SELECT * FROM users WHERE id = ?";
    db.get(query, [id], async (err, user) => {
        if (err) return res.status(500).json({ error: "Erro interno." });
        if (!user) return res.status(401).json({ error: "Usuário não encontrado." });

        const valid = (password == user.password)
        console.log(valid)
        if (!valid) return res.status(401).json({ error: "Senha incorreta." });

        return res.status(200).json({
            id: user.id,
            name: user.name,
            acc_type: user.acc_type,
            avatarUrl: user.avatarUrl
        });
    });
});

// ==============================
// PATCH /api/users/:id/avatar
// Atualiza o avatar do usuário
// ==============================
router.patch('/users/:id/avatar', upload.single('avatar'), (req, res) => {
    const userId = req.params.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Nenhuma imagem enviada." });

    const avatarUrl = `/api/data/avatar/${file.filename}`;
    const query = "UPDATE users SET avatarUrl = ? WHERE id = ?";
    db.run(query, [avatarUrl, userId], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao atualizar avatar." });
        return res.status(200).json({ message: "Avatar atualizado com sucesso.", avatarUrl });
    });
});

// ==============================
// GET /api/users/:id
// Retorna dados de um usuário específico
// ==============================
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = "SELECT id, name, acc_type, avatarUrl FROM users WHERE id = ?";
    db.get(query, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar usuário." });
        if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
        return res.status(200).json(user);
    });
});

module.exports = router;