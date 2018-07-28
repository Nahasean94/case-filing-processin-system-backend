/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {Advocate,
    Case,
    Individual,
    Organization,
    CourtStaff,
    CourtStation,
    CaseStation,
    Verdict,
    Admin,
    Transactions,
    FeeStructure,
    Form,} = require('./schemas')//import various models
const mongoose = require('mongoose')//import mongoose library
const bcrypt = require('bcrypt')//import bcrypt to assist hashing passwords
//Connect to Mongodb

mongoose.connect('mongodb://localhost/courtsystem', {promiseLibrary: global.Promise})

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

        return await Advocate.findOneAndUpdate({_id: id}, {
            username: profile.username,
            email: profile.email,

        }).exec()
    },

    registerAdmin: async function (userInfo) {
        return await new Admin({
            password: bcrypt.hashSync(userInfo.password, 10),
            username: userInfo.username,
            timestamp: new Date()
        }).save()
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
    registerAdvocate: async function (userInfo) {
        return await new Advocate({
            practice_number: userInfo.practice_number,
            surname: userInfo.surname,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            dob: userInfo.dob,
            gender: userInfo.gender,
            password: bcrypt.hashSync(userInfo.password, 10),
            email: userInfo.email,
            profile_picture: 'default.jpg',
            timestamp: new Date()
        }).save()
    },

    updateAdvocateBasicInfo: async function (userInfo) {
        return await Advocate.findByIdAndUpdate(userInfo.id,{
            practice_number: userInfo.practice_number,
            surname: userInfo.surname,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            dob: userInfo.dob,
            gender: userInfo.gender,
            nationalID: userInfo.nationalID,
            employment_date: userInfo.employment_date,
        },{new:true}).exec()

    },
    updateAdvocateContactInfo: async function (userInfo) {
        return await Advocate.findByIdAndUpdate(userInfo.id,{
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
    aadminExists: async function (location) {
        return await Admin.find({}).exec()
    },
    updateLocation: async function (location) {
        return await Location.findByIdAndUpdate(location.id,{
            name: location.name,
        }).exec()
    },
    getPassword: async function (guard) {
        return await Advocate.findById(guard).select('password').exec()
    },
    changePassword: async function (userInfo) {
        return await Advocate.findByIdAndUpdate(userInfo.guard,{ password: bcrypt.hashSync(userInfo.password, 10),},{new:true}).exec()
    },
    signin: async function (register) {
        return await new AttendanceRegister({
            practice_number: register.practice_number,
            signin: register.signin,
            date: register.date,
        }).save()
    },
    signout: async function (register) {
        const attendance = await AttendanceRegister.findOneAndUpdate({
            practice_number: register.practice_number,
            date: register.date,
        }, {
            signout: register.signout
        }, {new: true}).exec()

        //todo do calculations for hourly rates
        const salary = await Salary.findOne({practice_number: register.practice_number}).exec()
        if (salary.contract === 'day') {
            let total_ductions=0
            salary.deductions.map(salo=>{
                total_ductions=total_ductions+salo.amount
            })

            const accountSid = 'AC7eea5ad0c0793fd647c6d7a596740fbc'
            const authToken = '055e40e06dda72b7d70b343f0fb0d133\n'
            const client = require('twilio')(accountSid, authToken)
            // const body=


            const message = `Advocate ID: ${register.practice_number}, Salary for the day: KES ${salary.gross_salary}`
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
        return await Advocate.findByIdAndUpdate(guard, {profile_picture: path},{new:true}).exec()
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
    findAdvocatesInLocation: async function (location_id) {
        return await Advocate.find({location: location_id}).exec()
    },
    findAllLocations: async function () {
        return await Location.find().exec()
    },
    findLocation: async function (id) {
        return await Location.findById(id).exec()
    },

    findAllAdvocates: async function () {
        return await Advocate.find({}).exec()
    },
    findAdvocate: async function (args) {
        return await Advocate.findById(args.id).exec()
    },
    findAdvocateByAdvocateId: async function (practice_number) {
        return await Advocate.findOne({practice_number: practice_number}).exec()
    },
    isAdvocateExists: async function (args) {
        return await Advocate.findOne({practice_number: args.practice_number}).exec()
    },
    getInbox: async function (practice_number) {
        return await Message.find({
            "author.id": practice_number,
        }).sort({timestamp: -1}).exec()
    },
    getAllInbox: async function () {
        return await Message.find({}).sort({timestamp: -1}).exec()
    },
    getAllAdvocates: async function () {
        return await Advocate.find({}).sort({timestamp: -1}).exec()
    },
    getAllLocations: async function () {
        return await Location.find({}).sort({timestamp: -1}).exec()
    }
    ,
    getMessage: async function (id) {
        return await Message.findById(id).sort({"replies.timestamp":-1}).exec()
    },
    getAdvocateAttendance: async function (practice_number) {
        return await AttendanceRegister.find({practice_number:practice_number}).sort({date:-1}).exec()
    },
    getAllAdvocatesAttendance: async function () {
        return await AttendanceRegister.find({}).sort({date:-1}).exec()
    },
    getAdvocateInfo: async function (practice_number) {
        return await Advocate.findOne({practice_number:practice_number}).exec()
    },
    getAdvocateContactInfo: async function (practice_number) {
        return await Advocate.findOne({practice_number:practice_number}).exec()
    },
    getAdvocatePaymentInfo: async function (practice_number) {
        return await Salary.findOne({practice_number:practice_number}).exec()
    },
    isLocationExists: async function (args) {
        return await Location.findOne({name: args.name}).exec()
    },
}
module.exports = queries
