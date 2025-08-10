const jwt = require('jsonwebtoken');

exports.verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ');

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, users) => {
        if (err) {
            return res.sendStatus(403); // Forbidden (invalid token)
        }
        req.user = users; // แนบ payload ที่ถอดรหัสแล้วไปกับ request
        next();
    });
};

exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.sendStatus(401);
        }

        const rolesArray = ['roleที่ให้ผ่าน'];
        const hasRole = req.user.roles.some(role => rolesArray.includes(role));
        if (hasRole) {
            next();
        } else {
            res.sendStatus(403); // Forbidden (insufficient permissions)
        }
    };
};
