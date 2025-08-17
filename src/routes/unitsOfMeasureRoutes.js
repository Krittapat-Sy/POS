const express = require('express');
const router = express.Router();
const unitsOfMeasureController = require('../controllers/unitsOfMeasureController')
const { verifyAccessToken} = require('../middleware/authMiddleware');

router.post('/createunitOfMeasure', verifyAccessToken, unitsOfMeasureController.createUnitOfMeasure);
router.get('/', verifyAccessToken, unitsOfMeasureController.getAllUnitsOfMeasure);
router.get('/:unitId', verifyAccessToken, unitsOfMeasureController.getUnitOfMeasureById);
router.post('/updateUnitOfMeasure', verifyAccessToken, unitsOfMeasureController.updateUnitOfMeasure);
router.delete('/deleteUnitOfMeasure/:unitId', verifyAccessToken, unitsOfMeasureController.deleteUnitOfMeasure);

module.exports = router;