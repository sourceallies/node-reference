## Intro

## Hello koa 
The first order of business is to deploy what we could call a "Canary". This is an inital version of the application that lacks business functionality but can be deployed all the way to production to test the build process, deployment pipeline, access, security setup and monitoring. By focusing on these technical tasks before building functionality, troubleshooting issues when they arrive will be simpler. It also removes the need to "fit in" these best practices later in the project.

To start, create a [Github repository](https://github.com) and check it out locally. From the command line, cd into the directory and run:
```Bash
echo 'node_modules' >> .gitignore
npm init
```
Respond to the questions however you wish.

While we could create an HTTP server using the raw NodeJS APIs, like most languages, it is much easier to use a library that will handle request routing and other low lever HTTP concerns for us. For this purpose I have choosen [Koa](http://koajs.com). I started by looking at [Express](https://expressjs.com) which was one of the first such libraries to gain popularity and is still probably the most popular by downloads. However, in order to make unit testing simpler and handler methods easier to read, I wanted a library that would allow me to return a `Promise` so that I could leverage async/await rather than callbacks. [HAPI](https://hapijs.com) is also another good option. Run the following command to install Koa and save it into your package.json file 

```Bash
npm install --save koa
```

Next, create a file called `server.js` with the following content:
```Javascript
const Koa = require('koa');

const app = new Koa();

async function sayHello(ctx) {
    ctx.body = 'Hello World';
}

app.use(sayHello);
app.listen(3000);
```

If we set the "start script" in `package.json` as follow, we can start the server with `npm start`:
```JSON
{
    "scripts": {
        "start": "node server.js"
    }
    ...
}
```

Start the server with either `npm start` or `node server.js` and make an HTTP request to http://localhost:3000 and you should see some text back. We now have a working HTTP server.

Next we need to add some sort of request routing to decouple HTTP handlers from each other. Koa uses the practice of having several small, separate npm packages for different purposes so that only needed functionality is installed. For routing, install the [koa-router](https://www.npmjs.com/package/koa-router) package (Using the same process as above).

Next, let's extract our hello world controller into a standalone module and modifiy it to return a JSON payload. Place the following into `hello.js`:

```Javascript
module.exports = async function Hello(ctx) {
    ctx.body = {
        message: 'Hello World'
    };
};
```

Now modify `server.js` to use the koa-router package:
```Javascript
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();

app.use(buildRouter().routes());
app.listen(3000);

function buildRouter() {
    const router = new Router();
    router.get('/hello', require('./hello'));
    return router;
}
```

We can add additional routes to this file as needed and it provides an easy one-stop-shop place for future developers to find out what code is executing for a given URL.

Congratulations, we now have a very simple NodeJS api running locally. Remember to commit your changes.

## Dockertize 
## Cloudformation intro
## Continuous building via code pipeline
## Docker repo
## Fargate deployment
## Add an alb 
## SSL/dns
## Cognito setup
## Adding authentication
## Add unit testing
## Add model validation
## Add DynamoDB
## Create put test/endpoint
## Add e2e smoke test
## Tie smoke test to deploy
## Add xray
## Add listing
## Add get by Id 
## Add delete
## Add patch
## Add change event/topic