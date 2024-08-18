import jwt from 'jsonwebtoken'
import 'dotenv/config'

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(400);
    }

    jwt.verify(token, process.env.JWT_STRING, (err, user) => {
        if (err) {
            return res.sendStatus(400);
        }
        req.user = user;
        next();
    })
}

export default authenticateToken
