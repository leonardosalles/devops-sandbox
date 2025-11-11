
# Turbo POC — Complete

Inclui:
- Turborepo (pnpm)
- Next.js frontend
- Nest/Express-like backend (simple express server)
- AWS CDK infra: AppSync (GraphQL), Lambda resolver, S3 bucket
- Dockerfiles + docker-compose for local demo
- GitHub Actions workflow to deploy CDK to us-east-1
- scripts/dev.sh helper to run apps locally

## Rodando local (sem AWS)
1. Instale pnpm e turbo:
   - `corepack enable && corepack prepare pnpm@8.8.0 --activate`
2. Instale dependências:
   - `pnpm -w install`
3. Rode o mock AppSync (pode usar um server simples) ou use o docker-compose:
   - `docker-compose up --build`
   - isso expõe um placeholder em http://localhost:20002 para testes locais
4. Ou rode com turbo localmente:
   - `./scripts/dev.sh`

## Deploy na AWS (us-east-1)
1. Configure secrets AWS no GitHub ou configure AWS CLI localmente.
2. Exemplo local:
   - `export AWS_REGION=us-east-1; export ENV=dev`
   - `cd infra/cdk && pnpm install && pnpm build && npx cdk deploy --all --require-approval never`

