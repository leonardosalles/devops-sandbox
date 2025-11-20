import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  EC2Client,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  DescribeImagesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});
const ec2 = new EC2Client({});

const TABLE = process.env.TABLE_NAME!;
const REPO_URI = process.env.REPO_URI!;
const AWS_REGION = process.env.REGION || process.env.AWS_REGION || "sa-east-1";
const RCON_PASSWORD = process.env.RCON_PASSWORD || "";
const GSLT = process.env.GSLT || "";

const KEY_NAME = "cs2-key";
const SECURITY_GROUP_ID = process.env.SECURITY_GROUP_ID!;
const SUBNET_ID = process.env.SUBNET_ID!;
const INSTANCE_PROFILE_NAME = process.env.INSTANCE_PROFILE_NAME!;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function json(body: any, status = 200): APIGatewayProxyResult {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
}

async function findLatestAmazonLinux2Ami(): Promise<string> {
  const cmd = new DescribeImagesCommand({
    Owners: ["amazon"],
    Filters: [{ Name: "name", Values: ["amzn2-ami-hvm-*-x86_64-gp2"] }],
  });

  const res = await ec2.send(cmd);
  const images = res.Images || [];
  images.sort((a, b) =>
    (b.CreationDate || "").localeCompare(a.CreationDate || "")
  );
  return images[0]?.ImageId!;
}

async function waitForPublicIp(instanceId: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const desc = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const ip = desc.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress;
    if (ip) return ip;
    await sleep(2000);
  }
  return "";
}

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const path = event.path;
    const method = event.httpMethod;

    if (method === "OPTIONS") return json({});

    if (method === "POST" && path === "/servers") {
      const id = crypto.randomUUID();
      await ddb.send(
        new PutItemCommand({
          TableName: TABLE,
          Item: marshall({ id, state: "STOPPED" }),
        })
      );
      return json({ id });
    }

    if (method === "GET" && path === "/servers") {
      const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
      return json(
        (res.Items || [])
          .map((i) => unmarshall(i))
          .filter((s) => s.state !== "TERMINATED")
      );
    }

    const match = path.match(
      /^\/servers\/([^\/]+)\/(start|stop|restart|terminate)$/
    );
    if (!match || method !== "POST") return json({ error: "unsupported" }, 400);

    const id = match[1];
    const action = match[2];

    const get = await ddb.send(
      new GetItemCommand({ TableName: TABLE, Key: marshall({ id }) })
    );
    if (!get.Item) return json({ error: "not found" }, 404);
    const server = unmarshall(get.Item);

    if (action === "start") {
      if (server.instanceId) {
        await ec2.send(
          new StartInstancesCommand({ InstanceIds: [server.instanceId] })
        );
        const publicIp = await waitForPublicIp(server.instanceId);

        await ddb.send(
          new UpdateItemCommand({
            TableName: TABLE,
            Key: marshall({ id }),
            UpdateExpression: "SET #s = :s, publicIp = :p",
            ExpressionAttributeNames: { "#s": "state" },
            ExpressionAttributeValues: marshall({
              ":s": "RUNNING",
              ":p": publicIp,
            }),
          })
        );

        return json({ ok: true, instanceId: server.instanceId, publicIp });
      }

      const ami = await findLatestAmazonLinux2Ami();
      const instanceType = process.env.EC2_INSTANCE_TYPE || "t3.small";

      const userdata = `#!/bin/bash
set -eux

yum update -y
amazon-linux-extras install -y docker
systemctl enable docker
systemctl start docker
usermod -a -G docker ec2-user
yum install -y awscli

echo "RCON_PASSWORD=${RCON_PASSWORD}" >> /envfile
echo "GSLT=${GSLT}" >> /envfile

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${
        REPO_URI.split("/")[0]
      }

for i in 1 2 3; do
  if docker pull ${REPO_URI}:latest; then break; fi
  sleep 5
done

docker run -d --name cs2 --env-file /envfile \
  -p 27015:27015/tcp \
  -p 27015:27015/udp \
  -p 27020:27020/udp \
  -p 27005:27005/udp \
  -p 4380:4380/udp \
  ${REPO_URI}:latest
`;

      const runParams: any = {
        ImageId: ami,
        InstanceType: instanceType,
        KeyName: KEY_NAME,
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userdata).toString("base64"),

        IamInstanceProfile: {
          Name: INSTANCE_PROFILE_NAME,
        },

        NetworkInterfaces: [
          {
            AssociatePublicIpAddress: true,
            DeviceIndex: 0,
            Groups: [SECURITY_GROUP_ID],
            SubnetId: SUBNET_ID,
          },
        ],
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/xvda",
            Ebs: {
              VolumeSize: 80,
              VolumeType: "gp3",
              DeleteOnTermination: true,
            },
          },
        ],
      };

      const run = await ec2.send(new RunInstancesCommand(runParams));
      const instanceId = run.Instances?.[0]?.InstanceId!;
      const publicIp = await waitForPublicIp(instanceId);

      await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE,
          Key: marshall({ id }),
          UpdateExpression: "SET instanceId = :i, #s = :s, publicIp = :p",
          ExpressionAttributeNames: { "#s": "state" },
          ExpressionAttributeValues: marshall({
            ":i": instanceId,
            ":s": "RUNNING",
            ":p": publicIp,
          }),
        })
      );

      return json({ instanceId, publicIp });
    }

    if (action === "stop") {
      if (!server.instanceId) return json({ error: "no instance" }, 400);
      await ec2.send(
        new StopInstancesCommand({ InstanceIds: [server.instanceId] })
      );

      await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE,
          Key: marshall({ id }),
          UpdateExpression: "SET #s = :s",
          ExpressionAttributeNames: { "#s": "state" },
          ExpressionAttributeValues: marshall({ ":s": "STOPPED" }),
        })
      );
      return json({ ok: true });
    }

    if (action === "restart") {
      if (!server.instanceId) return json({ error: "no instance" }, 400);
      await ec2.send(
        new RebootInstancesCommand({ InstanceIds: [server.instanceId] })
      );
      const publicIp = await waitForPublicIp(server.instanceId);
      return json({ ok: true, publicIp });
    }

    if (action === "terminate") {
      if (!server.instanceId) return json({ error: "no instance" }, 400);
      await ec2.send(
        new TerminateInstancesCommand({ InstanceIds: [server.instanceId] })
      );
      await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE,
          Key: marshall({ id }),
          UpdateExpression: "SET #s = :s",
          ExpressionAttributeNames: { "#s": "state" },
          ExpressionAttributeValues: marshall({ ":s": "TERMINATED" }),
        })
      );
      return json({ ok: true });
    }

    return json({ error: "unsupported" }, 400);
  } catch (err: any) {
    console.error("Lambda ERROR:", err);
    return json({ error: err.message || String(err) }, 500);
  }
};
