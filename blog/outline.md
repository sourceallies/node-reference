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

Congratulations, we now have a very simple NodeJS api running locally. You should be able to make a request to http://localhost:3000/hello and see the JSON response. Remember to commit your changes.

## Dockertize 

Now that we have a simple application running locally we need to figure out a way to package and deploy it to other machines (i.e. Development and Production). We could install NodeJS on a machine and copy the code there. But, we would have to make sure it was the right version of NodeJS. We would have to make sure the packages we depend on (ex. Koa) were installed. And, we would have to modify these things when we upgrade them. This process can be error-prone and time consuming.

Java partially solved this problem by creating a WAR. This was a zip file with a special directory structure that stored the application code as well as dependencies. [Docker](https://www.docker.com) takes this idea further to package up an entire "container" or lightweight virtual machine into a single item that can be pushed to a repository. This allows us confidence not only that deployments to servers are consistent and reliable but also that other developers can easily run our application locally.

Start by creating a file named `Dockerfile` in the root of the project with these contents:
```Dockerfile
# Start from this image on https://hub.docker.com (the public docker repo)
# This gives us a known starting point to configure from for each build
FROM node:9.2.1-alpine

# Let docker know that our app is listening on port 3000 when it runs
EXPOSE 3000

# This just sets the current directory so we don't have to put '/app' everywhere
WORKDIR /app

# copy these files from our local workspace into the container (they will end up in /app)
COPY package*.json ./

# install npm packages. This is exactly the same as running it on our local workstation but is running inside the container so will install packages there.
RUN npm install

# Copy everything else (i.e. Code) into the container from our local workspace
COPY . .

# set the startup command to npm start so when our container runs we start up the server
# this is way easier then configuring some sort of system daemon
CMD [ "npm", "start" ]
```

We don't want to copy in the `node_modules` from our workstation since it is going to be installed within the container. To prevent the `COPY . .` command from picking it up, create a `.dockerignore` file with this line:
```
node_modules
```

That's all there is to it. Run this command to build the image:
```Bash
docker build --tag node-ref .
```

The image can be started locally by running:
```Bash
docker run --publish 3000:3000 node-ref
```

You should be able to make a request to http://localhost:3000/hello and see the same response as earlier.

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