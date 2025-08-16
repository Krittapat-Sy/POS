const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyAccessToken, checkRole } = require('../middleware/authMiddleware');   

router.post('/createUser', verifyAccessToken, checkRole(['owner']), usersController.createUser);
router.get('/', verifyAccessToken, checkRole(['owner']), usersController.getAllUsers);
router.get('/:id', verifyAccessToken, checkRole(['owner']), usersController.getUserById);
router.post('/updateUser:id', verifyAccessToken, checkRole(['owner']), usersController.updateUser);
router.delete('/deleteUser/:id', verifyAccessToken, checkRole(['owner']), usersController.deleteUser);
module.exports = router;
