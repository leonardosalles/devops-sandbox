import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeInstancesCommand,
  EC2Client,
  RebootInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

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
          Item: marshall({ id, state: "CREATED" }),
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

    if (method === "POST" && path.match(/^\/servers\/([^\/]+)\/status$/)) {
      const id = path.split("/")[2];
      const body = JSON.parse(event.body || "{}");

      if (!body.state) {
        return json({ error: "missing state" }, 400);
      }

      await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE,
          Key: marshall({ id }),
          UpdateExpression: "SET #s = :s, lastSeen = :t",
          ExpressionAttributeNames: { "#s": "state" },
          ExpressionAttributeValues: marshall({
            ":s": body.state,
            ":t": Date.now(),
          }),
        })
      );

      return json({ ok: true });
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
              ":s": "INITIALIZING",
              ":p": publicIp,
            }),
          })
        );

        return json({ ok: true, instanceId: server.instanceId, publicIp });
      }

      const instanceType = process.env.EC2_INSTANCE_TYPE || "t3.small";

      const registryUri = REPO_URI.split("/")[0];

      const userData = `#!/bin/bash
set -eux

API_URL=$(aws ssm get-parameter \
  --region sa-east-1 \
  --name "/cs2/api-url" \
  --query "Parameter.Value" \
  --output text)
SERVER_ID="${id}"

RCON_PASSWORD="${RCON_PASSWORD}"
GSLT="${GSLT}"
AWS_REGION="${AWS_REGION}"
REPO_URI="${REPO_URI}"
REGISTRY_URI="${registryUri}"

SRCDS_DIR=/home/steam/cs2
STEAMCMD_DIR=/home/steam/steamcmd
STEAM_USER=steam
TIMEOUT=60

if ! id "\${STEAM_USER}" >/dev/null 2>&1; then
    useradd -m -s /bin/bash \${STEAM_USER}
fi
usermod -a -G docker \${STEAM_USER}

yum install -y curl tar bzip2 glibc.i686 libstdc++ libstdc++.i686 || true

DEVICE_NAME=$(lsblk -o KNAME,TYPE | grep disk | awk 'NR==1{print $1}')
SCHEDULER_PATH="/sys/block/\${DEVICE_NAME}/queue/scheduler"
if [ -f "$SCHEDULER_PATH" ]; then
    echo noop > "$SCHEDULER_PATH" || true
fi

for i in \`seq 1 $TIMEOUT\`; do
  if docker info > /dev/null 2>&1; then
    break
  fi
  if [ $i -eq $TIMEOUT ]; then
    echo "[UserData] Docker failed to start."
    exit 1
  fi
  sleep 1
done

docker stop cs2 || true
docker rm cs2 || true
docker rmi ${REPO_URI}:latest || true
docker system prune -f --all || true

mkdir -p "\${STEAMCMD_DIR}"
chown \${STEAM_USER}:\${STEAM_USER} "\${STEAMCMD_DIR}"
sudo -u \${STEAM_USER} bash -c "
  cd \${STEAMCMD_DIR}
  curl -sqL 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' | tar zxvf -
  chmod +x steamcmd.sh
"

mkdir -p "\${SRCDS_DIR}"
chown -R \${STEAM_USER}:\${STEAM_USER} "\${SRCDS_DIR}" || true

aws ecr get-login-password --region \${AWS_REGION} | docker login --username AWS --password-stdin \${REGISTRY_URI}

for i in 1 2 3; do
  if docker pull ${REPO_URI}:latest; then
    break
  fi
  sleep 10
done

if [ \$? -ne 0 ]; then
    echo "[Host] Critical: Docker pull failed after multiple attempts."
    exit 1
fi

for i in 1 2 3; do
  sudo -u \${STEAM_USER} bash -c "
    \${STEAMCMD_DIR}/steamcmd.sh \
      +force_install_dir \${SRCDS_DIR} \
      +login anonymous \
      +app_update 730 \
      +quit
  "
  if [ \$? -eq 0 ]; then
    break
  fi
  sleep 10
done

if [ \$? -ne 0 ]; then
    echo "[Host] Critical: CS2 could not be downloaded after multiple attempts."
    exit 1
fi

echo "RCON_PASSWORD=\${RCON_PASSWORD}" >> /envfile
echo "GSLT=\${GSLT}" >> /envfile

echo "API_URL=\${API_URL}" >> /envfile
echo "SERVER_ID=\${SERVER_ID}" >> /envfile

docker run -d --name cs2 --env-file /envfile \\
  -v \${SRCDS_DIR}:\${SRCDS_DIR} \\
  -p 27015:27015/tcp \\
  -p 27015:27015/udp \\
  -p 27020:27020/udp \\
  -p 27005:27005/udp \\
  -p 4380:4380/udp \\
  \${REPO_URI}:latest
`;

      const runParams: any = {
        ImageId: process.env.IMAGE_AMI_ID!,
        InstanceType: instanceType,
        KeyName: KEY_NAME,
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userData).toString("base64"),

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
              VolumeSize: 120,
              VolumeType: "gp3",
              Iops: 6000,
              Throughput: 250,
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
            ":s": "INITIALIZING",
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
      try {
        await ec2.send(
          new TerminateInstancesCommand({ InstanceIds: [server.instanceId] })
        );
      } catch (err) {
        console.error("Failed to terminate instance:", err);
      }
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
