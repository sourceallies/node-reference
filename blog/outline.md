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
npm install --save koa koa-bodyparser
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
```

We can add additional routes to this file as needed and it provides an easy one-stop-shop place for future developers to find out what code is executing for a given URL.

Congratulations, we now have a very simple NodeJS api running locally. You should be able to make a request to http://localhost:3000/hello and see the JSON response. Remember to commit your changes.

## Unit Testing

We plan on using [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development) so we need to set up some sort of unit testing framework. For this task I'm turning to [Jasmine](https://jasmine.github.io). Mocha/Chai/Sinon and Jest are also popular options. They are all similar but the thing that I like about Jasmine is that it includes the runner, an assertion library and a mocking framework all in one.

Let's start by installing it by running:
```Bash
npm install --save-dev jasmine
```

Now create a `canary.spec.js` file with the following content:
```Javascript
describe('Canary test case', function() {
    beforeEach(function() {
        this.saying = 'cheep';
    });

    it('should say cheep', function() {
        expect(this.saying).toEqual('cheep');
    });
});
```

By default, Jasmine looks for a config file at `spec/support/jasmine.json` relative to the root directory. Create that file with these contents:
```Json
{
    "spec_files": [
        "**/*.spec.js"
    ]
}
```

Finally, add a "scripts" entry to `package.json` by adding this snippet:
```Json
"scripts": {
  ...
  "test": "jasmine"
},
```

Running `npm test` will execute all test cases in the project (as long as their files end in ".spec.js")

A few notes about unit testing in general and Jasmine specifically:
1. It is very important to consider the asynchronous of Javascript when choosing a testing library. The ideal case is that a test case can return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). This allows a test case to be declared "async" and to simply await the exeuction of the system under test before asserting the results.
2. I like to put the test case files in the same directory as the system under test. This way, it is easy to locate the test files, they are alphabetically immediately after the file they are testing. It also allows the require call to use a short, relative path.
3. You may have noticed that I declared the `describe` and `it` callbacks as classic functions and not their arrow-function counterpart. Jasmine automatically creates an empty object and binds it to the callback functions. This allows us to reference `this` to store state between the `beforeEach` calls and the individual test cases. 

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

# Run our test cases, if any fail this will fail the docker build command (non-zero exit code)
RUN npm test

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

Before executing the above template, log into your [GitHub](https://github.com) account and go to Settings -> Developer Settings -> Personal Access Tokens and create a personal access token. You will need to check all the "Repo" and "admin:Repo" scopes. Save this token in a safe place for now (Don't check it into verison control). We will need it in the next step.

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

By default (AWS Code Build)[https://aws.amazon.com/codebuild/] looks in the root of the repository for this file. Our version of this file is pretty simple since most of th heavy lifting will be done by Docker. Create a `buildspec.yml` file with these contents:

```YAML
version: 0.2
env:
  variables: {}
phases:
  pre_build:
    commands:
      - export RELEASE_IMAGE_URL="$DOCKER_IMAGE_URL:$CODEBUILD_RESOLVED_SOURCE_VERSION"
  build:
    commands:
      - docker build --tag "$RELEASE_IMAGE_URL" .
      - |
        cat <<EOF > outputProperties.json
        {
          "image": "$RELEASE_IMAGE_URL", 
          "version": "$CODEBUILD_RESOLVED_SOURCE_VERSION"
        }
        EOF
      - $(aws ecr get-login)
      - docker push "$RELEASE_IMAGE_URL"
artifacts:
  discard-paths: yes
  files:
    - "cloudformation.template.yml"
    - "outputProperties.json"
