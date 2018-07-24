const jwt = require('jsonwebtoken')
const config = require('../config')
const {Admin} = require('../../databases/schemas')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


mongoose.connect('mongodb://localhost/security_manager', {promiseLibrary: global.Promise})

module.exports = {
    authenticate: async (ctx) => {
        const authorizationHeader = ctx.headers['authorization']
        let token
        if (authorizationHeader) {
            token = authorizationHeader.split(' ')[1]
        }
        if (token) {
            return await jwt.verify(token, config.jwtSecret, async (err, decoded) => {
                if (err ) {
                    return {error: 'Failed to authenticate'}
                }
                else {
                    return {
                        id: decoded.id,
                    }
                }
            })
        } else {
            return {error: 'No token provided'}
        }
    },
    login: async (args) => {
        const {email, password} = args
        return await Admin.findOne({email: email}).select('email password username').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            email: person.email,
                            username: person.username,
                        }, config.jwtSecret),
                        error: null
                    }
                }
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your email and password and try again.'
                }
            }
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your email and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    }
}
