/**
 * This file contains database queries. We use the schemas defined in the schemas to CRUD within MongoDB
 */

"use strict"
const {
    Advocate,
    Case,
    Individual,
    Organization,
    CourtStaff,
    CourtStation,
    CaseCategory,
    Verdict,
    Admin,
    Transactions,
    CaseType,
    FormFeeStructure,
    Form,
} = require('./schemas')//import various models
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
    registerCourtAdmin: async function (userInfo) {
        return await new CourtStaff({
            password: bcrypt.hashSync(userInfo.password, 10),
            username: userInfo.username,
            court_station: userInfo.court_station,
            role: 'court-admin',
            timestamp: new Date()
        }).save()
    },
    registerCourtAssistant: async function (userInfo) {
        return await new CourtStaff({
            password: bcrypt.hashSync(userInfo.password, 10),
            username: userInfo.username,
            court_station: userInfo.court_station,
            role: 'assistant',
            timestamp: new Date()
        }).save()
    },
    registerDeputyRegistrar: async function (userInfo) {
        return await new CourtStaff({
            password: bcrypt.hashSync(userInfo.password, 10),
            username: userInfo.username,
            court_station: userInfo.court_station,
            role: 'registrar',
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

    updateAdvocateContactInfo: async function (userInfo) {
        return await Advocate.findByIdAndUpdate(userInfo.id, {
            email: userInfo.email,
            cellphone: userInfo.cellphone,
            postal_address: userInfo.postal_address,
        }, {new: true}).exec()

    },
    addCourtStation: async function (court_station) {
        return await new CourtStation({
            name: court_station.name,
            timestamp: new Date()
        }).save()
    },
    addCaseCategory: async function (category) {
        return await new CaseCategory({
            name: category.name,
            timestamp: new Date()
        }).save()
    },
    addCaseType: async function (category) {
        return await new CaseType({
            name: category.name,
            timestamp: new Date()
        }).save()
    },
    addFormFeeStructure: async function (category) {
        return await new FormFeeStructure({
            name: category.name,
            fee: category.fee,
        }).save()
    },
    adminExists: async function (court_station) {
        return await Admin.find({}).exec()
    },

    updateLocation: async function (court_station) {
        return await Location.findByIdAndUpdate(court_station.id, {
            name: court_station.name,
        }).exec()
    },
    getPassword: async function (guard) {
        return await Advocate.findById(guard).select('password').exec()
    },
    changePassword: async function (userInfo) {
        return await Advocate.findByIdAndUpdate(userInfo.guard, {password: bcrypt.hashSync(userInfo.password, 10),}, {new: true}).exec()
    },

    storeProfilePicture: async function (path, guard) {
        return await Advocate.findByIdAndUpdate(guard, {profile_picture: path}, {new: true}).exec()
    },

    isCourtStationExists: async function (args) {
        return await CourtStation.find({name: args.name}).exec()
    },

    isCourtAdminExists: async function (args) {
        return await CourtStaff.findOne({court_station: args.court_station, role: 'court-admin'}).exec()
    },
    isCourtAssistantExists: async function (args) {
        return await CourtStaff.findOne({court_station: args.court_station, role: 'assistant'}).exec()
    },
    isDeputyRegistrarExists: async function (args) {
        return await CourtStaff.findOne({court_station: args.court_station, role: 'registrar'}).exec()
    }
    ,
    courtStations: async function () {
        return await CourtStation.find({}).sort({timestamp: -1}).exec()
    },
    formFeeStructures: async function () {
        return await FormFeeStructure.find({}).sort({timestamp: -1}).exec()
    },
    isFormFeeStructureExists: async function (args) {
        return await FormFeeStructure.find({name: args.name}).exec()
    }
    ,
    isCaseCategoryExists: async function (args) {
        return await CaseCategory.find({name: args.name}).exec()
    },
    isCaseTypeExists: async function (args) {
        return await CaseType.find({name: args.name}).exec()
    },
    isAdvocateExists: async function (args) {
        return await Advocate.findOne({practice_number: args.practice_number}).exec()
    },
    newCaseCategories: async function () {
        return await CaseCategory.find({}).sort({timestamp: -1}).exec()
    },
    newCaseTypes: async function () {
        return await CaseType.find({}).sort({timestamp: -1}).exec()
    },
    getCourtAssistant: async function (args) {
        return await CourtStaff.findOne({court_station: args, role: 'assistant'}).exec()
    },
    getDeputyRegistrar: async function (args) {
        return await CourtStaff.findOne({court_station: args, role: 'registrar'}).exec()
    },
    findCourtStation: async function (id) {
        return await CourtStation.findById(id).exec()
    },
    findAdmin: async function (id) {
        return await Admin.findById(id).exec()
    },
    caseCategories: async function () {
        return await CaseCategory.find().exec()
    },
    caseTypes: async function () {
        return await CaseType.find().exec()
    },

    findAdvocate: async function (id) {
        return await Advocate.findById(id).exec()
    },
    findCase: async function (id) {
        return await Case.findById(id).exec()
    },
    findIndividual: async function (id) {
        return await Individual.findById(id).exec()
    },
    findOrganization: async function (id) {
        return await Organization.findById(id).exec()
    },
    findCourtStaff: async function (id) {
        return await CourtStaff.findById(id).exec()
    },
    findCaseCategory: async function (id) {
        return await CaseCategory.findById(id).exec()
    },
    findVerdict: async function (id) {
        return await Verdict.findById(id).exec()
    },
    findTransactions: async function (id) {
        return await Transactions.findById(id).exec()
    },
    findFormFeeStructure: async function (id) {
        return await FormFeeStructure.findById(id).exec()
    },
    findForm: async function (id) {
        return await Form.findById(id).exec()
    },
    findCaseType: async function (id) {
        return await CaseType.findById(id).exec()
    },
    addNewForm: async function (type_of_form, path) {
        return await new Form({type_of_form: type_of_form, path: path}).save()
    },
    makePayment: async function (payment) {
        return await new Transactions({fee: payment, timestamp: new Date()}).save()
    },
    addOrganization: async function (organization) {
        return await new Organization({
            email: organization.email,
            name: organization.name,
            cellphone: organization.cellphone
        }).save()
    },
    addIndividual: async function (individual) {
        return await new Individual({
            email: individual.email,
            name: individual.name,
            cellphone: individual.cellphone,
            gender: individual.gender,
            dob: individual.dob,
            timestamp: new Date()
        }).save()
    },
    findPendingCases: async function (advocate) {
        return await Case.find({
            advocate: advocate
        }).sort({timestamp: -1}).exec()
    },
    findCaseForms: async function () {
        return await FormFeeStructure.find({}).exec()
    },
    findServedCases: async function (id,prefix) {
        return await Case.findOne({
            advocate: {$ne: id},
            "case_number.prefix":prefix
        }).exec()
    },
    findCourtPendingCases: async function (court_station) {
        return await Case.find({
            court_station: court_station
        }).sort({timestamp: -1}).exec()
    },
    findCaseInfo: async function (id) {
        return await Case.findById(id).exec()
    },
    addCase: async function (newCase, advocate) {
        const prefix = (await Case.find({}).exec()).length + 1

        return await new Case({
            title: newCase.title,
            description: newCase.description,
            court_station: newCase.court_station,
            case_type: newCase.case_type,
            case_category: newCase.case_category,
            "defendant.party_type": newCase.defendant_party_type,
            "defendant.name": newCase.defendant_name,
            "defendant.email": newCase.defendant_email,
            "defendant.cellphone": newCase.defendant_cellphone,
            "plaintiff.party_id": newCase.plaintiff,
            "plaintiff.party_type": newCase.plaintiff_type,
            form: newCase.form,
            payment: newCase.payment,
            timestamp: new Date(),
            advocate: advocate,
            "case_number.prefix": prefix,
            "case_number.suffix": this.getSuffix(),
        }).save()
    },
    getSuffix: function () {
        const year = new Date().getFullYear().toString()

        const arr = []
        for (let i = 0; i < year.length; i++) {
            arr.push(year.charAt(i))
        }
        return `${arr[2]}${arr[3]}`
    }


}
// console.log(Case.estimateDocumentCount())

module.exports = queries