```

These are simply shell scripts that are executed in order. The first step (in pre_build) is to calculate a Docker image tag that we will push to specific to this build. It is important that we create a unique image for each build so that the deployment of a version will deploy the code built for that version and not simply the last build to execute. the "DOCKER_IMAGE_URL" variable was configured by our cloudformation template and the "CODEBUILD_RESOLVED_SOURCE_VERSION" is a built in variable populated by Code build.

Next we use Docker to build our image. We then create a json file with the URL to the image. We have to have some way to pass the image URL into the Cloudformation template that executes the deployment without it knowing the version ahead of time. To do this we create a properties file and publish it as a build artifact. The artifacts section is a list of files that get copied forward and can be referenced by later stages in our pipeline (i.e. the deployments to Dev and Prod).

Check in the `buildspec.yml` file and wait for a build to kick off. If all works well you should have a new docker image in your docker repo and a successful build.

## Fargate deployment

With an automated build process underway, it is now time to switch focus to the application's runtime environments. We will be creating two: Development (aka. Dev) and Production (aka. Prod). The same process can be extended to any number of environments. However, consider wether your project needs more than two environments. Talk with your team about what the definition and use-cases of the various environments are. Are you going to do all demos in a specific environment? Do you have business users that want the ability to "play around" in an environment that is not production but also not under active development? New environments can always be added later, but extra environments cost extra money now.

The runtime environment for our Docker image is going to be the (Elastic Container Service)[https://aws.amazon.com/ecs/]. More specifically, the (Fargate)[https://aws.amazon.com/fargate/] configuration. While marketed as a separate product, Fargate is really just a couple of extra configuration values given to an <abbr title="Elastic Container Service">ECS</abbr> Service and Task.

Before the introduction of Fargate there were three main options to run a "serverless" system on AWS. The first was Elastic Beanstalk. This was a fairly heavyweight service that creates virtual machines for each application under the covers and manages them for you. It reduced the burden of maintaining servers but only partially and didn't address the cost. Second, Elastic Container Service is a managed Docker cluster that allows the deploying of custom Docker images to a pool of virtual machines. This brings with it the advantages of extreamly consistent deployments (due to Docker's nature), as well as reduced cost (because multiple applications can share same VM). The user (i.e. us) still has to manage a pool of virtual machines to host these Docker containers. AWS Lambda is a mechanism that allows for a fully "serverless" deployment. A snippet of code (generally doing one small task) is uploaded to AWS and hooked into an event. When the event occurs (a message on a queue or a HTTP request is received) AWS provisions capacity on a pool of VMs managed by them and executes the provided code. This is extreamly attractive because there are no servers to manage and we are only charged when our service is actually executing (by the memory and time consumed). This model works really well in response to asyncronious events like messaging or a schedule but has some serious downsides when reacting to latentcy sensitive HTTP events along with several other drawbacks:

  - The languages and versions of those languages supported is dictated by AWS and on AWS's schedule. Want to use the newest version of NodeJS? Too bad, you'll have to wait until Lambda supports it. Want to deploy a Rust application? Too bad, Lambda doesn't support it. This may be fine for small, one-off events (Like a nightly job that just needs to hit an API) but a larger and more complicated code base (Like a non-trivial production service) these restrictions may not be acceptable.
  - Your code is not always runing (this is what makes it so cheap). Because of this, the first request to hit it will cause the Lambda to need to be "cold-started". This is the downloading, provisioning and starting of the code. Once done, the Lambda will stay "hot" for as long as it is continuiously receiving requests but as soon as those requests die off for a few minutes, AWS will evict the code to make room for other people's applications. This "cold-start" time is anywhere from 3-10seconds and because of this an SLA requirement of having subsecond API calls is simply impossible to ensure.
  - Configuration sprawl is also a concern. A simple hello-world app may only have one or two Lambda events and therefore only require a couple dozen lines of Cloudformation configuration to hook them together. As the application grows the amount of configuration needed to be managed grows in lockstep with it. Every HTTP route, and every HTTP method for each of those HTTP routes is a separate Lambda declaration as well as a separate API Gateway resource/method configuration to hook up that Lambda. All of this adds up to a lot of configuration that needs to be exactly correct in order for the application to deploy and is almost impossible to validate locally.
  - There is no exposed lifecycle for a Lambda. There is no good way to do something "on-start" and to keep state between requests. Generally, microservices are stateless, however, mature applications still often have the need to maintain a cache of data or to download or compile data on startup (For example, spinning up Spring in the Java world or Entity Framework using reflection to pre-compute SQL statements in the .Net world).
  - Lambdas do not have access to the raw HTTP request. They are receiving "Events" from API Gateway. These events are not a pipe back into the TCP connection with the client but rather an encapsulated request. This is fine for small JSON payloads both ways but often there is a need (even if rarely) to either stream data back to the client (scanning a DB table and converting to CSV for an "Export" functionality) or the ability to accept multi-part binary content in an upload from the client.

All of the above limitations are navigable but require a lot of extra complexity and work arounds that add to the risk of the application and make it harder to maintain and evolve. Fargate solves these problems for us. It allow us to deploy a Docker container of our choosing (which means we can run any version of anything that runs on Linux) on a pool of VMs that are managed by AWS (so we don't have to worry about capcity planning and patching). The containers are run on our schedule (ie. around the clock) so there is no cold-start time. The containers also just handle a normal Linux process so we can do work "on-start" or store files locally on disk. We can run the application locally exactly like in AWS. And, because they receive HTTP traffic (or raw TCP if you prefer), we can leverge the entire HTTP feature set (streams, websockets, HTTP/2 etc) as well as keep routing configuration encapsulated closer to the code that is actually handling that route.

The main downside to all of this is simply cost. We have to pay to run the container all the time. While this may be significant if there are many environments that need multi gigabyte containers, our NodeJS app can happily run on the min specs at a cost of about $12 per month per environment.

The first step in this process is to create a cloudformation template with an ECS cluster in it. This cluster will not contain any dedicated VMs but we still need it as a container to reference. Create a `cloudformation.template.yml` file in the root of the repository with this content:

```YAML
AWSTemplateFormatVersion: "2010-09-09"
Description: Product Service
Parameters:
  Image:
    Type: String
    Description: Docker image to run
