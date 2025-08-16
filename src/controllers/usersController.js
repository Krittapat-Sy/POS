const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
    const { name, lastname, username, password, roleId } = req.body;
    if (!name || !lastname || !username || !password || !roleId) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [roles] = await connection.query('SELECT id FROM roles WHERE id = ?', [roleId]);
        if (roles.length === 0) {
            return res.status(400).json({ message: 'ตำแหน่งนี้ไม่มีในระบบ!' });
        }

        const [existingUsers] = await connection.query('SELECT username FROM users WHERE username = ? ', [username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'ชื่อผู้ใช้นี้มีการใช้งานไปแล้ว!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await connection.query('INSERT INTO users (name, lastname, username, password_hash) VALUES (?, ?, ?, ?)',
            [name, lastname, username, hashedPassword]);
        const userId = result.insertId;


        await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
        await connection.commit();
        res.status(201).json({ message: 'เพิ่มผู้ใช้เรียบร้อยแล้ว!' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during user creation.' });
    } finally {
        connection.release();
    }
};

exports.getAllUsers = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [users] = await connection.query(`
            select u.name , u.lastname , u.username , r.name 
            from users u
            left join user_roles ur on u.id = ur.user_id 
            left join roles r on r.id = ur.role_id  `);
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching users.' });
    } finally {
        connection.release();
    }
};

exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    const connection = await pool.getConnection();
    try {
        const [users] = await connection.query(`
            select u.name , u.lastname , u.username , r.name 
            from users u
            left join user_roles ur on u.id = ur.user_id 
            left join roles r on r.id = ur.role_id 
            where u.id = ?`, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ระบุ!' });
        }
        res.status(200).json(users[0]);
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching user.' });
    } finally {
        connection.release();
    }
};
exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, lastname, username, password, roleId } = req.body;

    if (!name || !lastname || !username || !password || !roleId) {
        return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [roles] = await connection.query('SELECT id FROM roles WHERE id = ?', [roleId]);
        if (roles.length === 0) {
            return res.status(400).json({ message: 'ตำแหน่งนี้ไม่มีในระบบ!' });
        }

        const [existingUsers] = await connection.query('SELECT username FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'ชื่อผู้ใช้นี้มีการใช้งานไปแล้ว!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await connection.query('UPDATE users SET name = ?, lastname = ?, username = ?, password_hash = ? WHERE id = ?',
            [name, lastname, username, hashedPassword, userId]);
        
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

        await connection.commit();
        res.status(200).json({ message: 'อัพเดตผู้ใช้เรียบร้อยแล้ว!' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during user update.' });
    } finally {
        connection.release();
    }
};
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ระบุ!' });
        }

        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        await connection.commit();
        res.status(200).json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว!' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during user deletion.' });
    } finally {
        connection.release();
    }
};