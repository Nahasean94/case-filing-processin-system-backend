/***
 *
 * This file contains all the graphql queries and mutations. These are responsible for receiving and responding to requests from the front end.
 */

const bcrypt = require("bcrypt")

const queries = require('../databases/queries')
const {GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLID, GraphQLInt, GraphQLList, GraphQLBoolean,} = require('graphql')//import various modules from graphql
const {GraphQLUpload} = require('apollo-upload-server')//this module will help us upload files to the server
const GraphQLLong = require('graphql-type-long')
const authentication = require('./middleware/authenticate')//this module helps us authenticate various requests since multiple people with different access levels use the system
const fs = require('fs')//this will help us create and manipulate the file system
const mkdirp = require('mkdirp')//will help use create new folders
const shortid = require('shortid')//will help us name each upload uniquely
const jsmediatags = require('jsmediatags')

//Store the upload
const storeFS = ({stream,filename}, id, uploader) => {
    const uploadDir = `./public/uploads/${uploader}`

// Ensure upload directory exists
    mkdirp.sync(uploadDir)

    const path = `${uploadDir}/${id}-${filename}`
    return new Promise((resolve, reject) =>
        stream
            .on('error', error => {
                if (stream.truncated)
                // Delete the truncated file
                    fs.unlinkSync(path)
                reject(error)
            })
            .pipe(fs.createWriteStream(path))
            .on('error', error => reject(error))
            .on('finish', () => resolve())
    )
}
//process the upload and also store the path in the database
const processUpload = async (upload, profile, uploader) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload.file
    const path = `${uploader}/${id}-${filename}`
    return await storeFS({stream, filename}, id, uploader).then(() =>
        queries.storeUpload(path, upload.caption, uploader))
}
//process the profile picture
const processProfilePicture = async (upload, uploader) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload
    const path = `${uploader}/${id}-${filename}`
    return await storeFS({stream, filename}, id, uploader).then(() =>
        queries.storeProfilePicture(path, uploader))
}


