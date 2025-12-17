import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';

export const s3Client = new S3Client({ region });
const ddbClient = new DynamoDBClient({ region });
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
