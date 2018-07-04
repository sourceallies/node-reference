const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const app = new Koa();

app.use(bodyParser());
app.use(buildRouter().routes());
app.listen(3000);

function buildRouter() {
    const router = new Router();
    router.get('/hello', require('./hello'));
    return router;
}