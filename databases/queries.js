/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {Guard, Salary, Message, AttendanceRegister, Location, Admin,} = require('./schemas')//import various models
const mongoose = require('mongoose')//import mongoose library
const bcrypt = require('bcrypt')//import bcrypt to assist hashing passwords
//Connect to Mongodb

mongoose.connect('mongodb://localhost/security_manager', {promiseLibrary: global.Promise})

const queries = {

    storeUpload: async function (path, caption, uploader) {
        return await new Upload({
            path: path,
            uploader: uploader,
            timestamp: new Date(),
            caption: caption,
        }).save()
    },
    updateProfile: async function (id, profile) {

        return await Guard.findOneAndUpdate({_id: id}, {
            username: profile.username,
            email: profile.email,

        }).exec()
    },

    signup: async function (userInfo) {
        return await new Admin({
            password: bcrypt.hashSync(userInfo.password, 10),
            email: userInfo.email,
            username: userInfo.username,
            profile_picture: 'default.jpg',
            date_joined: new Date()
        }).save()
    },
    registerGuardPersonalDetails: async function (userInfo) {
        return await new Guard({
            guard_id: userInfo.guard_id,
            surname: userInfo.surname,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            dob: userInfo.dob,
            gender: userInfo.gender,
            nationalID: userInfo.nationalID,
            employment_date: userInfo.employment_date,
            password: bcrypt.hashSync(userInfo.password, 10),
            email: userInfo.email,
            profile_picture: 'default.jpg',
            date_joined: new Date()
        }).save()
    },
    /**
     *
     * Tag.findOneAndUpdate({
                    name: tag
                }, {$push: {podcasts: podcast._id}},{upsert:true}).exec()
     })
     */
    registerGuard: async function (userInfo) {
        return await new Guard({
            guard_id: userInfo.guard_id,
            email: userInfo.email,
            surname: userInfo.surname,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            password: bcrypt.hashSync(userInfo.password, 10),
            dob: userInfo.dob,
            gender: userInfo.gender,
            nationalID: userInfo.nationalID,
            profile_picture: 'default.jpg',
            postal_address: userInfo.postal_address,
            cellphone: userInfo.cellphone,
            location: userInfo.location,
            timestamp: new Date(),
            employment_date: userInfo.employment_date,
        }).save().then(guard => {
            new Salary({
                guard_id: guard.guard_id,
                contract: userInfo.contract,
                gross_salary: userInfo.gross,
                deductions: [{
                    name: 'nssf',
                    amount: userInfo.nssf
                }, {
                    name: 'nhif',
                    amount: userInfo.nhif
                }, {
                    name: 'loans',
                    amount: userInfo.loans
                }, {
                    name: 'others',
                    amount: userInfo.others
                },]
            }).save()
            return guard
        })
    },
    updateGuardBasicInfo: async function (userInfo) {
        return await Guard.findByIdAndUpdate(userInfo.id,{
            guard_id: userInfo.guard_id,
            surname: userInfo.surname,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            dob: userInfo.dob,
            gender: userInfo.gender,
            nationalID: userInfo.nationalID,
            employment_date: userInfo.employment_date,
        },{new:true}).exec()

    },
    updateGuardContactInfo: async function (userInfo) {
        return await Guard.findByIdAndUpdate(userInfo.id,{
            email: userInfo.email,
            cellphone: userInfo.cellphone,
            postal_address: userInfo.postal_address,
        },{new:true}).exec()

    },
    addLocation: async function (location) {
        return await new Location({
            name: location.name,
            date_joined: new Date()
        }).save()
    },
    updateLocation: async function (location) {
        return await Location.findByIdAndUpdate(location.id,{
            name: location.name,
        }).exec()
    },
    getPassword: async function (guard) {
        return await Guard.findById(guard).select('password').exec()
    },
    changePassword: async function (userInfo) {
        return await Guard.findByIdAndUpdate(userInfo.guard,{ password: bcrypt.hashSync(userInfo.password, 10),},{new:true}).exec()
    },
    signin: async function (register) {
        return await new AttendanceRegister({
            guard_id: register.guard_id,
            signin: register.signin,
            date: register.date,
        }).save()
    },
    signout: async function (register) {
        const attendance = await AttendanceRegister.findOneAndUpdate({
            guard_id: register.guard_id,
            date: register.date,
        }, {
            signout: register.signout
        }, {new: true}).exec()

        //todo do calculations for hourly rates
        const salary = await Salary.findOne({guard_id: register.guard_id}).exec()
        if (salary.contract === 'day') {
            let total_ductions=0
            salary.deductions.map(salo=>{
                total_ductions=total_ductions+salo.amount
            })

            const accountSid = 'AC7eea5ad0c0793fd647c6d7a596740fbc'
            const authToken = '055e40e06dda72b7d70b343f0fb0d133\n'
            const client = require('twilio')(accountSid, authToken)
            // const body=


            const message = `Guard ID: ${register.guard_id}, Salary for the day: KES ${salary.gross_salary}`
            client.messages
                .create({
                    body: message,
                    from: '+14159095176',
                    to: '+254705031577'
                })
                .then(message => console.log(message.sid)).catch(err=>{
                    console.log("Could not send the message. Check you network connection")
            })
                .done()
        }
        return attendance
    },
    storeProfilePicture: async function (path,guard) {
        return await Guard.findByIdAndUpdate(guard, {profile_picture: path},{new:true}).exec()
    },
    newMessage: async function (message) {
        return await new Message({
            "author.account": message.account_type,
            "author.id": message.author,
            body: message.body,
            timestamp: new Date(),
            message_type:message.message_type
        }).save()
    },
    newCustomMessage: async function (message) {
        return await new Message({
            "author.account": message.account_type,
            "author.id": message.author,
            body: message.body,
            timestamp: new Date(),
            message_type:message.message_type,
            title:message.title
        }).save()
    },
    newMessageReply: async function ( message) {
        return await Message.findOneAndUpdate({
            _id: message.message,
        }, {
            $push: {
                replies: {
                    "author.account": message.account,
                    "author.id": message.author,
                    body: message.body,
                    timestamp: new Date(),
                }
            },
        },{new:true}).exec()
    },
    findGuardsInLocation: async function (location_id) {
        return await Guard.find({location: location_id}).exec()
    },
    findAllLocations: async function () {
        return await Location.find().exec()
    },
    findLocation: async function (id) {
        return await Location.findById(id).exec()
    },

    findAllGuards: async function () {
        return await Guard.find({}).exec()
    },
    findGuard: async function (args) {
        return await Guard.findById(args.id).exec()
    },
    findGuardByGuardId: async function (guard_id) {
        return await Guard.findOne({guard_id: guard_id}).exec()
    },
    isGuardExists: async function (args) {
        return await Guard.findOne({email: args.email}).exec()
    },
    // newReport: async function (report) {
    //     return await new Report({
    //         guard_id: report.guard_id,
    //         report: report.report,
    //         timestamp: new Date(),
    //     }).save()
    // },
    getInbox: async function (guard_id) {
        return await Message.find({
            "author.id": guard_id,
        }).sort({timestamp: -1}).exec()
    },
    getAllInbox: async function () {
        return await Message.find({}).sort({timestamp: -1}).exec()
    },
    getAllGuards: async function () {
        return await Guard.find({}).sort({timestamp: -1}).exec()
    },
    getAllLocations: async function () {
        return await Location.find({}).sort({timestamp: -1}).exec()
    }
    ,
    getMessage: async function (id) {
        return await Message.findById(id).sort({"replies.timestamp":-1}).exec()
    },
    getGuardAttendance: async function (guard_id) {
        return await AttendanceRegister.find({guard_id:guard_id}).sort({date:-1}).exec()
    },
    getAllGuardsAttendance: async function () {
        return await AttendanceRegister.find({}).sort({date:-1}).exec()
    },
    getGuardInfo: async function (guard_id) {
        return await Guard.findOne({guard_id:guard_id}).exec()
    },
    getGuardContactInfo: async function (guard_id) {
        return await Guard.findOne({guard_id:guard_id}).exec()
    },
    getGuardPaymentInfo: async function (guard_id) {
        return await Salary.findOne({guard_id:guard_id}).exec()
    },
    isLocationExists: async function (args) {
        return await Location.findOne({name: args.name}).exec()
    },
}
module.exports = queries
