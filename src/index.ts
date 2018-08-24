import DynamoDB = require('aws-sdk/clients/dynamodb');
import { DynamoDbEvent, DynamoDbRecord } from './DynamoDbEvent';
import { Context, Callback } from 'aws-lambda';

function myRegion(): string {
    return (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) as string;
}

function timestamp(r: DynamoDbRecord): number | null {
    const ts = r.dynamodb.NewImage ? r.dynamodb.NewImage["__timestamp"] : null;
    return ts && ts.N ? +ts.N : null;
}

function determineOriginRegion(r: DynamoDbRecord): string | null {
    const region = r.dynamodb.NewImage ?  r.dynamodb.NewImage["__originRegion"] :
        (r.dynamodb.OldImage ? r.dynamodb.OldImage["__originRegion"] : null);
    return region ? region.S as string : null;
}

export function attributeMapToObject(map: DynamoDB.AttributeMap): any {
    return DynamoDB.Converter.output({ M: map });
}

function dynamoDbClient(region: string): DynamoDB.DocumentClient {
    const dynamodbService = new DynamoDB({ region });
    return new DynamoDB.DocumentClient({ service: dynamodbService });
}

type DeleteOrPutItem = DynamoDB.DocumentClient.PutItemInput | DynamoDB.DocumentClient.DeleteItemInput;

export function prepareReplicas(
    records: DynamoDbRecord[],
    regions: string[],
    myRegion: string,
    // this little flag determines replication strategy:
    // 1) if originOnly = true, only the region, where the event actually happenned will send replicas, all other
    //    regions will not send anything for this change.
    // 2) if originOnly = false, all regions will send to all other regions except the origin region, this is usefull
    //    for cases when the replication process looks like a chain.
    //    Example with 3 regions (1 region send replicas only to 1 other region, i.e. regions array has length === 1):
    //    eu-west-1 -> us-east-1 -> us-west-1, note that us-west-1 will stop, because the next replication
    //    region (eu-west-1) is the origin.
    originOnly: boolean
): { [name: string]: DeleteOrPutItem[] } {
    const replicas: { [name: string]: DeleteOrPutItem[] } = {};
    regions.forEach((region) => replicas[region] = []);
    records.forEach((r) => {
        const origin = determineOriginRegion(r);
        if (!origin || !originOnly) {
            const table = r.eventSourceARN.split(':')[5].split('/')[1];
            regions
            // if the record came from the "origin" region, we do not send the update there, because it's redundant
            .filter((region) => origin !== region && myRegion !== region)
            .forEach((region) => {
                if (r.eventName === "REMOVE") {
                    replicas[region].push(
                        {
                            TableName: table,
                            Key: attributeMapToObject(r.dynamodb.Keys)
                        }
                    );
                } else {
                    const obj = attributeMapToObject(r.dynamodb.NewImage);
                    const ts = timestamp(r);
                    const conditional = ts && r.eventName === 'MODIFY';
                    if (!origin) {
                        obj["__originRegion"] = myRegion;
                    }
                    replicas[region].push(
                        {
                            TableName: table,
                            Item: obj,
                            ConditionExpression: conditional ?  "#ts <= :ts OR attribute_not_exists(#ts)" : undefined,
                            ExpressionAttributeValues: conditional ?  { ":ts": ts } : undefined,
                            ExpressionAttributeNames: conditional ?  { "#ts": "__timestamp" } : undefined
                        }
                    );
                }
            });
        }
    });
    return replicas;
}

export function handler(event: DynamoDbEvent, context: Context, callback: Callback) {
    const regions = (process.env.REGIONS as string).split(",").filter((r) => r !== 'none');
    const replicas = prepareReplicas(event.Records, regions, myRegion(), true);
    const cb = (err: any, data: any) => {
        callback(err, null);
    };
    regions.forEach((region) => {
        const dynamodb = dynamoDbClient(region);
        replicas[region].forEach((params) => {
            if ((params as any).Item) {
                dynamodb.put(params as DynamoDB.DocumentClient.PutItemInput, cb);
            } else {
                dynamodb.delete(params as DynamoDB.DocumentClient.DeleteItemInput, cb);
            }
        });
    });
}
