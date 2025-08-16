const express = require('express');
const router = express.Router();
const brandsController = require('../controllers/brandsController')
const { verifyAccessToken } = require('../middleware/authMiddleware');   

router.post('/createBrand', verifyAccessToken, brandsController.createBrand);
router.get('/', verifyAccessToken, brandsController.getAllBrands);
router.get('/:brandId', verifyAccessToken, brandsController.getBrandById);
router.post('/updateBrand', verifyAccessToken, brandsController.updateBrand);
router.delete('/deleteBrand/:brandId', brandsController.deleteBrand);

module.exports = router;