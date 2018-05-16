const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

process.env.AWS_XRAY_DEBUG_MODE = true;
process.env.DEBUG = 'jwks';

const trackRequests = require('./common/trackRequests');

const app = new Koa();

app.use(trackRequests('ProductService-localhost'));
// app.use(setupAuthentication()
//     .unless({path: '/hello'})
// );

app.use(bodyParser());
app.use(buildRouter().routes());

app.listen(3000);

function healthCheck(ctx) {
    ctx.body = {
        message: "healthy"
    };
}

function buildRouter() {
    const router = new Router();
    router.get('/', healthCheck)
    router.get('/products', require('./products/listProducts'));
    router.post('/products', require('./products/createProduct'));
    router.get('/products/:id', require('./products/getProductById'));
    router.delete('/products/:id', require('./products/deleteProduct'));
    router.patch('/products/:id', require('./products/updateProduct'));
    return router;
}

function setupAuthentication() {
    const jwt = require('koa-jwt');
    const jwksRsa = require('jwks-rsa');

    return jwt({
        secret: jwksRsa.koaJwtSecret({
            cache: true,
            jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XsX7u4CWq/.well-known/jwks.json'
        }),
        algorithms: ['RS256']
    });
}