import cloneDeep = require('lodash/cloneDeep');
import clone = require('lodash/clone');
import { attributeMapToObject, prepareReplicas } from './index';
import { DynamoDbRecord } from './DynamoDbEvent';

it('attributeMapToObject', () => {
    expect(attributeMapToObject({
        "id": {
            "S": "2b821390-5eb9-4d44-a7df-d03f798b9c78"
        }
    })).toEqual({
        "id": "2b821390-5eb9-4d44-a7df-d03f798b9c78"
    });
    expect(attributeMapToObject({
        "@type": {
            "S": "ct.team.domain.model.Organization"
        },
        "domain": {
            "S": "cubictube.com"
        },
        "name": {
            "S": "Cubictube"
        },
        "id": {
            "S": "a98c22d4-90d5-446e-bc91-e0c497071145"
        },
        "teamMembers": {
            "L": [
                {
                    "S": "e9254f9f-c868-4592-aed8-5dd116a4bb35"
                }
            ]
        },
        "version": {
            "N": "1"
        }
    })).toEqual({
        "@type": "ct.team.domain.model.Organization",
        "domain": "cubictube.com",
        "id": "a98c22d4-90d5-446e-bc91-e0c497071145",
        "name": "Cubictube",
        "teamMembers": [
            "e9254f9f-c868-4592-aed8-5dd116a4bb35",
        ],
        "version": 1
    });
});

const baseRecord: DynamoDbRecord  = {
    "eventID": "13260fd28b30539b52c900f1b2711a2c",
    "eventName": "MODIFY",
    "eventVersion": "1.1",
    "eventSource": "aws:dynamodb",
    "awsRegion": "eu-west-1",
    "dynamodb": {
        "ApproximateCreationDateTime": 1491250860,
        "Keys": {
            "test": {
                "N": "42"
            }
        },
        "NewImage": {
            "test": {
                "N": "42",
            },
            "__timestamp": {
                "N": "1"
            }
        },
        "SequenceNumber": "219915500000000022839802377",
        "SizeBytes": 206,
        "StreamViewType": "NEW_IMAGE"
    },
    "eventSourceARN": "arn:aws:dynamodb:eu-west-1:034173546782:table/test_Organization/stream/2017-04-03T17:47:19.842"
};

const baseRemoveRecord: DynamoDbRecord  = cloneDeep(baseRecord);
baseRemoveRecord.dynamodb.OldImage = baseRemoveRecord.dynamodb.NewImage;
delete baseRemoveRecord.dynamodb.NewImage;
baseRemoveRecord.eventName = "REMOVE";

it('prepareReplicas', () => {
    const R1 = 'eu-west-1';
    const R2 = 'us-east-1';
    const R3 = 'ap-southeast-1';
    const regions = [ R1, R2, R3 ];
    const expectedReplicaFromR1 = {
      "ConditionExpression": "#ts <= :ts OR attribute_not_exists(#ts)",
      "ExpressionAttributeNames": {
        "#ts": "__timestamp",
      },
      "ExpressionAttributeValues": {
        ":ts": 1,
      },
      "Item": {
        "__originRegion": "eu-west-1",
        "__timestamp": 1,
        "test": 42,
      },
      "TableName": "test_Organization",
    };
    expect(prepareReplicas([baseRecord], regions, R1, false)).toEqual(
        {
            [R1]: [],
            [R2]: [expectedReplicaFromR1],
            [R3]: [expectedReplicaFromR1]
        }
    );
    expect(prepareReplicas([baseRecord], regions, R1, true)).toEqual(
        {
            [R1]: [],
            [R2]: [expectedReplicaFromR1],
            [R3]: [expectedReplicaFromR1]
        }
    );

    const replicatedRecord = clone(baseRecord);
    (replicatedRecord as any).dynamodb.NewImage = {
        "__originRegion": {
            "S": R1,
        },
        "test": {
            "N": 42,
        },
        "__timestamp": {
            "N": 1
        }
    };
    const expectedReplicaFromR2 = clone(expectedReplicaFromR1);
    expect(prepareReplicas([replicatedRecord], regions, R2, false)).toEqual(
        {
            [R1]: [],
            [R2]: [],
            [R3]: [expectedReplicaFromR2]
        }
    );
    expect(prepareReplicas([replicatedRecord], regions, R2, true)).toEqual(
        {
            [R1]: [],
            [R2]: [],
            [R3]: []
        }
    );

    const expectedRemoveReplicaFromR1 = {
      "Key": {
        "test": 42,
      },
      "TableName": "test_Organization",
    };
    expect(prepareReplicas([baseRemoveRecord], regions, R1, true)).toEqual(
        {
            [R1]: [],
            [R2]: [expectedRemoveReplicaFromR1],
            [R3]: [expectedRemoveReplicaFromR1]
        }
    );
    expect(prepareReplicas([baseRemoveRecord], regions, R1, false)).toEqual(
        {
            [R1]: [],
            [R2]: [expectedRemoveReplicaFromR1],
            [R3]: [expectedRemoveReplicaFromR1]
        }
    );

    const replicatedRemoveRecord = cloneDeep(baseRemoveRecord);
    replicatedRemoveRecord.dynamodb.OldImage!["__originRegion"] = {
        "S": R1
    };

    expect(prepareReplicas([replicatedRemoveRecord], regions, R1, true)).toEqual(
        {
            [R1]: [],
            [R2]: [],
            [R3]: []
        }
    );
    expect(prepareReplicas([replicatedRemoveRecord], regions, R1, false)).toEqual(
        {
            [R1]: [],
            [R2]: [expectedRemoveReplicaFromR1],
            [R3]: [expectedRemoveReplicaFromR1]
        }
    );
});
