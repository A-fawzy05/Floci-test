# Floci Chat

Real-time 1:1 chat app. Plain HTML/CSS/JS frontend, Node.js + Express backend,
`ws` library for the WebSocket transport. Backend talks to **Floci**
(local AWS emulator, https://floci.io) via the AWS SDK v3 for:

- **Cognito** — sign up / sign in
- **DynamoDB** — users directory + messages
- **S3** — chat attachments (presigned upload/download)

## 0. What Floci actually is (read this first)

Floci is **not** AWS and **not** this app's backend — it's a separate program
that pretends to be AWS. It runs in Docker, listens on one port
(`http://localhost:4566`), and understands the real AWS wire protocol. That
means the normal `aws` CLI and the AWS SDK this app uses talk to it exactly
as if it were really AWS — same commands, same request/response shapes, just
pointed at `localhost` instead of `amazonaws.com`, and no AWS account or
billing involved.

`floci-cli` (the `floci` command) only starts/stops/inspects that Docker
container. It never creates S3 buckets, Cognito pools, etc. itself — you
create those the normal way, with the `aws` CLI, just aimed at Floci. That's
exactly what step 2 below does.

**Prerequisites** — check both before anything else:

```sh
command -v floci && floci version     # floci-cli installed?
docker info >/dev/null && echo ok      # Docker daemon reachable?
```

- `floci` missing? Install it: `iwr https://floci.io/install.ps1 | iex`
  (Windows, PowerShell, no admin needed) or see https://floci.io for other
  platforms.
- Docker not reachable? Floci runs as a container — start Docker Desktop
  (or your Docker daemon) first.

## 1. Start Floci

```sh
floci aws start --detach       # pulls the image first time, then starts
floci aws wait --timeout 2m    # blocks until it's actually ready to use
floci aws status -o json       # sanity check: "state": "running"
```

This app always uses the AWS tree (`floci aws`), never `floci` bare, because
bare commands depend on a config default you might not have set. Everything
below assumes the container stays up at the default `http://localhost:4566`
with region `us-east-1` and the fake credentials `test`/`test` — exactly
what `.env.example` already has baked in, so there's nothing to copy from
Floci's output for this app. (If anything looks off, `floci aws env -o text`
prints the exact values Floci expects a client to use.)

Hit a problem starting it? `floci aws doctor -o json` lists what's wrong;
`floci aws logs --tail 100` shows recent server logs.

## 2. Create AWS resources manually (against Floci)

These are real AWS CLI commands — Floci just happens to be listening on the
other end instead of Amazon. Point the AWS CLI at it for this terminal
session:

```sh
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```

(Equivalently: `eval "$(floci aws env -o text)"` sets the same four
variables for you — use whichever you find easier to remember.)

**Cognito User Pool + App Client** (note the IDs printed back):

```
aws cognito-idp create-user-pool --pool-name ChatPool
aws cognito-idp create-user-pool-client --user-pool-id <POOL_ID> --client-name ChatClient --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

**DynamoDB tables** (names must match `.env`):

```
aws dynamodb create-table --table-name ChatUsers \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name ChatMessages \
  --attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=sortKey,AttributeType=S \
  --key-schema AttributeName=conversationId,KeyType=HASH AttributeName=sortKey,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

**S3 bucket**:

```
aws s3api create-bucket --bucket chat-attachments
```

**Check it actually worked** — ask Floci what's there, the same way you'd
ask real AWS:

```sh
aws cognito-idp list-user-pools --max-results 10
aws dynamodb list-tables
aws s3api list-buckets
```

You should see `ChatPool`, `ChatUsers`/`ChatMessages`, and
`chat-attachments` in the respective outputs. If a command instead errors
with something like "could not connect", Floci isn't up — go back to step 1.

## 3. Configure the app

```
cp .env.example .env
```

Fill in `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from step 2. Adjust
table/bucket names only if you created them with different names.

## 4. Run

```
npm install
npm start
```

Open `http://localhost:3000` (or whatever `PORT` is set to). Sign up two
users in two browser tabs/windows, log in both, pick each other from the
sidebar, chat.

## EC2 build test

The app just listens on `0.0.0.0:$PORT` with no assumptions beyond that —
running it on an EC2 instance (pointed at a reachable Floci endpoint) needs
no code changes, only `.env` values for that host.

## Stopping Floci

```sh
floci aws stop --remove
```

State is in-memory only (no `--persist` was used above), so this wipes the
Cognito pool, DynamoDB tables and S3 bucket too — you'd redo step 2 next
time. That's fine for testing; if you want data to survive a restart, start
Floci with `floci aws start --persist ./floci-data` instead.

## Notes

- API Gateway WebSocket is intentionally not used — this app's real-time
  transport is a direct `ws` WebSocket server in Node, not AWS API Gateway.
- Auth uses Cognito `SignUp` + `AdminConfirmSignUp` (auto-confirm, no email
  verification step) then `InitiateAuth` (`USER_PASSWORD_AUTH`) for login.
  Every authenticated request/connection is checked with Cognito `GetUser`.
- Floci problems (not this app): `floci aws doctor -o json`, `floci aws logs`,
  or https://github.com/floci-io/floci/issues.
