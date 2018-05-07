
# Notes
- Need to open inboud security rule for default VPC Security group
- ctx._matchedRoute

- ctx.state.user
- need to setup a User Pool 
    - Resource Server
    - Pool client
    - Domain
    - Request token to domain
    - jwks is on the cognito userpool id endpoint

# To run with a local DynamoDB
```Bash
docker run -it -p 8000:8000 dwmkerr/dynamodb

# Then to connect
export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=products
export AWS_SECRET_ACCESS_KEY=fake-secret
export ENDPOINT=http://localhost:8000
export PRODUCTS_TABLE_NAME=Products 

#create tables
node products/createTable.js
```