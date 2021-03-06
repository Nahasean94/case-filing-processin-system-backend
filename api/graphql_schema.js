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

var request = require('sync-request')
const btoa = require('btoa')

//Store the upload
const storeFS = ({stream, filename}, id) => {
    const uploadDir = `./public/uploads`

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
const processUpload = async (upload, type_of_form,) => {
    const id = shortid.generate()
    const {stream, filename,} = await upload
    const path = `${id}-${filename}`
    return await storeFS({stream, filename}, id).then(() =>
        queries.addNewForm(type_of_form, path))
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
const CaseTypeType = new GraphQLObjectType({
    name: 'CaseType',
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
const CombinedPlaintiffType = new GraphQLObjectType({
    name: 'CombinedPlaintiff',
    fields: () => ({
        id: {type: GraphQLID},
        email: {type: GraphQLString},
        name: {type: GraphQLString},
        gender: {type: GraphQLString},
        cellphone: {type: GraphQLString},
        timestamp: {type: GraphQLString},
        dob: {type: GraphQLString},
    })
})
const PlaintiffType = new GraphQLObjectType({
    name: 'Plaintiff',
    fields: () => ({
        party_type: {
            type: GraphQLString
        },
        party_id: {
            type: CombinedPlaintiffType,
            async resolve(parent) {
                if (parent.party_type === 'individual') {
                    return await queries.findIndividual(parent.party_id)
                }
                return await queries.findOrganization(parent.party_id)
            }

        },
    })
})
const ServeType=new GraphQLObjectType({
    name: 'Serve',
    fields: () => ({
        text: {
            type: GraphQLString
        },
        timestamp:  {
            type: GraphQLString
        },
    })
})
const DefendantType = new GraphQLObjectType({
    name: 'Defendant',
    fields: () => ({
        party_type: {type: GraphQLString},
        name: {type: GraphQLString},
        email: {type: GraphQLString},
        cellphone: {type: GraphQLString},
        served:{type:ServeType}


    })
})
const CaseNumberType = new GraphQLObjectType({
    name: 'CaseNumber',
    fields: () => ({
        prefix: {type: GraphQLInt},
        suffix: {type: GraphQLInt},
    })
})
const CaseType = new GraphQLObjectType({
    name: 'Case',
    fields: () => ({
        id: {type: GraphQLID},
        title: {type: GraphQLString},
        description: {type: GraphQLString},
        plaintiff: {type: PlaintiffType},
        defendant: {type: DefendantType},
        case_number: {type: CaseNumberType},
        court_station: {
            type: CourtStationType,
            async resolve(parent) {
                return await queries.findCourtStation(parent.court_station)
            }
        },
        case_type: {
            type: CaseTypeType,
            async resolve(parent) {
                return await queries.findCaseType(parent.case_type)
            }
        },
        case_category: {
            type: CaseCategoryType,
            async resolve(parent) {
                return await queries.findCaseCategory(parent.case_category)
            }
        },
        form: {
            type: FormType,
            async resolve(parent) {
                return await queries.findForm(parent.form)
            }
        },
        payment: {
            type: TransactionsType,
            async resolve(parent) {
                return await queries.findTransactions(parent.payment)
            }
        },
        judge: {type: GraphQLString},
        verdict: {type: VerdictType},
        timestamp: {type: GraphQLString},
        registrar_approval: {type: GraphQLBoolean},
        advocate: {
            type: AdvocateType,
            async resolve(parent) {
                return await queries.findAdvocate(parent.advocate)
            }
        },
        hearing: {
            type: HearingType        },
    })
})
const IndividualType = new GraphQLObjectType({
    name: 'Individual',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const OrganizationType = new GraphQLObjectType({
    name: 'Organization',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const IndividualDefendantType = new GraphQLObjectType({
    name: 'IndividualDefendant',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const OrganizationDefendantType = new GraphQLObjectType({
    name: 'OrganizationDefendant',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const VerdictType = new GraphQLObjectType({
    name: 'Verdict',
    fields: () => ({
        id: {type: GraphQLID},
        ruling: {type: GraphQLString},
        date: {type: GraphQLString},
        timestamp: {type: GraphQLString},
    })
})
const HearingType = new GraphQLObjectType({
    name: 'Hearing',
    fields: () => ({
        text: {type: GraphQLID},
        date: {type: GraphQLString},
        judge: {type: GraphQLString},
    })
})
const TransactionsType = new GraphQLObjectType({
    name: 'Transactions',
    fields: () => ({
        id: {type: GraphQLID},
        fee: {type: GraphQLInt},
        timestamp: {type: GraphQLString},
    })
})
const FormFeeStructureType = new GraphQLObjectType({
    name: 'FormFeeStructure',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        fee: {type: GraphQLString},
    })
})
const FormType = new GraphQLObjectType({
    name: 'Form',
    fields: () => ({
        id: {type: GraphQLID},
        type_of_form: {
            type: FormFeeStructureType,
            async resolve(parent) {
                return await queries.findFormFeeStructure(parent.type_of_form)
            }
        },
        path: {type: GraphQLString},
    })
})
const MpesaType = new GraphQLObjectType({
    name: 'Mpesa',
    fields: () => ({
        MerchantRequestID: {type: GraphQLString},
        CheckoutRequestID: {type: GraphQLString},
        ResponseCode: {type: GraphQLString},
        ResponseDescription: {type: GraphQLString},
        CustomerMessage: {type: GraphQLString},
    })
})
const PaymentType = new GraphQLObjectType({
    name: 'Payment',
    fields: () => ({
        payment_id: {type: GraphQLString},
        merchant_id: {type: GraphQLString},
        phone_no: {type: GraphQLString},
        amount_paid: {type: GraphQLString},
        result_code: {type: GraphQLString},
        result_description: {type: GraphQLString},
        mpesa_refno: {type: GraphQLString},
        transaction_date: {type: GraphQLString},
        checkout_id: {type: GraphQLString},
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
        findPendingCases: {
            type: new GraphQLList(CaseType),
            args: {advocate: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findPendingCases(args.advocate)
            }
        },
        findCaseForms: {
            type: new GraphQLList(FormFeeStructureType),
            resolve(parent, args) {
                return queries.findCaseForms()
            }
        },
        findServedCases: {
            type: CaseType,
            args: {prefix: {type: GraphQLInt}},
            resolve(parent, args, ctx) {
                const {id} = authentication.authenticate(ctx)
                return queries.findServedCases(id, args.prefix)
            }
        },
        findCourtPendingCases: {
            type: new GraphQLList(CaseType),
            args: {court_station: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findCourtPendingCases(args.court_station)
            }
        },
        findCaseInfo: {
            type: CaseType,
            args: {id: {type: GraphQLID}},
            resolve(parent, args) {
                return queries.findCaseInfo(args.id)
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
            type: new GraphQLList(FormFeeStructureType),
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
            type: new GraphQLList(CaseTypeType),
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
        makeMpesaPayment: {
            type: MpesaType,
            args: {phone_number: {type: GraphQLLong}},
            resolve(parent, args, ctx) {

let res
                function pad2(n) {
                    return n < 10 ? '0' + n : n
                }

                var date = new Date()

                const timestamp = date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds())

                const password = btoa(174379 + "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" + timestamp)


                const auth = "Bearer WbfhDAP3G6MBQrrPgMYCUSFOGsJB"


                const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

                 const pay=request('POST',url,
                    {
                        headers: {
                            "Authorization": auth
                        },
                        json: {
                            "BusinessShortCode": "174379",
                            "Password": password,
                            "Timestamp": timestamp,
                            "TransactionType": "CustomerPayBillOnline",
                            "Amount": "1",
                            "PartyA": "600342",
                            "PartyB": "174379",
                            "PhoneNumber": args.phone_number,
                            "CallBackURL": "https://classmite.com/mpesa_response.php",
                            "AccountReference": "CaseFiling",
                            "TransactionDesc": "This transaction is to pay for forms for ejudiciary"
                        }
                    },

                )
                return JSON.parse(pay.getBody('utf8'))



            }

        },
        confirmPayment: {
            type: PaymentType,
            args: {checkout_id: {type: GraphQLString}},
          async  resolve(parent, args, ctx) {
                const url = "https://classmite.com/confirm_payment.php"
              const pay=request('POST',url,
                  {
                        json: {
                            "checkout_id": args.checkout_id
                        }
                    }
                )
              return JSON.parse(pay.getBody('utf8'))

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
            type: CaseTypeType,
            args: {
                name: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addCaseType(args)
            }
        },
        addFormFeeStructure: {
            type: FormFeeStructureType,
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
        addNewForm: {
            type: FormType,
            args: {
                type_of_form: {type: GraphQLID},
                file: {type: GraphQLUpload}
            },
            async resolve(parent, args, ctx) {
                return await processUpload(args.file, args.type_of_form)
            }
        },
        addOrganization: {
            type: OrganizationType,
            args: {
                name: {type: GraphQLString},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
            },
            async resolve(parent, args, ctx) {
                return await queries.addOrganization(args)
            }
        },
        addIndividual: {
            type: IndividualType,
            args: {
                name: {type: GraphQLString},
                email: {type: GraphQLString},
                cellphone: {type: GraphQLLong},
                gender: {type: GraphQLString},
                dob: {type: GraphQLString},
            },
            async resolve(parent, args, ctx) {
                return await queries.addIndividual(args)
            }
        },
        makePayment: {
            type: TransactionsType,
            args: {
                fee: {type: GraphQLInt},
            },
            async resolve(parent, args, ctx) {
                return await queries.makePayment(args.fee)
            }
        },
        addNewCase: {
            type: CaseType,
            args: {
                title: {type: GraphQLString},
                description: {type: GraphQLString},
                court_station: {type: GraphQLID},
                case_type: {type: GraphQLID},
                case_category: {type: GraphQLID},
                defendant_party_type: {type: GraphQLString},
                defendant_name: {type: GraphQLString},
                defendant_email: {type: GraphQLString},
                defendant_cellphone: {type: GraphQLLong},
                plaintiff: {type: GraphQLID},
                plaintiff_type: {type: GraphQLString},
                form: {type: GraphQLID},
                payment: {type: GraphQLID},
            },
            async resolve(parent, args, ctx) {
                const {id} = await authentication.authenticate(ctx)
                return await queries.addCase(args, id)
            }
        },
        serveDefendant: {
            type: CaseType,
            args: {
                id: {type: GraphQLID},
                message: {type: GraphQLString}
            },
            async  resolve(parent, args, ctx) {
                return queries.serveDefendant(args.id,args.message)

            }
        },
        addHearingInfo: {
            type: CaseType,
            args: {
                id: {type: GraphQLID},
                date: {type: GraphQLString},
                judge: {type: GraphQLString}
            },
            async  resolve(parent, args, ctx) {
                return queries.addHearingInfo(args)

            }
        }

    },

})

module.exports = new GraphQLSchema({query: RootQuery, mutation: Mutation})