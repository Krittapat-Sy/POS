const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require('../middleware/authMiddleware');
const categoriesController = require('../controllers/categoriesController');

router.post('/createCategory', verifyAccessToken, categoriesController.createCategory);
router.get('/', verifyAccessToken, categoriesController.getAllCategory);
router.get('/:categoryId', verifyAccessToken, categoriesController.getCategoryById);
router.post('/updateCategory', verifyAccessToken, categoriesController.updateCategory);
router.delete('/deleteCategory/:categoryId', verifyAccessToken, categoriesController.deleteCategory);

module.exports = router;