const AdminType = new GraphQLObjectType({
    name: 'Admin',
    fields: () => ({
        id: {type: GraphQLID},
        username: {type: GraphQLString},
        email: {type: GraphQLString},
        profile_picture: {type: GraphQLString},
        date_joined: {type: GraphQLString},
    })
})
const GuardType = new GraphQLObjectType({
    name: 'Guard',
    fields: () => ({
        id: {type: GraphQLID},
        surname: {type: GraphQLString},
        email: {type: GraphQLString},
        profile_picture: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        guard_id: {type: GraphQLInt},
        first_name: {type: GraphQLString},
        last_name: {type: GraphQLString},
        dob: {type: GraphQLString},
        gender: {type: GraphQLString},
        password: {type: GraphQLString},
        postal_address: {type: GraphQLString},
        cellphone: {type: GraphQLLong},
        nationalID: {type: GraphQLInt},
        employment_date: {type: GraphQLString},
        location: {
            type: LocationType,
            async resolve(parent, args) {
                return await queries.findLocation(parent.location)
            }
        },
    })
})
const LocationType = new GraphQLObjectType({
    name: 'Location',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const SalaryType = new GraphQLObjectType({
    name: 'Salary',
    fields: () => ({
        id: {type: GraphQLID},
        guard_id: {type: GraphQLInt},
        contract: {type: GraphQLString},
        deductions: {type: new GraphQLList(DeductionsType)},
        transactions: {type: new GraphQLList(TransactionsType)},
        gross_salary: {type: GraphQLInt},
    })
})
const DeductionsType = new GraphQLObjectType({
    name: 'Deductions',
    fields: () => ({
        name: {type: GraphQLString},
        amount: {type: GraphQLInt},
    })
})
const TransactionsType = new GraphQLObjectType({
    name: 'Transactions',
    fields: () => ({
        timestamp: {type: GraphQLString},
        amount: {type: GraphQLInt},
        text: {type: GraphQLInt},
    })
})
const PasswordType = new GraphQLObjectType({
    name: 'Password',
    fields: () => ({
        confirmed: {
            type: GraphQLBoolean,
        },
    })
})
const MessageType = new GraphQLObjectType({
    name: 'Message',
    fields: () => ({
        id: {type: GraphQLID},
        author: {
            type: AuthorType,
            async resolve(parent, args) {
                if (parent.author.account === 'guard') {
                    return await queries.findGuardByGuardId(parent.author.id).then(guard => {
                        return {
                            username: `${guard.first_name} ${guard.last_name}`,
                            profile_picture: guard.profile_picture
                        }
                    })
                } else if (parent.author.account === 'admin') {
                    return {
                        username: 'Administrator',
                        profile_picture: 'default.jpg'
                    }
                }
            }
        },
        body: {type: GraphQLString},
        replies: {
            type: new GraphQLList(MessageReplies)
        },
        timestamp: {type: GraphQLString},
        approved: {type: GraphQLBoolean},
        message_type: {type: GraphQLString},
        title: {type: GraphQLString}
    })
})
// const ReportType = new GraphQLObjectType({
//     name: 'Report',
//     fields: () => ({
//         id: {type: GraphQLID},
//         guard_id: {
//             type: GuardType,
//             async resolve(parent, args) {
//                 return await queries.findGuardByGuardId(parent.guard_id)
//             }
//         },
//         report: {type: GraphQLString},
//         timestamp: {type: GraphQLString},
//     })
// })
const MessageReplies = new GraphQLObjectType({
    name: 'MessageReplies',
    fields: () => ({
        id: {type: GraphQLID},
        author: {
            type: AuthorType,
            async resolve(parent, args) {
                if (parent.author.account === 'guard') {
                    return await queries.findGuardByGuardId(parent.author.id).then(guard => {
                        return {
                            username: `${guard.first_name} ${guard.last_name}`,
                            profile_picture: guard.profile_picture
                        }
                    })
                } else if (parent.author.account === 'admin') {
                    return {
                        username: 'Administrator',
                        profile_picture: 'default.jpg'
                    }
                }
            }
        },
        body: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const AuthorType = new GraphQLObjectType({
    name: 'Author',
    fields: () => ({
        username: {type: GraphQLString},
        profile_picture: {
            type: GraphQLString,
        },
    })
})
const AttendanceRegister = new GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: {type: GraphQLID},
        guard_id: {type: GraphQLInt},
        signin: {type: GraphQLString},
        signout: {type: GraphQLString},
        date: {type: GraphQLString},
    })
})
const TokenType = new GraphQLObjectType({
    name: 'Token',
    fields: () => ({
        ok: {type: GraphQLBoolean},
        token: {type: GraphQLString},
        error: {type: GraphQLString}
    })
})
const ExistsType = new GraphQLObjectType({
    name: 'Exists',
    fields: () => ({
        exists: {type: GraphQLBoolean},
    })
})
const UploadProfilePictureType = new GraphQLObjectType({
    name: 'UpdloadProfilePicture',
    fields: () => ({
        uploaded: {type: GraphQLBoolean},
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        person: {
            type: AdminType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findUser({id: args.id})
            }
        },
        people: {
            type: new GraphQLList(AdminType),
            resolve: () => {
                return queries.findAllUsers()
            }
        },
        locations: {
            type: new GraphQLList(LocationType),
            resolve: () => {
                return queries.findAllLocations()
            }
        },
        findGuardsInLocation: {
            type: new GraphQLList(GuardType),
            args: {id: {type: GraphQLID}},
            async resolve(parent, args, ctx) {
                return await queries.findGuardsInLocation(args.id)
            }
        },
        getInbox: {
            type: new GraphQLList(MessageType),
            args: {guard_id: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.getInbox(args.guard_id)
            }
        },
        getAllInbox: {
            type: new GraphQLList(MessageType),
            resolve(parent, args) {
                return queries.getAllInbox()
            }
        },
        getAllGuards: {
            type: new GraphQLList(GuardType),
            resolve(parent, args) {
                return queries.getAllGuards()
            }
        },
        getAllLocations: {
            type: new GraphQLList(LocationType),
            resolve(parent, args) {
                return queries.getAllLocations()
            }
        },
        getMessage: {
            type: MessageType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.getMessage(args.id)
            }
        },
        getGuardAttendance: {
            type: new GraphQLList(AttendanceRegister),
            args: {guard_id: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.getGuardAttendance(args.guard_id)
            }
        },
        getAllGuardsAttendance: {
            type: new GraphQLList(AttendanceRegister),
            resolve(parent, args) {
                return queries.getAllGuardsAttendance()
            }
        },
        getGuardInfo: {
            type: GuardType,
            args: {guard_id: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.getGuardInfo(args.guard_id)
            }
        },
        getGuardPaymentInfo: {
            type: SalaryType,
            args: {guard_id: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.getGuardPaymentInfo(args.guard_id)
            }
        },
        getGuardContactInfo: {
            type: GuardType,
            args: {guard_id: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.getGuardContactInfo(args.guard_id)
            }
        },
        confirmPassword: {
            type: PasswordType,
            args: {
                guard: {type: GraphQLID},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await queries.getPassword(args.guard).then(password => {
                    if (bcrypt.compareSync(args.password, password.password)) {
                        return {
                            confirmed: true,
                        }
                    }
                    return {
                        confirmed: false,
                    }
                })
            }
        },
    }
})
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        login: {
            type: TokenType,
            args: {
                email: {type: GraphQLString},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await authentication.login(args).then(login => {
                    return login
                })

            }
        },
        isUserExists: {
            type: ExistsType,
            args: {
                email: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.isUserExists(args).then(person => {
                    return {exists: !!person}

                })

            }
        },
        isLocationExists: {
            type: ExistsType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.isLocationExists(args).then(location => {
                    return {exists: !!location}

                })

            }
        },
        signup: {
            type: AdminType,
            args: {
                username: {type: GraphQLString},
                email: {type: GraphQLString},
                password: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.signup(args).then(person => {
                    return person
                })
            }
        },
        registerGuard: {
            type: GuardType,
            args: {
                guard_id: {type: GraphQLInt},
                surname: {type: GraphQLString},
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                dob: {type: GraphQLString},
                gender: {type: GraphQLString},
                nationalID: {type: GraphQLInt},
                employment_date: {type: GraphQLString},
                password: {type: GraphQLString},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
                postal_address: {type: GraphQLString},
                location: {type: GraphQLID},
                contract: {type: GraphQLString},
                gross: {type: GraphQLInt},
                paye: {type: GraphQLInt},
                nssf: {type: GraphQLInt},
                nhif: {type: GraphQLInt},
                loans: {type: GraphQLInt},
                others: {type: GraphQLInt},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerGuard(args)
            }
        },
        updateGuardBasicInfo: {
            type: GuardType,
            args: {
                id: {type: GraphQLID},
                guard_id: {type: GraphQLString},
                surname: {type: GraphQLString},
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                dob: {type: GraphQLString},
                gender: {type: GraphQLString},
                nationalID: {type: GraphQLInt},
                employment_date: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await queries.updateGuardBasicInfo(args)
            }
        },
        updateGuardContactInfo: {
            type: GuardType,
            args: {
                id: {type: GraphQLID},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
                postal_address: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.updateGuardContactInfo(args)
            }
        },
        addLocation: {
            type: LocationType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addLocation(args).then(location => {
                    return location
                })
            }
        },
        updateLocation: {
            type: LocationType,
            args: {
                id: {type: GraphQLID},
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.updateLocation(args)
            }
        },

        uploadProfilePicture: {
            type: GuardType,
            args: {
                guard: {type: GraphQLID},
                file: {type: GraphQLUpload},
            },
            async resolve(parent, args, ctx) {
                return await processProfilePicture(args.file, args.guard)
            }

        },
        signin: {
            type: AttendanceRegister,
            args: {
                guard_id: {type: GraphQLInt},
                signin: {type: GraphQLString},
                date: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.signin(args)
            }

        },
        signout: {
            type: AttendanceRegister,
            args: {
                guard_id: {type: GraphQLInt},
                signout: {type: GraphQLString},
                date: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.signout(args)
            }
        },
        newMessage: {
            type: MessageType,
            args: {
                author: {type: GraphQLString},
                body: {type: GraphQLString},
                account_type: {type: GraphQLString},
                message_type: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.newMessage(args)
            }
        },
        newCustomMessage: {
            type: MessageType,
            args: {
                author: {type: GraphQLString},
                body: {type: GraphQLString},
                account_type: {type: GraphQLString},
                message_type: {type: GraphQLString},
                title: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.newCustomMessage(args)
            }
        },
        newMessageReply: {
            type: MessageReplies,
            args: {
                message: {type: GraphQLID},
                author: {type: GraphQLString},
                account: {type: GraphQLString},
                body: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.newMessageReply(args)
            }
        },
        changePassword: {
            type: PasswordType,
            args: {
                guard: {type: GraphQLID},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await queries.getPassword(args.guard).then(password => {
                    if (bcrypt.compareSync(args.password, password.password)) {
                        return {
                            confirmed: true,
                        }
                    }
                    return {
                        confirmed: false,
                    }
                })
            }
        },
    },

})

module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})