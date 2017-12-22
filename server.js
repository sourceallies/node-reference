const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();

app.use(bodyParser());
app.use(buildRouter().routes());

app.listen(3000);

function buildRouter() {
    const router = new Router();
    router.get('/products', require('./products/getProductList'));
    router.post('/products', require('./products/postProduct'));
    return router;
}