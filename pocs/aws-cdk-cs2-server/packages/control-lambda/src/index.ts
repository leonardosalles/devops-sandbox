import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, ScanCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { EC2Client, RunInstancesCommand, StartInstancesCommand, StopInstancesCommand, RebootInstancesCommand, TerminateInstancesCommand, DescribeImagesCommand } from '@aws-sdk/client-ec2';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const ddb = new DynamoDBClient({});
const ec2 = new EC2Client({});
const TABLE = process.env.TABLE_NAME || '';
const REPO_URI = process.env.REPO_URI || '';
const AWS_REGION = process.env.REGION || process.env.AWS_REGION || 'sa-east-1';
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';
const GSLT = process.env.GSLT || '';

function json(body: any, status = 200) {
  return { statusCode: status, body: JSON.stringify(body) } as APIGatewayProxyResult;
}

async function findLatestAmazonLinux2Ami(): Promise<string> {
  // Query public AMIs owned by Amazon that match amzn2 pattern
  const cmd = new DescribeImagesCommand({
    Owners: ['amazon'],
    Filters: [{ Name: 'name', Values: ['amzn2-ami-hvm-*-x86_64-gp2'] }]
  });
  const res = await ec2.send(cmd);
  const images = res.Images || [];
  images.sort((a,b) => (b.CreationDate || '').localeCompare(a.CreationDate || ''));
  const ami = images[0]?.ImageId;
  if (!ami) throw new Error('Could not find Amazon Linux 2 AMI');
  return ami;
}

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const path = event.path;
    const method = event.httpMethod;

    if (method === 'POST' && path === '/servers') {
      const id = crypto.randomUUID();
      await ddb.send(new PutItemCommand({ TableName: TABLE, Item: marshall({ id, state: 'STOPPED' }) }));
      return json({ id });
    }

    if (method === 'GET' && path === '/servers') {
      const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
      const items = (res.Items || []).map(i => unmarshall(i));
      return json(items);
    }

    const match = path.match(/^\/servers\/([^\/]+)\/(start|stop|restart|terminate)$/);
    if (match && method === 'POST') {
      const id = match[1];
      const action = match[2];
      const get = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: marshall({ id }) }));
      if (!get.Item) return json({ error: 'not found' }, 404);
      const server = unmarshall(get.Item);

      if (action === 'start') {
        if (server.instanceId) {
          await ec2.send(new StartInstancesCommand({ InstanceIds: [server.instanceId] }));
          await ddb.send(new UpdateItemCommand({ TableName: TABLE, Key: marshall({ id }), UpdateExpression: 'SET #s = :s', ExpressionAttributeNames: { '#s': 'state' }, ExpressionAttributeValues: marshall({ ':s': 'RUNNING' }) }));
          return json({ ok: true });
        }

        const instanceType = (process.env.EC2_INSTANCE_TYPE as any) || 't3.small';

        // find latest AMI dynamically
        const ami = await findLatestAmazonLinux2Ami();

        const userdata = `#!/bin/bash
set -e
echo "RCON_PASSWORD=${RCON_PASSWORD}" >> /envfile
echo "GSLT=${GSLT}" >> /envfile
$(aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${REPO_URI.split('/')[0]})
docker pull ${REPO_URI}:latest
docker run -d --name cs2 --env-file /envfile -p 27015:27015/tcp -p 27015:27015/udp -p 27020:27020/udp ${REPO_URI}:latest
`;

        const run = await ec2.send(new RunInstancesCommand({
          ImageId: ami,
          InstanceType: instanceType as any,
          MinCount: 1,
          MaxCount: 1,
          UserData: Buffer.from(userdata).toString('base64')
        }));

        const instanceId = run.Instances?.[0].InstanceId;
        await ddb.send(new UpdateItemCommand({ TableName: TABLE, Key: marshall({ id }), UpdateExpression: 'SET instanceId = :i, #s = :s', ExpressionAttributeNames: { '#s': 'state' }, ExpressionAttributeValues: marshall({ ':i': instanceId, ':s': 'PENDING' }) }));
        return json({ instanceId });
      }

      if (action === 'stop') {
        if (!server.instanceId) return json({ error: 'no instance' }, 400);
        await ec2.send(new StopInstancesCommand({ InstanceIds: [server.instanceId] }));
        await ddb.send(new UpdateItemCommand({ TableName: TABLE, Key: marshall({ id }), UpdateExpression: 'SET #s = :s', ExpressionAttributeNames: { '#s': 'state' }, ExpressionAttributeValues: marshall({ ':s': 'STOPPED' }) }));
        return json({ ok: true });
      }

      if (action === 'restart') {
        if (!server.instanceId) return json({ error: 'no instance' }, 400);
        await ec2.send(new RebootInstancesCommand({ InstanceIds: [server.instanceId] }));
        return json({ ok: true });
      }

      if (action === 'terminate') {
        if (!server.instanceId) return json({ error: 'no instance' }, 400);
        await ec2.send(new TerminateInstancesCommand({ InstanceIds: [server.instanceId] }));
        await ddb.send(new UpdateItemCommand({ TableName: TABLE, Key: marshall({ id }), UpdateExpression: 'SET #s = :s', ExpressionAttributeNames: { '#s': 'state' }, ExpressionAttributeValues: marshall({ ':s': 'TERMINATED' }) }));
        return json({ ok: true });
      }
    }

    return json({ error: 'unsupported' }, 400);

  } catch (err: any) {
    console.error(err);
    return json({ error: err.message || String(err) }, 500);
  }
};
