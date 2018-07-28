'use strict'

/**
 *
 * This file contains the schemas (tables) that will be used to store various data
 */
//import the mongoose library to help us create javascript objects which are used to define schemas and also hold various data types
const mongoose = require('mongoose')

/**
 *
 * In mongoose, a schema represents the structure of a particular document, either completely or just a portion of the document. It's a way to express expected properties and values as well as constraints and indexes. A model defines a programming interface for interacting with the database (read, insert, update, etc). So a schema answers "what will the data in this collection look like?" and a model provides functionality like "Are there any records matching this query?" or "Add a new document to the collection".

 In straight RDBMS, the schema is implemented by DDL statements (create table, alter table, etc), whereas there's no direct concept of a model, just SQL statements that can do highly flexible queries (select statements) as well as basic insert, update, delete operations.

 Another way to think of it is the nature of SQL allows you to define a "model" for each query by selecting only particular fields as well as joining records from related tables together.

 *
 */
//declare the Schema object. Each Schema object represents the equivalent of table in mysql
const Schema = mongoose.Schema

//create the Advocate Schema (Advocate table)
const CaseSchema = new Schema({
    title: String,
    description: String,
    parties: {
        party_type: {
            type: String,
            enum: ['individual', 'organization']
        },
        party_id: String

    },
    judge: String,
    verdict: String,
    payment: String,
    timestamp: Date,
})
const AdvocateSchema = new Schema({
    practice_number: Number,
    email: {
        type: String,
        unique: [true, "email already exists"],
    },
    surname: {
        type: String,
    },
    first_name: {
        type: String,
        required: [true, 'first_name is a required field']
    },
    last_name: {
        type: String,
        required: [true, 'last_name is a required field']
    },
    password: {
        type: String,
        required: [true, 'password is a required field']
    },
    dob: {
        type: Date,
        required: [true, 'dob is a required field']
    },
    gender: {
        type: String,
        required: [true, 'gender is a required field']
    },
    profile_picture: String,
    cellphone: Number,
    timestamp: Date,
})
const IndividualSchema = new Schema({
    party_level: String,
    case_party_type: String,
    names: {
        type: String,
        required:
            [true, 'names is a required field']
    },
    email: {
        type: String,
        required:
            [true, 'email is a required field']
    },
    gender: {
        type: String,
        required:
            [true, 'gender is a required field']
    },
    profile_picture: String,

    cellphone: Number,
    timestamp: Date,
})
const OrganizationSchema = new Schema({
    party_level: String,
    case_party_type: String,
    name: {
        type: String,
        required:
            [true, 'names is a required field']
    },
    email: {
        type: String,
        required:
            [true, 'email is a required field']
    },

    gender: {
        type: String,
        required:
            [true, 'gender is a required field']
    },
    cellphone: Number,
    location: String,
    timestamp: Date,
    postal_address: String,
})
const CourtStaffSchema = new Schema({
    username: {
        type: String,
        unique: [true, "username already exists"],
    },
    password: {
        type: String,
        required: [true, 'Password is a required field']
    },
    role: {
        type: String,
        enum: ['assistant', 'registrar'],
        required: [true, 'Password is a required field']
    },
    timestamp: Date,

})
const AdminSchema = new Schema({
    username: {
        type: String,
        unique: [true, "username already exists"],
    },
    password: {
        type: String,
        required: [true, 'Password is a required field']
    },
    timestamp: Date,

})
const CourtStationSchema = new Schema({
    name: {
        type: String,
        unique: [true, "name already exists"],
    },
    timestamp: Date,

})
const CaseStationSchema = new Schema({
    location: {
        type: String,
        unique: [true, "location already exists"],
    },
    timestamp: Date,

})
const VerdictSchema = new Schema({
    case_id: {
        type: Schema.Types.ObjectId,
        ref: 'Case'
    },
    ruling: {
        type: String,
        required: [true, "ruling is a required field"]
    },
    date: {
        type: Date,
        required: [true, "date is a required field"]
    },
    timestamp: Date,
})
const TransactionsSchema = new Schema({
    case_id: {
        type: Schema.Types.ObjectId,
        ref: 'Case'
    },
    fee: {
        type: Number,
        required: [true, "what time did the guard sign in?"]
    },
    timestamp: Date,
})
const FeeStructureSchema = new Schema({
    form_id: {
        type: Schema.Types.ObjectId,
        ref: 'Form'
    },
    name: {
        type: String,
        required: [true, "name is a required field"]
    },
    amount: {
        type: Number,
        required: [true, "amount is a required field"]
    },
})
const FormSchema = new Schema({
    points: [{
        type: String,
    }],
    signature: {
        type: String,
        required: [true, "signature is a required field"]
    },
    amount: {
        type: Number,
        required: [true, "amount is a required field"]
    },
    timestamp: Date,
})


/**
 *
 * Create models from the above schemas.
 */
const Advocate = mongoose.model('Advocate', AdvocateSchema)
const Case = mongoose.model('Case', CaseSchema)
const Individual = mongoose.model('Individual', IndividualSchema)
const Organization = mongoose.model('Organization', OrganizationSchema)
const CourtStaff = mongoose.model('CourtStaff', CourtStaffSchema)
const CourtStation = mongoose.model('CourtStation', CourtStationSchema)
const CaseStation = mongoose.model('CaseStation', CaseStationSchema)
const Verdict = mongoose.model('Verdict', VerdictSchema)
const Transactions = mongoose.model('Transactions', TransactionsSchema)
const Admin = mongoose.model('Admin', AdminSchema)
const FeeStructure = mongoose.model('FeeStructure', FeeStructureSchema)
const Form = mongoose.model('Form', FormSchema)

//export the above models to used in other files
module.exports = {
    Advocate,
    Case,
    Individual,
    Organization,
    CourtStaff,
    CourtStation,
    CaseStation,
    Verdict,
    Transactions,
    FeeStructure,
    Form,
    Admin
}