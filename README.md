[![Build Status](https://travis-ci.org/bleshik/dynamodb-replicator.svg?branch=master)](https://travis-ci.org/bleshik/dynamodb-replicator)
# dynamodb-replicator
Suppose you have a DynamoDB table in N AWS regions (i.e. 1 table in each region, N tables in total), and you want to replicate changes in any of the tables in a region to all other regions automatically.

Here how you may do this with dynamodb-replicator (the image illustrates the case where N = 3, i.e. 3 AWS regions):
![](https://s3-eu-west-1.amazonaws.com/bleshik/DynamoDB+Replicator.jpg "DynamoDB Replicator")

## Deploying
1. Grab **package.zip** of any of the [dynamodb-replicator releases](https://github.com/bleshik/dynamodb-replicator/releases).
2. Deploy the package as NodeJS AWS Lambda in each region.
3. Assign role to the Lambda for access to the target tables.
4. Subscribe the Lambda to the changes of target DynamoDb tables in each region.

## Examples
You can take a look at a dummy example where a single DynamoDB table called "Table" is replicated.
Here is [a CloudFormation.json template for this particular example](https://github.com/bleshik/dynamodb-replicator/blob/master/examples/CloudFormation.json).

## Why won't you just use DynamoDB Global Tables?
For the background behind this little library and why you would want to use it, check out this article: [How To Easily Replicate DynamoDB Across Regions](https://medium.com/@AlexeyBalchunas/how-to-easily-replicate-dynamodb-across-regions-fee349b736d7).