Resources:
  ECSCluster:
    Type: "AWS::ECS::Cluster"
    Properties: {}
```

Now add the following Stages to the `pipeline.template.yml` file within the pipeline at the end. These will deploy our environments in quick succession:

```YAML
- Name: Deploy_DEV
  Actions:
  - Name: Deploy
    RoleArn: !GetAtt PipelineRole.Arn
    ActionTypeId:
      Category: Deploy
      Owner: AWS
      Provider: CloudFormation
      Version: '1'
    InputArtifacts:
      - Name: buildResults
    Configuration:
      #this is the name of the stack
      StackName: ProductService-DEV 
      #becuase this is dev, if the deploy fails on the first create, just destroy it rather than getting stuck in CREATE_FAILED state
      ActionMode: REPLACE_ON_FAILURE 
      #this special syntax represents the file we put in our "artifacts" section of the buildspec.yml
      TemplatePath: buildResults::cloudformation.template.yml
      RoleArn: !GetAtt PipelineRole.Arn
      Capabilities: CAPABILITY_IAM
      #Because the image URL is not static between builds, we need to inject it here so that it can change each build
      #this special syntax looks up the value we placed in the outputProperties.json file and passes it to our template
      #Do not put secret values here as they are visible in the code pipeline GUI
      ParameterOverrides: !Sub |
        {
          "Image": { "Fn::GetParam" : [ "buildResults", "outputProperties.json", "image" ] }
        }
  #This is the same as the stage above except the stack name is different and the ActionMode is different
- Name: Deploy_PROD
  Actions:
  - Name: Deploy
    RoleArn: !GetAtt PipelineRole.Arn
    ActionTypeId:
      Category: Deploy
      Owner: AWS
      Provider: CloudFormation
      Version: '1'
    InputArtifacts:
      - Name: buildResults
    Configuration:
      StackName: ProductService-PROD 
      #Create or update the stack, but don't delete it if it fails
      ActionMode: CREATE_UPDATE 
      TemplatePath: buildResults::cloudformation.template.yml
      RoleArn: !GetAtt PipelineRole.Arn
      Capabilities: CAPABILITY_IAM
      ParameterOverrides: !Sub |
        {
          "Image": { "Fn::GetParam" : [ "buildResults", "outputProperties.json", "image" ] }
        }
```

Check in the cloudformation.template.yml file and then update the pipeline stack and you sould see two new stacks get created and the pipeline is now four stages long (You may need to refresh). If you update the stack before checking in the template you will probably see a failure in the pipline that it can not find the template file. We now have a continuious delivery pipeline in place that will ensure that infrastructure changes are kept consistent between source control, development and production.

Next we need to get the application running and accessable. There are three main peices to this: A "Task Defintion", a "Service" and an "Application Load Balancer" (also known as a LoadBalancerV2). The task definition is responsible for telling ECS how to launch our application. This includes CPU and memory settings as well as an [IAM role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html) that will be assumed by the task. Add these resources to your `cloudformation.template.yml` file:

```YAML
# This is the role that our task will excute as. You can think of this as the ECS equivilent of an instnace profile.
TaskRole:
  Type: "AWS::IAM::Role"
  Properties:
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        # Allow ECS the ability to assume this role.
        - Effect: "Allow"
          Action: "sts:AssumeRole"
          Principal:
            Service: "ecs-tasks.amazonaws.com"
    ManagedPolicyArns:
      # We need to be able to pull our docker image. If your docker repo is in the same account this policy will do it.
      # If you are deploying accross accounts you could remove this and instead ensure that your repo is readable by this role
      - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
