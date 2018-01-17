
process.env.AWS_XRAY_DEBUG_MODE = true;
process.env.DEBUG = 'jwks';

const Hapi = require('hapi');

const server = Hapi.server({ 
    port: 3000
});

const listProducts = require('./products/listProducts');
console.log(listProducts);
server.route(listProducts);

// const trackRequests = require('./common/trackRequests');

//app.use(trackRequests('ProductService-localhost'));
//app.use(setupAuthentication());
//app.use(bodyParser());
//app.use(buildRouter().routes());

server.start();

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
    return router;
}

function setupAuthentication() {
    const jwt = require('koa-jwt');
    const jwksRsa = require('jwks-rsa');

    return jwt({
        secret: jwksRsa.koaJwtSecret({
            cache: true,
            jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xi3tvroaZ/.well-known/jwks.json'
        }),
        algorithms: ['RS256']
    });
}