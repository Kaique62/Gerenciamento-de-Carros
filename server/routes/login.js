const express = require('express');
const router = express.Router();
const db = require('../database');

/*
const multer = require('multer');
const path = require('path'); pfp stuff
*/ 

router.get("/users", (req, res) => {

    query = "SELECT * FROM users";
    db.all(query, (err, rows) => {
        return res.status(200).json({users: rows});
    })
})


module.exports = router