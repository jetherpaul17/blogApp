const express = require('express');
const router = express.Router();
const { login, register, details, getAllUsers, deleteUser } = require('../controller/users.js');
const { verify, verifyAdmin } = require('../auth.js');

router.post('/register', register);
router.post('/login', login);
router.get('/details', verify, details);

// Admin-only routes
router.get('/admin/getAllUsers', verifyAdmin, getAllUsers);
router.delete('/admin/deleteUser/:id', verifyAdmin, deleteUser);

module.exports = router;