const pool = require('../config/db');

exports.createCategory = async (req, res) => {
    const { categoryName, description } = req.body
    if (!categoryName) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    const connection = await pool.getConnection();
    try {
        const [existingCategory] = await connection.query('select 1 from categories where category_name = ? ', [categoryName]);
        if (existingCategory.length > 0) {
            return res.status(409).json({ message: 'หมวดหมู่นี้มีอยู่ในระบบแล้ว!' })
        }

        await connection.query('insert into categories (category_name, description) values (?, ?)', [categoryName, description]);
        res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ!' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during category creation.' });
    } finally {
        connection.release();
    }
};

exports.getAllCategory = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [catergories] = await connection.query('select category_id, category_name, description from categories');
        res.status(200).json(catergories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching categories.' });
    } finally {
        connection.release()
    }
};

exports.getCategoryById = async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    const connection = await pool.getConnection();
    try {
        const [category] = await connection.query(`
            select category_id, category_name, description 
            from categories 
            where category_id = ?
            `, [categoryId]);
        if (category.length == 0) return res.status(404).json({ message: 'ไม่พบข้อมูลหมวดหมู่!' });

        res.status(200).json(category)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching categories.' });
    } finally {
        connection.release()
    }
};

exports.updateCategory = async (req, res) => {
    const { categoryId, categoryName, description } = req.body;
    if (!categoryId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    if (categoryName == '') return res.status(400).json({ message: 'ชื่อหมวดหมู่ห้ามว่าง' });

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT category_id, category_name, description FROM categories WHERE category_id = ?',
            [categoryId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ระบุ' });
        }
        const current = rows[0];

        const newName = categoryName ?? current.category_name;
        const newDesc = description ?? current.description;

        if (newName === current.category_name && newDesc === current.description) {
            return res.status(200).json({
                message: 'ไม่มีการเปลี่ยนแปลง',
                data: { categoryId, categoryName: newName, description: newDesc }
            });
        }

        if (newName !== current.category_name) {
            const [dup] = await connection.query(
                'SELECT 1 FROM categories WHERE category_name = ? AND category_id <> ? LIMIT 1',
                [newName, categoryId]
            );
            if (dup.length > 0) {
                return res.status(409).json({ message: 'หมวดหมู่นี้มีอยู่ในระบบแล้ว!' });
            }
        }

        await connection.query(
            'UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?',
            [newName, newDesc, categoryId]
        );

        return res.status(200).json({
            message: 'แก้ไขหมวดหมู่สำเร็จ!',
            data: { categoryId, categoryName: newName, description: newDesc }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while update categories.' });
    } finally {
        connection.release();
    }
};

exports.deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'DELETE FROM categories WHERE category_id = ?',
            [categoryId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ระบุ' });

        res.status(200).json({ message: 'ลบหมวดหมู่ร้อยแล้ว!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while delete brand.' });
    } finally {
        connection.release();
    }
};