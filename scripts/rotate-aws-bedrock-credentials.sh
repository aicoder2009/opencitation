#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AWS SSO Credential Exporter & Auto-Rotator for OpenCitation
#
# Generates short-lived, time-expiring AWS credentials (STS session token)
# from your AWS SSO profile (profile: aigenius) and writes them to .env.local.
#
# Usage:
#   ./scripts/rotate-aws-bedrock-credentials.sh
# ==============================================================================

PROFILE="${AWS_PROFILE:-aigenius}"
ENV_FILE="/Users/karthickarun/Code/opencitation/.env.local"

echo "Checking AWS SSO session for profile [$PROFILE]..."

if ! aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
  echo ""
  echo "⚠️  AWS SSO session is expired or not logged in."
  echo "Please run: aws sso login --profile $PROFILE"
  echo ""
  exit 1
fi

echo "Exporting short-lived STS credentials..."
CREDS_ENV=$(aws configure export-credentials --profile "$PROFILE" --format env)

ACCESS_KEY_ID=$(echo "$CREDS_ENV" | grep 'AWS_ACCESS_KEY_ID=' | cut -d'=' -f2)
SECRET_ACCESS_KEY=$(echo "$CREDS_ENV" | grep 'AWS_SECRET_ACCESS_KEY=' | cut -d'=' -f2)
SESSION_TOKEN=$(echo "$CREDS_ENV" | grep 'AWS_SESSION_TOKEN=' | cut -d'=' -f2)
EXPIRATION=$(echo "$CREDS_ENV" | grep 'AWS_CREDENTIAL_EXPIRATION=' | cut -d'=' -f2 || true)

touch "$ENV_FILE"

# Remove previously written temporary AWS credentials
grep -v '^AWS_ACCESS_KEY_ID=' "$ENV_FILE" | \
grep -v '^AWS_SECRET_ACCESS_KEY=' | \
grep -v '^AWS_SESSION_TOKEN=' | \
grep -v '^AWS_BEDROCK_REGION=' | \
grep -v '^BEDROCK_NOVA_MODEL_ID=' > "${ENV_FILE}.tmp" || true

cat <<EOF >> "${ENV_FILE}.tmp"
AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
AWS_SESSION_TOKEN=${SESSION_TOKEN}
AWS_BEDROCK_REGION=us-east-1
BEDROCK_NOVA_MODEL_ID=amazon.nova-micro-v1:0
EOF

mv "${ENV_FILE}.tmp" "$ENV_FILE"

echo "✅ Success! Expiring Bedrock credentials written to .env.local"
if [ -n "$EXPIRATION" ]; then
  echo "Token Expiration: $EXPIRATION"
fi