TaskPolicy:
  # This is an additional policy we are going to attach to our role.
  # We can add additoinal one-off grants here to allow our container to only access the AWS resources it needs.
  Type: "AWS::IAM::Policy"
  Properties:
    PolicyName: !Sub "${AWS::StackName}-TaskPolicy"
    Roles:
      - !Ref TaskRole
    PolicyDocument:
      Version: "2012-10-17"
      Statement:
        # Allow the task to forward to Cloudwatch logs. (anything we send to stdout or stderr will go there)
        - Effect: "Allow"
          Action: 
            - logs:*
          Resource: !GetAtt LogGroup.Arn
# Create a place for logs to go.
LogGroup:
  Type: "AWS::Logs::LogGroup"
  Properties:
    RetentionInDays: 30
# This defines the resources we need for our Task to execute
TaskDefinition:
  Type: "AWS::ECS::TaskDefinition"
  DependsOn: 
    # We need a depends on here because without it the task may attempt to start before the policy is attached to the role.
    - TaskPolicy
  Properties: 
    Cpu: 256 #This is 25% of a "vCPU", the smallest amount we can allocate
    Memory: 512 #This is 512MB, the smallest amount we can allocate
    ExecutionRoleArn: !GetAtt TaskRole.Arn
    TaskRoleArn: !GetAtt TaskRole.Arn
    # These next two properties are the only Fargate specific configuration in the TaskDefinition. 
    # It forces an 'awsvpc' network mode
    NetworkMode: awsvpc
    RequiresCompatibilities:
      - FARGATE
    ContainerDefinitions:
      - Name: ProductService
        PortMappings:
          - ContainerPort: 3000
        Essential: true
        Image: !Ref Image
        LogConfiguration:
          # This tells ECS to send log output to Cloudwatch. The prefix is required by Fargate so don't remove it.
          LogDriver: "awslogs"
          Options:
            awslogs-group: !Ref LogGroup
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: ProductService
```

There is a difference between the way traditional ECS tasks and Fargate tasks obtain IP addresses and communicate with the network. Traditionally, the Docker daemon on the host machine creates a private internal network and issues IP addresses from that network to the containers running on the host. Traffic bound for the wider network is [NATed](https://en.wikipedia.org/wiki/Network_address_translation) out on the host's network interface. With Fargate however, this process changes. ECS actually obtains a new IP address directly from the configured subnet and attaches it directly to the Docker container. This means that the IP address the container sees for itself is actually routable from the wider VPC. Unfortunately, as of right now, there are some issues resolving this address by doing a hostname lookup inside the container. 

The [ECS Service](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html) governs the execution and placement of a "Task." This is the resource that will handle ensuring the correct number of instances are running. It will handle rolling deployments to ensure no-downtime deployments. It also manage the LoadBalancerV2's list of targets so that requests can be routed only to healthy instances. It also manages the network that those instances execute on. To support this we need to add two new parameters to our Cloudformation template and populate them. Add these to the "Parameters" section of `cloudformation.template.yml`:

```YAML
VpcId:
  Type: AWS::EC2::VPC::Id
  Description: Id of the VPC
SubnetIds:
  Type: List<AWS::EC2::Subnet::Id>
  Description: List of subnet Ids to run in
```

There are a couple ways to populate these parameters. The simplest is to add the appropriate values to the "ParameterOverrides" section in `pipeline.template.yml`

An alternative way is to create properties files for each environment (ex `dev.parameters.json`) with contents like the following and check them into source control:
```JSON
{
    "Parameters" : {
        "VpcId": "vpc-868750e3",
        "SubnetIds": "subnet-5d24b151,subnet-c5c9fded,subnet-aca64cdb,subnet-2fb7df4a,subnet-62d9cd24,subnet-a8e18192"
    }
}
```

Then add these files to the "artifacts" section of `buildspec.yml`. Finally, set the "[TemplateConfiguration](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/continuous-delivery-codepipeline-action-reference.html)" property in `pipeline.template.yml` for each deployment action to the location of this parameter file (ex. "buildResults::dev.parameters.json").

With these networking settings now available in our template we can add the Service resource to `cloudformation.template.yml`:

```YAML
Service: 
  Type: AWS::ECS::Service
  Properties: 
    Cluster: !Ref ECSCluster
    # This is new with fargate (obviously)
    LaunchType: FARGATE
    # The number of instances we would like to run
    DesiredCount: 1 
    # The task to execute
    TaskDefinition: !Ref TaskDefinition
#    We haven't setup a load balancer yet so this part is commented out. 
#    The Service references the loadbalancer rather than the other way around
#    LoadBalancers: 
#      - ContainerName: ProductService
#        ContainerPort: 3000
#        TargetGroupArn: !Ref TargetGroup
    NetworkConfiguration: 
      AwsvpcConfiguration:
        AssignPublicIp: ENABLED
        Subnets: !Ref SubnetIds
    # This is optional (These are the default values)
    DeploymentConfiguration:
      MinimumHealthyPercent: 100 #Never allow less than this percentage of servers to be running during a deploy
      MaximumPercent: 200 # Allow double the number of servers to be running during a deployment
