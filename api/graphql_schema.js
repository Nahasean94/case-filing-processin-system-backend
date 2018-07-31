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
const CourtStaffSchema = new GraphQLObjectType({
    name: 'CourtStaff',
    fields: () => ({
        id: {type: GraphQLID},
        username: {type: GraphQLString},
        role: {type: GraphQLString},
        court_station: {
            type: CourtStationType,
            async resolve(parent) {
                return await queries.findCourtStation(parent.court_station)
            }
        },
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
const CourtStationType = new GraphQLObjectType({
    name: 'CourtStation',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const CaseCategoryType = new GraphQLObjectType({
    name: 'CaseCategory',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const CaseType = new GraphQLObjectType({
    name: 'CaseType',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})

const FormFeeStructureSchema = new GraphQLObjectType({
    name: 'FormFeeStructure',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        fee: {type: GraphQLInt},
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
                return queries.adminExists().then(admin => {
                    if (admin.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isCourtStationExists: {
            type: ExistsType,
            args: {name: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.isCourtStationExists(args).then(court_station => {
                    if (court_station.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isCourtAdminExists: {
            type: ExistsType,
            args: {court_station: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.isCourtAdminExists(args).then(court_station => {
                    if (court_station) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isDeputyRegistrarExists: {
            type: ExistsType,
            args: {court_station: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.isDeputyRegistrarExists(args).then(court_station => {
                    if (court_station) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isCourtAssistantExists: {
            type: ExistsType,
            args: {court_station: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.isCourtAssistantExists(args).then(court_station => {
                    if (court_station) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        courtStations: {
            type: new GraphQLList(CourtStationType),
            resolve(parent, args) {
                return queries.courtStations()
            }
        },

        formFeeStructures: {
            type: new GraphQLList(FormFeeStructureSchema),
            resolve(parent, args) {
                return queries.formFeeStructures()
            }
        },
        isFormFeeStructureExists: {
            type: ExistsType,
            args: {name: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.isFormFeeStructureExists(args).then(court_station => {
                    if (court_station.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isCaseCategoryExists: {
            type: ExistsType,
            args: {name: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.isCaseCategoryExists(args).then(court_station => {
                    if (court_station.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
            }
        },
        isCaseTypeExists: {
            type: ExistsType,
            args: {name: {type: GraphQLString}},
            resolve(parent, args) {
                return queries.isCaseTypeExists(args).then(case_type => {
                    if (case_type.length > 0) {
                        return {exists: true}
                    }
                    return {
                        exists: false
                    }
                })
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

        caseCategories: {
            type: new GraphQLList(CaseType),
            resolve(parent, args) {
                return queries.caseCategories()
            }
        },
        caseTypes: {
            type: new GraphQLList(CaseCategoryType),
            resolve(parent, args) {
                return queries.caseTypes()
            }
        },
        getCourtAssistant: {
            type: CourtStaffSchema,
            args: {
                court_station: {type: GraphQLID},
            },
            resolve(parent, args) {
                return queries.getCourtAssistant(args.court_station)
            }
        },
        getDeputyRegistrar: {
            type: CourtStaffSchema,
            args: {
                court_station: {type: GraphQLID},
            },
            resolve(parent, args) {
                return queries.getDeputyRegistrar(args.court_station)
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
        courtAdminLogin: {
            type: TokenType,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID}
            },
            async resolve(parent, args, ctx) {
                return await authentication.courtAdminLogin(args)
            }
        },

        deputyRegistrarLogin: {
            type: TokenType,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID}
            },
            async resolve(parent, args, ctx) {
                return await authentication.deputyRegistrarLogin(args)
            }
        },
        courtAssistantLogin: {
            type: TokenType,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID}
            },
            async resolve(parent, args, ctx) {
                return await authentication.courtAssistantLogin(args)
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
        registerCourtAdmin: {
            type: CourtStaffSchema,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerCourtAdmin(args)
            }
        },
        registerDeputyRegistrar: {
            type: CourtStaffSchema,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerDeputyRegistrar(args)
            }
        },
        registerCourtAssistant: {
            type: CourtStaffSchema,
            args: {
                username: {type: GraphQLString},
                password: {type: GraphQLString},
                court_station: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                return await queries.registerCourtAssistant(args)
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
        addCourtStation: {
            type: CourtStationType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addCourtStation(args)
            }
        },
        addCaseCategory: {
            type: CaseCategoryType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addCaseCategory(args)
            }
        },
        addCaseType: {
            type: CaseType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addCaseType(args)
            }
        },
        addFormFeeStructure: {
            type: FormFeeStructureSchema,
            args: {
                name: {type: GraphQLString},
                fee: {type: GraphQLInt},
            },
            async resolve(parent, args, ctx) {
                return await queries.addFormFeeStructure(args)
            }
        },
        updateCourtStation: {
            type: CourtStationType,
            args: {
                id: {type: GraphQLID},
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.updateCourtStation(args)
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