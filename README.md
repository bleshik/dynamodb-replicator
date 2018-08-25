[![Build Status](https://travis-ci.org/bleshik/dynamodb-replicator.svg?branch=master)](https://travis-ci.org/bleshik/dynamodb-replicator)
# dynamodb-replicator
Suppose you have a DynamoDB table in N AWS regions (i.e. 1 table in each region, N tables in total), and you want to replicate changes in any of the tables in a region to all other regions automatically.

Here how you may do this with dynamodb-replicator (the image illustrates the case where N = 3, i.e. 3 AWS regions):
![](https://s3-eu-west-1.amazonaws.com/bleshik/DynamoDB+Replicator.jpg "DynamoDB Replicator")

## Deploying
1. Grab **package.zip** of any of the [dynamodb-replicator releases](https://github.com/bleshik/dynamodb-replicator/releases) and deploy it as a nodejs AWS Lambda in each region.
2. Subscribe it to the changes of a target DynamoDb table in each region.