```

Check in this template and when CodePipeline deploys it you should have a running service with one task. Next, we will front this service with a load balancer.

## Add an alb 

For a long time, AWS has supported an HTTP(S) load balancing service in the form of an [Elastic Load Balancer](https://aws.amazon.com/elasticloadbalancing/details/) (Now called a "Classic load balancer"). When paired with ECS, a classic load balancer suffers from a limitation where every node in the cluster it is balancing must be listening on the same port (the port is configured at the cluster level, not the node level). Because of this, a host port had to be mapped to the container port for each running instance. This prevented two containers from sharing a host if they were both mapped to the same host port. Fargate does not allow us to map host ports at all (because we don't control the host). So, we have to use a newer load balancer product called an "Application Load Balancer".

Application Load Balancer (or ALB) consists of three pieces. The Load Balancer represents an IP address and associated domain name that can receive traffic. One or more "Listener" elements configure the ports and protocols the Load Balancer will receive traffic on. We will ultimatly create two of these (one for HTTP on port 80 and one for HTTPS on port 443). Finally, a TargetGroup represents a pool of back end services that can be load balanced accross.

It is worth mentioning that we do not directly configure the TargetGroup to reference our serivce. Instead, we point the service at the target group. The service is responsible for allocating the cluster instances and then injecting their IP addresses into the Load Balancer.

Add the following resources to `cloudformation.template.yaml`:

```YAML
LoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Scheme: internet-facing
    Subnets: !Ref SubnetIds
LBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
    - Type: forward
      TargetGroupArn: !Ref TargetGroup
    LoadBalancerArn: !Ref LoadBalancer
    Port: 80
    Protocol: HTTP
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  DependsOn: LoadBalancer
  Properties:
    TargetType: ip #the default is "instance" but we must use ip to forward to fargate
    VpcId: !Ref VpcId
    Protocol: HTTP
    Port: 80
    HealthCheckPath: /hello
    HealthCheckIntervalSeconds: 10
    HealthCheckTimeoutSeconds: 5
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 2
    TargetGroupAttributes:
      - Key:  deregistration_delay.timeout_seconds
        Value:  30
```

You will also need to uncomment these lines from the Service definition:

```YAML
  LoadBalancers: 
    - ContainerName: ProductService
      ContainerPort: 3000
      TargetGroupArn: !Ref TargetGroup
```

Once deployed, AWS will assign a hostname to your load balancer that can be obtained by looking at the load balancer console or adding an "Outputs" section to your `cloudformation.template.yml`:

```YAML
Outputs:
  LoadBalancerDNS:
    Value: !GetAtt LoadBalancer.DNSName
```

## SSL/dns/force HTTPS

## Cognito setup

In order to secure our application we are going to leverage [OpenID Connect](http://openid.net/connect/). Each request to our application from either another service or a logged in human user will contain a [JSON Web Token or JWT](https://jwt.io) as a "Bearer" token in the Authorization header. This token not only proves who the client is but also information about that client (Claims) that include email address and roles.

Security is hard. This is why I believe that the best practice is to off load as much security related design to industry standards and as much implementation as possible to third party libraries.

In order to support OpenID Connect we need an "Identity Provider". This is a server that both the client and service trust. The client sends credentials (i.e. Client ID and Secret pair) to obtain a JWT and the service uses the public key of the provider to verify the signature of the token. If your organization already as an OpenID Connect compatable identity provider in place then reach out to the team that manages to inquire about using it as the provider for your application. This will allow single sign on for users that already have accounts at that identity provider. If not, an AWS [Cognito User Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html) is OpenID compatable. Unfortunately, the Cloudformation support for User Pools is lacking the ability to configure the resources we need so we will have to do this configuration via the Console or command line. 

Log into the AWS console and follow these steps:

1. Select the Cognito service
2. Select "Manage your User Pools"
3. Select "Create a User Pool"
4. Enter a name for this pool (you will most likely have only one shared across all apps and environments)
4. Select "Review Defaults" and accept them
3. Select "General Settings / App Clients" on the left and create a new app client with the default settings. This represents a "Service account" client to the user pool. A Client ID and secret will be generated. Keep these secrets secure, we will need them later.
4. Select "App Integration / Domain Name" on the left and set a domain name for the pool. This is needed so we can have an endpoint to authenticate to.
5. Select "App Integration / Resource Servers" and create a new one. Our "Product Service" is considered a resource server
    - The name can be anything you want (ex. Product Service)
    - The Identifier can be anything you want. Using the base URL of the service is a good choice.
    - Create two custom scopes "products:read" and "products:write"
6. Select "App Integration / App Client Settings" and select the App Client created above. This is where we give our "Product Serivce Client" access to the "Product Service Resource Server". 
    - Enable "Cognito User Pool" identity provider
    - Select "Client credentials" for an allowed auth flow
    - Select the two custom scopes we created earlier.

To test our new identity provider, we can use curl to attempt to obtain a token. Execute the following (setting the client_id, client_secret and domain_prefix with your values)

```Bash
curl -X POST \
  https://${client_id}:${client_secret}@${domain_prefix}.auth.us-east-1.amazoncognito.com/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d grant_type=client_credentials
