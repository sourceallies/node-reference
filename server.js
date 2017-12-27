const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

process.env.AWS_XRAY_DEBUG_MODE=true;
//required to init XRay
const AWSXRay = require('aws-xray-sdk');
const XRayMiddleware = require('./XRayMiddleware');

const app = new Koa();

app.use(XRayMiddleware.trackRequests('ProductService-localhost'));
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
    router.get('/products', require('./products/getProductList'));
    router.post('/products', require('./products/postProduct'));
    return router;
}