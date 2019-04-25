const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config/db-config');
const UserControl = require('../controller/userControl')

/* POST login. */
router.post('/login', function (req, res, next) {

    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                msg: info ? info.msg : 'Login failed',
                user
            });
        }

        req.login(user, { session: false }, (err) => {

            if (err) {
                res.send(err);
            }
            var sendUserData = { id: user.id, email: user.email, userId: user.userId, verified: user.verified }
            const token = jwt.sign(sendUserData, config.secret, {
                expiresIn: '3d' // expires in 24 hours
            });        
            jwt.verify(token, config.secret, function (err, decoded) {
                return res.json({ ...decoded, token });
            })
        });
    })(req, res);

});

router.post('/emailverify', (req, res) => {
    var { token } = req.body;
    jwt.verify(token, config.secret, function (err, decoded) {
        var user = decoded;
        var verified = true;
        var sendUserData = { id: user.id, email: user.email, userId: user.userId, verified }
        token = jwt.sign(sendUserData, config.secret, {
            expiresIn: '3d' // expires in 24 hours
        });
        // return res.json({ ...sendUserData, token });
        UserControl.eamilVerify({ body: { id: user.id, data: { ...sendUserData, token } } }, res)

    })
})


router.post('/emailregister', UserControl.register)


module.exports = router;