```
You should receive a JSON response that contains an "access_token" field. This token is the JWT that is sent to the server. If you are curious what the token contains, it can be copy/pasted into [jwt.io](https://jwt.io) to view it.

To verify the signature of our token we need to obtain the public key for our identity provider. Most identity providers rotate this key-pair on a frequient (ex. hourly) basis. To always obtain uptodate public keys we can leverage the [JSON Web Key Set or JWKS](https://tools.ietf.org/html/rfc7517) standard. This specification provides a standard way to encode a set of public keys in a JSON document and then make it available at a URL. We can fetch the current JWKS document for our identity provider by executing this command with the corect `cognito_user_pool_id` value:

```Bash
curl https://cognito-idp.us-east-1.amazonaws.com/${cognito_user_pool_id}/.well-known/jwks.json
```

We now have a fully managed, standards compliant identity service available for use.

## Adding authentication

In order to leverage our new identity provider, we need to add a middleware into the Koa pipeline. This middleware will reject requests that do not contain valid tokens. We can accomplish this by using two libraries: [koa-jwt](https://github.com/koajs/jwt) to validate the token and [jwks-rsa](https://github.com/auth0/node-jwks-rsa) to automatically fetch and cache JWKS documents. Add both of these libraries to the project:

```Bash
npm install --save koa-jwt jwks-rsa
```

Require them in at the top of the `server.js` file:

```Javascript
const jwt = require('koa-jwt');
const jwksRsa = require('jwks-rsa');
```

Also in the `server.js` file, add a helper function to create the authentication middleware. You can inject the JWKS url from an environment variable using [process.env](https://nodejs.org/api/process.html#process_process_env). Or, if you are using the same Cognito User Pool in all environments, just keep it simple and hard code it.

```Javascript
function createAuthMiddleware() {
  return jwt({
    secret: jwksRsa.koaJwtSecret({
      cache: true,
      jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/<userPoolId>/.well-known/jwks.json'
    }),
    algorithms: ['RS256']
  });
}
```

Lastly, add the following line above the existing `app.use` call in order to ensure authentication happens before processing the request:
```Javascript
app.use(createAuthMiddleware());
```

To test our new setup, start the server and attempt to fetch our hello endpoint:
```Bash
curl --verbose http://localhost:3000/hello
```

You should receive an [HTTP 401](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) back. Now fetch a token from the Cognito token endpoint (they're only valid for so long so get a new one) and include it in the request:

```Bash
curl --verbose http://localhost:3000/hello \
  -H 'Authorization: Bearer eyJraWQiOiJcL1dQ........OY4MElfhEJvQ'
```

We have now implemented a best of breed security solution with only a few lines of code. However, there is one remaining loose end: **If we check in the above changes, then the AWS ECS Service health check will attempt to hit our /hello endpoint and receive a 401 response.** By default, any non-200 response is considered "unhealthy" so it will fail to deploy our service. To remedy this, we are going to exclude the /hello endpoint from authentication by modifing the `use(createAuthMiddleware())` line in `server.js` as follows:

```Javascript
app.use(createAuthMiddleware()
    .unless({path: '/hello'}));
```

We can now safely deploy our service.

## Add DynamoDB

Before we can start building out our product endpoints, we need a place to store them. For that we are turning to [DynamoDB](https://aws.amazon.com/dynamodb/). Tables are the main component, not a "database" so we can create just a single table. Add the following to `cloudformation.template.yml`:

```YAML
ProductsTable:
    Type: "AWS::DynamoDB::Table"
    Properties:
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: "HASH"
      ProvisionedThroughput: 
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1
```

Notice how we aren't specifying every field in our product structure. Dynamo only requires we tell it about attribute we are going to index (the Primary Key as well as any global secondary indexes).

We need to grant our application access to this table so add the following to the Statement array inside the TaskPolicy:
```YAML
...
    - Effect: "Allow"
      Action: 
        - dynamodb:*
      Resource: !GetAtt ProductsTable.Arn
