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
const storeFS = ({stream, filename}, id, uploader) => {
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
        timestamp: {type: GraphQLString},
    })
})
const AdvocateType = new GraphQLObjectType({
    name: 'Advocate',
    fields: () => ({
        id: {type: GraphQLID},
        surname: {type: GraphQLString},
        email: {type: GraphQLString},
        profile_picture: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        practice_number: {type: GraphQLInt},
        first_name: {type: GraphQLString},
        last_name: {type: GraphQLString},
        dob: {type: GraphQLString},
        gender: {type: GraphQLString},
        password: {type: GraphQLString},
        cellphone: {type: GraphQLLong},
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
        practice_number: {type: GraphQLInt},
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
                    return await queries.findAdvocateByAdvocateId(parent.author.id).then(guard => {
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
//         practice_number: {
//             type: AdvocateType,
//             async resolve(parent, args) {
//                 return await queries.findAdvocateByAdvocateId(parent.practice_number)
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
                    return await queries.findAdvocateByAdvocateId(parent.author.id).then(guard => {
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
        practice_number: {type: GraphQLInt},
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
        adminExists: {
            type: ExistsType,
            resolve(parent, args) {
                return queries.aadminExists().then(admin => {
                    if (admin.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
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
                username: {type: GraphQLString},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await authentication.login(args).then(login => {
                    return login
                })

            }
        },
        advocateLogin: {
            type: TokenType,
            args: {
                practice_number: {type: GraphQLInt},
                password: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await authentication.advocateLogin(args)

            }
        },
        isAdvocateExists: {
            type: ExistsType,
            args: {
                practice_number: {type: GraphQLInt},
            },
            async resolve(parent, args, ctx) {
                return await queries.isAdvocateExists(args).then(person => {
                    return {exists: !!person}
                })
            }
        },


        registerAdmin: {
            type: AdminType,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerAdmin(args)
            }
        },
        registerAdvocate: {
            type: AdvocateType,
            args: {
                practice_number: {type: GraphQLInt},
                surname: {type: GraphQLString},
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                dob: {type: GraphQLString},
                gender: {type: GraphQLString},
                password: {type: GraphQLString},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerAdvocate(args)
            }
        },
        updateAdvocateBasicInfo: {
            type: AdvocateType,
            args: {
                id: {type: GraphQLID},
                practice_number: {type: GraphQLString},
                surname: {type: GraphQLString},
                first_name: {type: GraphQLString},
                last_name: {type: GraphQLString},
                dob: {type: GraphQLString},
                gender: {type: GraphQLString},
                nationalID: {type: GraphQLInt},
                employment_date: {type: GraphQLString}
            },
            async resolve(parent, args, ctx) {
                return await queries.updateAdvocateBasicInfo(args)
            }
        },
        updateAdvocateContactInfo: {
            type: AdvocateType,
            args: {
                id: {type: GraphQLID},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
                postal_address: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.updateAdvocateContactInfo(args)
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
            type: AdvocateType,
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
                practice_number: {type: GraphQLInt},
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
                practice_number: {type: GraphQLInt},
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