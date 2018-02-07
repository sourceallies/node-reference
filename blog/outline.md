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

In order to manage the infrastructure and deployments we will be leveraging [Cloudformation](https://aws.amazon.com/cloudformation/). By using this tool we can declaratively what components our infrastructure requires and how they relate to each other. I highly recommend using YAML for all templates for these reasons:
- Template functions (ex. Ref and GetAtt) are much easier to read
- Comments are supported. Sometimes a parameter has to be set to a specific number or magic value and can be useful to explain to those making future changes why.
- Multiline values are easy to specify
- It is a lot more concise. Templates can become quite lengthy.

## Continuous building via code pipeline

Not only are we going to manage our application environments with Cloudformation but also our deployment pipeline. [Code Pipeline](https://aws.amazon.com/codepipeline/) (Not to be confused with Code Deploy) is the Continuious Integration and Continuious Deployment offering from AWS. There are a lot of options to handle this task but I prefer code pipeline because all it requires is an AWS account to get started so we don't have to worry about integrating other tools.

Start by creating a simple `pipeline.template.yml` file with the following content:

```yml
AWSTemplateFormatVersion: "2010-09-09"
Description: Pipeline for Product Service
Parameters:
  RepoToken:
    Type: String
    NoEcho: true
    Description: OAuth Token for the github repository
Resources:
  ArtifactStorage:
    Type: "AWS::S3::Bucket"
```

Before executing the above template, log into your [GitHub](https://github.com) account and go to Settings -> Developer Settings -> Personal Access Tokens and create a personal access token. Save this token in a safe place for now (Don't check it into verison control). We will need it in the next step.

Deploy the stack by running the following command, substituting your Github token:

```Bash
aws cloudformation deploy \
    --stack-name=ProductService-Pipeline \
    --template-file=pipeline.template.yml \
    --parameter-overrides \
        RepoToken='repo-token'
```

It isn't much yet (Just an S3 bucket). I like to deploy cloudformation templates with minimal changes between deploys so that a failed deploy will only rollback a small change and identifying the source of the failure is easier. We need an S3 bucket to store "artifacts". Specifically the source code and outputs of the builds.

Next, we will add a Role to the template. We will configure Code Pipeline, Code Build and Cloudformation to assume this role when they execute. Because of this, we need to ensure the role as the appropriate permissions to build and deploy our project as well as grant these services the ability to assume the role. If we had specific compliance needs or multi account needs we could specify multiple roles or even specify role ARNs from a different account.

Add this under Resources:
```yml
PipelineRole:
  Type: "AWS::IAM::Role"
  Properties:
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: "Allow"
          Action: "sts:AssumeRole"
          Principal:
            Service: "codebuild.amazonaws.com"
        - Effect: "Allow" 
          Action: "sts:AssumeRole"
          Principal:
            Service: "codepipeline.amazonaws.com"
        - Effect: "Allow" 
          Action: "sts:AssumeRole"
          Principal:
            Service: "cloudformation.amazonaws.com"
    ManagedPolicyArns:
      - "arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess"
      - "arn:aws:iam::aws:policy/AdministratorAccess"
```

Next we can update our stack by running our deploy command again. This time we won't sepecify the RepoToken parameter so cloudformation uses the previous value and we need to pass CAPABILITY_IAM so we are allowed to create a Role:

```Bash
aws cloudformation deploy \
    --stack-name=ProductService-Pipeline \
    --template-file=pipeline.template.yml \
    --capabilities CAPABILITY_IAM
```

From this point on we can use the above command to update our pipeline stack as needed.

We need a place to store our Docker images. We probably don't want to push them to the public Docker Hub and since we're trying to keep things simple we can create an ECR Repository by putting the following in our template and redeploying:

```yaml
DockerRepo:
  Type: "AWS::ECR::Repository"
  Properties:
    RepositoryPolicyText:
      Version: "2012-10-17"
      Statement:
        - Sid: AllowPushPull
          Effect: Allow
          Action:
            - "ecr:*"
          Principal:
            AWS:
              - !GetAtt PipelineRole.Arn
```

Now we can start working on the actual build and deploy process (a.k.a "Pipeline"). Add the following resources to the template:

```yaml
# This resource sets up the build. In general, all it does is run arbitrary shell commands inside of a docker 
# container
BuildProject:
  Type: AWS::CodeBuild::Project
  Properties:
    #This is the role that the build will execute as. If your build needs to pull artifacts from S3 or reach out of its container for any reason make sure this role has the permissions to do so.
    ServiceRole: !GetAtt PipelineRole.Arn 
    Source:
      #Where our sourcecode will come from (This special keyword says that CodePipeline will provide it)
      Type: CODEPIPELINE
    Environment:
      #This specifies what docker image and how much resources to give it to run the build.
      Type: LINUX_CONTAINER
      ComputeType: BUILD_GENERAL1_SMALL
      Image: aws/codebuild/docker:1.12.1
      EnvironmentVariables:
        #We can put anything we want here and these will be set as environment variables when the build runs. 
        #We're leveraging this to point to the Docker image repository we created earlier.
        - Name: DOCKER_IMAGE_URL
          Value: !Sub "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${DockerRepo}"
    Artifacts:
      #Send any output back to code pipeline
      Type: CODEPIPELINE
Pipeline:
  #This is the "Pipeline" or order flow of execution.
  Type: AWS::CodePipeline::Pipeline
  DependsOn:
    - BuildProject
  Properties:
    ArtifactStore:
      Type: "S3"
      Location: !Ref ArtifactStorage
    RoleArn: !GetAtt PipelineRole.Arn
    RestartExecutionOnUpdate: true
    Stages: 
        #The first step triggers with changes in Github
      - Name: Source
        Actions:
        - Name: Source
          ActionTypeId:
            Category: Source
            Provider: GitHub
            Owner: ThirdParty
            Version: 1
          OutputArtifacts:
            - Name: sourceCode
          Configuration:
            Owner: "prowe" #Update this with your github username
            Repo: "node-reference" #The repository to checkout
            Branch: master
            OAuthToken: !Ref RepoToken
        #Step two is to build the project using our configured CodeBuild project above.
      - Name: Build
        Actions:
        - Name: Build
          ActionTypeId:
            Category: Build
            Owner: AWS
            Provider: CodeBuild
            Version: 1
          InputArtifacts:
            - Name: sourceCode
          Configuration:
            ProjectName: !Ref BuildProject
          OutputArtifacts:
            - Name: buildResults
```

Execute a stack update and you should see a build kick off in the CodePipeline console and fail at the build stage because it can't find a `buildspec.yml` file.

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