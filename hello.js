
module.exports = async function hello(ctx) {
    ctx.status = 200;
    ctx.body = {
        message: 'hello'
    };
};