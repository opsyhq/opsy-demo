# Notifications Service

A lightweight TypeScript service for sending notifications. Uses Hono for HTTP and AWS SQS for async message processing.

## Stack

- TypeScript, Hono, AWS SDK v3
- SQS queue managed via Opsy (backend stack, dev environment)

## Config

- `QUEUE_URL` — SQS queue URL (from Opsy stack outputs)
- `AWS_REGION` — defaults to us-east-1