```

Now all we have to do is tell our task the ARN of this table. Add and `Environment` section to the ProductsService container definition (if it does not already exist). We are also adding our region:

```YAML
Environment:
  - Name: PRODUCTS_TABLE_NAME
    Value: !Ref ProductsTable
  - Name: AWS_REGION
    Value: !Ref "AWS::RegionId"
```

We can now deploy our template so we have a table. Grab the ARN of this table and set it as the `PRODUCTS_TABLE_NAME` environment variable locally so we can continue development.

## Create put test/endpoint

Lets start by writing a spec for our `POST /products` endpoint. Create a file called `products/createProduct.spec.js` with the following contents:

```Javascript
const proxyquire = require('proxyquire');

describe('products', function () {
    describe('createProduct', function () {
        beforeEach(function () {
            this.product = {
                name: 'widget',
                imageURL: 'https://example.com/widget.jpg'
            };

            this.context = {
                request: {
                    body: this.product
                }
            };

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            this.documentClient = {
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.createProduct = proxyquire('./createProduct', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.put', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the postedProduct to documentClient.put', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
        });

        it('should set the product as the body', async function () {
            await this.createProduct(this.context);
            expect(this.context.body).toBe(this.product);
        });

        it('should populate an id on the product', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item.id).toBeDefined();
        });
    });
});
```

We will need a couple of libraries. We are using [Proxyquire](https://github.com/thlorenz/proxyquire) so that we can intercept node [require](https://nodejs.org/api/modules.html#modules_require) calls and replace them by returning a Mock. We are using the [aws-sdk](https://www.npmjs.com/package/aws-sdk) to access dynamoDB. We also need a way to generate unique Ids. [shortid](https://www.npmjs.com/package/shortid) is good for that. Install these packages by running the following:

```Bash
npm install --save-dev proxyquire
npm install --save aws-sdk shortid
```

Create a stub implementation as `products/createProduct.js` with these contents:

```Javascript
module.exports = async function createProduct(ctx) {
}
```

Run `npm test` and you should see a bunch of failures. Welcome to the "red" in "Red Green Refactor". Feel free to lookup the [AWS DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) and [Koa context](https://github.com/koajs/koa/blob/master/docs/api/context.md) documentation and implement the endpoint. Otherwise, replace the contents of `products/createProduct.js` with this implementation:

```Javascript
const shortid = require('shortid');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME;

