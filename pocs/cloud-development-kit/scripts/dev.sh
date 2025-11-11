
#!/usr/bin/env bash
# Simple helper to run both apps locally with turbo in dev mode
export NEXT_PUBLIC_GRAPHQL_URL=http://localhost:20002/graphql
export APPSYNC_URL=http://localhost:20002/graphql
pnpm -w -r --filter ./apps/frontend dev &
pnpm -w -r --filter ./apps/backend start:dev &
wait
