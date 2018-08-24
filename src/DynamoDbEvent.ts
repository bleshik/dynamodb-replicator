import { DynamoDB } from 'aws-sdk';

export interface DynamoDbEvent {
    Records: DynamoDbRecord[];
}

type DynamoDbEventType = "INSERT" | "REMOVE" | "MODIFY";

interface DynamoDbStreamRecord {
    Keys: DynamoDB.AttributeMap;
    NewImage: DynamoDB.AttributeMap;
    OldImage?: DynamoDB.AttributeMap;
    ApproximateCreationDateTime: number;
    SequenceNumber: string;
    SizeBytes: number;
    StreamViewType: string;
}

export interface DynamoDbRecord {
    eventID: string;
    eventName: DynamoDbEventType;
    eventSourceARN: string;
    eventSource: string;
    eventVersion: string;
    awsRegion: string;
    dynamodb: DynamoDbStreamRecord;
}
