# CS2 Server Manager — AWS (CDK + Lambda + EC2 + ECR + Next.js)

This monorepo deploys a fully automated, **on-demand Counter-Strike 2 hosting system**, powered by:

- **AWS CDK**
- **AWS Lambda**
- **Amazon EC2**
- **Amazon ECR**
- **Amazon DynamoDB**
- **Amazon API Gateway**
- **Next.js App Router UI**
- **Turborepo + pnpm**

The dashboard allows you to **host, start, stop, restart, and terminate** CS2 servers dynamically.

---

## 🚀 Quick Deployment Guide

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure deployment variables

Edit:

```
.env.deploy
```

Fill in:

```
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
AWS_REGION=sa-east-1
DOCKER_IMAGE_NAME=cs2-server-modded
EC2_INSTANCE_TYPE=t3.medium

RCON_PASSWORD=your_rcon_password
GSLT=your_gslt_token

EC2_INSTANCE_TYPE=t3.medium
DOCKER_IMAGE_NAME=cs2-server-modded
IMAGE_AMI_ID=ami-00626b685a570fb6f
STEAM_ADMIN_IDS="76561197960287930,ANOTHER_ID,ANOTHER_ONE"
```

PS: ami-00626b685a570fb6f is the AMI ID for a pre-downloaded CS2 server image.

### 3. Build & push the CS2 Docker image

```bash
./scripts/build-and-push-ecr.sh
```

### 4. Build Lambda (TypeScript)

```bash
pnpm --filter @cs2/control-lambda build
```

### 5. Build CDK Infrastructure

```bash
pnpm --filter @cs2/infra build
```

### 6. Bootstrap CDK (first time only)

```bash
cd packages/infra
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
```

### 7. Deploy all stacks

```bash
npx cdk deploy --all --require-approval never
```

Copy the API URL printed after deploy.

---

## 🖥️ Run the UI

Create:

```
apps/ui/.env.local
```

Add:

```
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.sa-east-1.amazonaws.com/prod/
```

Run UI:

```bash
pnpm --filter @cs2/ui dev
```

Open:

```
http://localhost:3000
```

---

## ⚙️ How It Works

- **Create Server** → creates a DynamoDB entry
- **Start** → launches EC2 & runs CS2 Docker
- **Stop** → stops EC2
- **Restart** → reboots EC2
- **Terminate** → destroys the instance
- **Rcon** → runs a command in the CS2 server

---

## 🎮 Features

✔️ CS2 (app 730)  
✔️ Metamod + Sourcemod (WIP)
✔️ Quake Sounds (WIP)
✔️ Admin menu (WIP)
✔️ RCON enabled  
✔️ Multi‑server support  
✔️ Stable pinned Dockerfile
✔️ Pre-loaded CS server files

---

## 📦 Monorepo Structure

```
apps/
  ui/

packages/
  infra/
    scripts/
      build-and-push-ecr.sh
      cleanup-aws-region.sh
      deploy.sh
      fix-bootstrap.sh
  control-lambda/
  docker/
```
