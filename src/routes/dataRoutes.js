const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middleware/authMiddleware');

// Route สำหรับ Cashier และ Owner
router.get('/cashier', verifyAccessToken, checkRole(['cashier', 'owner']), (req, res) => {
    res.json({ message: `Welcome User ID: ${req.user.userId}. This is cashier data.` });
});

// Route สำหรับ Owner เท่านั้น
router.get('/owner', verifyAccessToken, checkRole(['owner']), (req, res) => {
    res.json({ message: `Welcome Owner ID: ${req.user.userId}. This is owner-only data.` });
});

module.exports = router;