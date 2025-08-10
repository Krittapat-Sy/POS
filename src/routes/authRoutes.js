const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/refresh', authController.refresh);
router.post('/logout', authController.logout); // ใช้ POST เพื่อความปลอดภัย (ป้องกัน CSRF)

module.exports = router;
