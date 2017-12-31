const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

process.env.AWS_XRAY_DEBUG_MODE=true;
const trackRequests = require('./common/trackRequests');

const app = new Koa();

app.use(trackRequests('ProductService-localhost'));
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
    return router;
}