module.exports = async function createProduct(ctx) {
    const product = ctx.request.body;

    product.id = shortid.generate();
    await saveProduct(product);
    ctx.body = product;
};

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}
```

Finally, add this in as a route inside our `buildRouter()` function within `server.js` to route the request:

```Javascript
function buildRouter() {
  ...
  router.post('/products', require('./products/createProduct'));
  ...
}
```

Start the application with `npm start` and you shoud be able to post a sample payload to [http://localhost:3000/products]. Remember to set the "Content-Type" header to "application/json".

## Add model validation

We now have a service that allows us to create product records but does not provide any mechanism for ensuring those products contain all the required data we need in the correct format. For this, we need data validation.

While you could certainly implement validation logic by hand using a bunch of "if" statements. It can become suprisingly complicated quickly. Remember that most validators not only need to determine if a model is valid, but also **all** of the reasons it is not valid. When looking for a validation library there are three things I like to consider:

  1. Does this library have a good collection of out-of-the-box validation rules that I might need on this project. Remember that things like email and phone validation are more complicated than they seem. (Checkout out some of these [valid email addresses on Wikipedia](https://en.wikipedia.org/wiki/Email_address#Syntax)).
  2. Does it have good documentation on how to write a "custom" validation rule. Not all rules are going to be covered by the built in validators so it should be clear how to hook in our own logic.
  3. How are custom rules that are asyncronous handled? A rule that checks the database for duplicates or queries a remote service to determine if something is valid should allow the rule to return a Promise or invoke a callback.

For this project we'll be using [Joi](https://github.com/hapijs/joi). While not having great support for async validators, it has a large library of built in validation rules. Run `npm install --save joi` to install it and then create a `products/validateProduct.spec.js` file with these contents for our tests:

```Javascript
describe('validateProduct', function () {
    beforeEach(function () {
        this.validProduct = {
            name: 'widget',
            imageURL: 'https://example.com/widget.jpg'
        };
        this.validateProduct = require('./validateProduct');
    });
  
    it('should return nothing if the product is valid', function() {
        const result = this.validateProduct(this.validProduct);
        expect(result).not.toBeDefined();
    });
  
    describe('name', function() {
      it('should return invalid if name is undefined', function() {
          delete this.validProduct.name;
          const result = this.validateProduct(this.validProduct);
          expect(result['/name']).toContain('"name" is required');
      });
  
      it('should return invalid if name is an empty string', function() {
          this.validProduct.name = '';
          const result = this.validateProduct(this.validProduct);
          expect(result['/name']).toContain('"name" is not allowed to be empty');
      });
  
      it('should return invalid if name is a blank string', function() {
          this.validProduct.name = '   ';
          const result = this.validateProduct(this.validProduct);
          expect(result['/name']).toContain('"name" is not allowed to be empty');
      });
  
      it('should return valid if name has a space', function() {
          this.validProduct.name = 'test product';
          const result = this.validateProduct(this.validProduct);
          expect(result).not.toBeDefined();
      });
    });

    describe('imageURL', function() {
        it('should return invalid if undefined', function() {
            delete this.validProduct.imageURL;
            const result = this.validateProduct(this.validProduct);
            expect(result['/imageURL']).toContain('"imageURL" is required');
        });
    
        it('should return invalid if an empty string', function() {
            this.validProduct.imageURL = 'abc';
            const result = this.validateProduct(this.validProduct);
            expect(result['/imageURL']).toContain('"imageURL" must be a valid uri');
        });
    });
});
```

You may have noticed that the format of the return value of the validate function is a bit odd. If there are no validation errors we are returning `undefined`. Otherwise, we are returning an object where each key of the object is a slash separated property path and the value is an array of errors. The reason we are doing this is because the validation errors are going to ultimately be returned to the client of our service. We will need to document the contract of what the client should expect back from our endpoints in the body when a 400 status code is received. We could have used simple property names for our keys but over time it is reasonable to assume that our model will grow to contain arrays, nested objects and other non-flat structures. How do we represent errors at these lower levels? How do we tell the client that the "startDate" field on the 3rd item in an array is at fault? When faced with these kind of questions, it can help to leverage an existing specification if that specification can be implemented without undue burden. In this case, we can leverage [JSON pointer](https://tools.ietf.org/html/rfc6901) and because we plan on using [JSON Patch](https://tools.ietf.org/html/rfc6902) to handle updates both endpoints will have a consistant way of referencing fields.

We can implement the validator by creating `products/validateProduct.js` with these contents:

```Javascript
const Joi = require('joi');

const schema = Joi.object({
    name: Joi.string()
        .required()
        .trim(),
    imageURL: Joi.string()
        .required()
        .trim()
        .uri()
});

const options = {
    abortEarly: false,
};

module.exports = function validateProduct(product) {
    let validationResults = schema.validate(product, options);
    let errors = validationResults.error && validationResults.error.details;
    if (errors && errors.length) {
        const collapsedErrors = {};
        errors.forEach(err => {
            let jsonPointer = '/' + err.path.join('/');
            let existingErrorsForField = collapsedErrors[jsonPointer] || [];
            collapsedErrors[jsonPointer] = [...existingErrorsForField, err.message];
        });
        return collapsedErrors;
    }
};
```

Now all we have to do is wire in our validation functionality to our `createProduct` module. Add the following peices to `products/createProduct.spec.js`:

```Javascript
...
beforeEach(function () {
    ...

    this.validateProduct = (product) => undefined;
    spyOn(this, 'validateProduct').and.callThrough();

    this.createProduct = proxyquire('./createProduct', {
        "./documentClient": this.documentClient,
        './validateProduct': this.validateProduct,
    });
});
...
it('should return validation errors as the body if validation fails', async function(){
    let errors = {name: []};
    this.validateProduct.and.returnValue(errors);
    await this.createProduct(this.context);
    expect(this.context.body).toBe(errors);
});

it('should set status to 400 if validation fails', async function(){
    this.validateProduct.and.returnValue({name: []});
    await this.createProduct(this.context);
    expect(this.context.status).toEqual(400);
});

it('should not save the product if validation fails', async function(){
    this.validateProduct.and.returnValue({name: []});
    await this.createProduct(this.context);
    expect(this.documentClient.put).not.toHaveBeenCalled();
});
```

Validation is now in place.

## Add e2e smoke test
## Tie smoke test to deploy
## Add xray
## Add listing
## Add get by Id 
## Add delete
## Add patch
## Add change event/topic