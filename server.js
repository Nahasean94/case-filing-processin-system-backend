const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-bodyparser')
const serve = require('koa-static-server')
const cors = require('koa2-cors')
const {graphqlKoa, graphiqlKoa} = require('apollo-server-koa')
const schema = require('./api/graphql_schema')
const {apolloUploadKoa} = require('apollo-upload-server')

const app = new Koa()
const router = new Router()
app.use(serve({rootDir: 'public', path: '/public'}))

// koaBody is needed just for POST.
router.post('/graphql', koaBody(), apolloUploadKoa(),
    (context, next) => graphqlKoa({
        schema,
        context,
    })(context, next),
)
router.get('/graphql', graphqlKoa({schema: schema, context: app.context}))

router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}))

app.use(cors())
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(8080, () => console.log("Server started on port 8080"))
