const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const auth = (req, res, next) => {

    //if(!req.header('Authorization')){
    //    return res.status(401).json({ message: 'Sin token, autorizacion denegada' });
    //}

    //const token = req.header('Authorization').replace('Bearer ', '').replace('Cookie: token=', '');

    if(!req.cookies){
        return res.status(401).json({ message: 'Sin token, autorizacion denegada' });
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Sin token, autorizacion denegada' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token invalido' });
    }
};

module.exports = auth;
