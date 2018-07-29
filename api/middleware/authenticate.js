const jwt = require('jsonwebtoken')
const config = require('../config')
const {Advocate, Admin, CourtStaff} = require('../../databases/schemas')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


mongoose.connect('mongodb://localhost/courtsystem', {promiseLibrary: global.Promise})

module.exports = {
    authenticate: async (ctx) => {
        const authorizationHeader = ctx.headers['authorization']
        let token
        if (authorizationHeader) {
            token = authorizationHeader.split(' ')[1]
        }
        if (token) {
            return await jwt.verify(token, config.jwtSecret, async (err, decoded) => {
                if (err) {
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
        const {username, password} = args
        return await Admin.findOne({username: username}).select('username password').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            username: person.username,
                            role: 'system',
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
    },
    advocateLogin: async (args) => {
        const {practice_number, password} = args
        return await Advocate.findOne({practice_number: practice_number}).select('practice_number password surname').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            practice_number: person.practice_number,
                            surname: person.surname,
                            role: 'advocate',
                        }, config.jwtSecret),
                        error: null
                    }
                }
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your practice number and password and try again.'
                }
            }
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your practice number and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    },
    courtAdminLogin: async (args) => {
        const {username, password, court_station} = args
        return await CourtStaff.findOne({
            username: username,
            court_station: court_station,
            role: 'court-admin'
        }).select('username password court_station').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            username: person.username,
                            court_station: person.court_station,
                            role: 'court-admin',
                        }, config.jwtSecret),
                        error: null
                    }
                }
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
                }
            }
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    }, courtAssistantLogin: async (args) => {
        const {username, password, court_station} = args
        return await CourtStaff.findOne({
            username: username,
            court_station: court_station,
            role: 'assistant'
        }).select('username password court_station').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            username: person.username,
                            court_station: person.court_station,
                            role: 'assistant',
                        }, config.jwtSecret),
                        error: null
                    }
                }
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
                }
            }
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    }, deputyRegistrarLogin: async (args) => {
        const {username, password, court_station} = args
        return await CourtStaff.findOne({
            username: username,
            court_station: court_station,
            role: 'registrar'
        }).select('username password court_station').exec().then(function (person) {
            if (person) {
                if (bcrypt.compareSync(password, person.password)) {
                    return {
                        ok: true,
                        token: jwt.sign({
                            id: person._id,
                            username: person.username,
                            court_station: person.court_station,
                            role: 'registrar',
                        }, config.jwtSecret),
                        error: null
                    }
                }
                return {
                    ok: false,
                    token: null,
                    error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
                }
            }
            return {
                ok: false,
                token: null,
                error: 'No user with such credentials exists. Please check your username, court station and password and try again.'
            }
        }).catch(function (err) {
            return {
                ok: false,
                token: null,
                error: err
            }
        })
    },
}
