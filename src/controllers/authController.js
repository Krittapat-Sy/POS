const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [existingUsers] = await connection.query('SELECT id FROM users WHERE username =?', [username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        // แฮชรหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // เพิ่มผู้ใช้ใหม่ลงในตาราง users
        const [result] = await connection.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hashedPassword]);
        const userId = result.insertId;

        // ค้นหา role_id
        const [roles] = await connection.query('SELECT id FROM roles WHERE name =?', [role]);
        if (roles.length === 0) {
            return res.status(400).josn({ message: 'Invalid role specified.' });
        }

        const roleId = roles[0].id; 

        // เชื่อมผู้ใช้กับบทบาทในตาราง user_roles
        await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES  (?, ?)', [userId, roleId]);

        await connection.commit();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' })
    } finally {
        connection.release();
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' })
    }

    const connection = await pool.getConnection();
    try {
        // 1. ค้นหาผู้ใช้และดึงข้อมูลบทบาท
        const [users] = await connection.query(
            `SELECT u.id, u.username, u.password, GROUP_CONCAT(r.name) as roles
            FROM users u 
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.username = ? 
            GROUP BY u.id`, [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = users[0];

        // 2. เปรียบเทียบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. สร้าง Access Token
        const accessTokenPayload = { userID: user.id, roles: user.roles.split(',') };
        const accessToken = jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });

        // 4. สร้าง Refresh Token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        // 5. แฮช Refresh Token เพื่อเก็บลง DB
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // 6. เก็บ Hashed Refresh Token ลงในฐานข้อมูล
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS))

        // ลบ token เก่า (ถ้ามี) เพื่อให้แน่ใจว่ามีแค่ 1 เซสชันต่อผู้ใช้
        await connection.query('DELETE FROM refresh_tokens WHERE user_id =?', [user.id]);
        await connection.query('INSERT INTO refresh_tokens (user_id, token_hash, expiry_date) VALUES (?,?,?)',[user.id, refreshTokenHash, expiryDate]);

        // 7. ตั้งค่า Refresh Token ใน HttpOnly Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // ใช้ secure cookie ใน production
            sameSite: 'strict',
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000
        });

        // 8. ส่ง Access Token และข้อมูลผู้ใช้กลับไป
        res.json({
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                roles: user.roles.split(',')
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login." });
    } finally {
        connection.release();
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.sendStatus(204); // No content to log out
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const connection = await pool.getConnection();
    try {
        // ลบ token ออกจากฐานข้อมูลเพื่อยกเลิกเซสชัน
        await connection.query('DELETE FROM refresh_tokens WHERE token_hash =?',);

        res.clearCookie('refreshToken');
        res.sendStatus(204); // Success, no content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during logout.' });
    } finally {
        connection.release();
    }
};


exports.refresh = async (req, res) => {
    const refreshToken = req.cokies.refreshToken;
    if (!refreshToken) {
        return res.sendStatus(401);
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const connection = await pool.getConnection();
    try {
        const [tokens] = await connection.query(
            'SELECT user_id FROM refresh_tokens WHERE token_hash =? AND expiry_date > NOW()',
            [refreshTokenHash]
        );

        if (tokens.length === 0) {
            return res.sendStatus(403);
        }

        const userId = tokens.user_id;

        // ดึงข้อมูล roles ของผู้ใช้
        const [users] = await connection.query(
            `SELECT GROUP_CONCAT(r.name) as roles FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id WHERE ur.user_id =? GROUP BY ur.user_id`,
            [userId]
        );

        if (users.length === 0) {
            return res.sendStatus(403);
        }

        // สร้าง Access Token ใหม่
        const accessTokenPayload = { userId, roles: users.roles.split(',') };
        const accessToken = jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });

        res.json({ accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during token refresh.' });
    } finally {
        connection.release();
    }
};