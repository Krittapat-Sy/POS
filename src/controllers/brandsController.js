const pool = require('../config/db');

exports.createBrand = async (req, res) => {
    const { brandName } = req.body;
    if (!brandName) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    }

    const connection = await pool.getConnection();
    try {
        const [existingBrand] = await connection.query('select 1 from brands where brand_name = ? limit 1', [brandName]);
        if (existingBrand.length > 0) {
            return res.status(409).json({ message: 'แบรนด์นี้มีอยู่ในระบบแล้ว!' });
        };

        await connection.query('insert into brands (brand_name) values (?)', [brandName])
        res.status(201).json({ message: 'เพิ่มแบรนด์สำเร็จ!.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during brand creation.' });
    } finally {
        connection.release();
    }
};

exports.getAllBrands = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [brands] = await connection.query('select brand_name from brands');
        res.status(200).json(brands);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching brands.' });
    } finally {
        connection.release();
    }
};

exports.getBrandById = async (req, res) => {
    const { brandId } = req.params;

    if (!brandId) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    }

    const connection = await pool.getConnection();
    try {
        const [brand] = await connection.query('select brand_name from brands where brand_id = ? limit 1', [brandId])
        if (brand.length == 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลแบรนด์' });
        };

        res.status(200).json(brand);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching brands.' });
    } finally {
        connection.release();
    }
};

exports.updateBrand = async (req, res) => {
    const { brandId, brandName } = req.body;

    if (!brandId || !brandName) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    };

    const connection = await pool.getConnection()
    try {
        const [exitBrand] = await connection.query('select 1 from brands where brand_name = ? limit 1', [brandName]);
        if (exitBrand.length > 0) {
            return res.status(409).json({ message: 'แบรนด์นี้มีอยู่ในระบบแล้ว!' });
        }

        await connection.query('update brands set brand_name = ? where brand_id = ?', [brandName, brandId]);
        res.status(200).json({ message: 'อัพเดตผู้ใช้เรียบร้อยแล้ว!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while update brand.' });
    } finally {
        connection.release();
    }
};

exports.deleteBrand = async (req, res) => {
    const { brandId } = req.params;

    if (!brandId) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    };


    const connection = await pool.getConnection();
    try {
        await connection.query('delete from brands where brand_id = ? ', [brandId])
        res.status(200).json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while delete brand.' });
    } finally {
        connection.release();
    }
};