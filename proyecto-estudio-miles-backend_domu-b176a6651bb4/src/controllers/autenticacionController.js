const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

//const User = require('../models/User');

const login =  async (req, res) => {
    const { email, password } = req.body;

    try {
        //buscar usuario en la base
        //const user = await User.findOne({ where: { email } });
        const user = {
            email: "DOMU@gmail.com",
            password: "DOMU1234", 
            id: 1 
        };

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);

        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };

        //bajar el tiempo de duracion del token
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;

            // Configurar la cookie con el token
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 día
            });

            //res.json({ token });

            return res.json({ message: 'Authenticated' });

        });
    }   catch (e) {
        console.error(e.message);
        return res.status(500).send('Server error');
    }   
}

const register = async (req, res) => {
    const { email, password } = req.body;
 
    try {
      let user = await User.findOne({ where: { email } });

      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
     
      user = new User({ email, password });
     
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
     
      await user.save();
     
      const payload = { user: { id: user.id } };
     
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server error');
    }
}

module.exports = {
    login//,
    //register
}