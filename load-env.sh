#!/bin/bash

# Load environment variables from .env file
# Usage: source ./load-env.sh

# Get script directory (works when sourced or executed)
if [ -n "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
else
    SCRIPT_DIR="$(pwd)"
fi

ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    echo "Please copy .env.template to .env and fill in your credentials"
    return 1
fi

# Setup pnpm global bin directory
export PNPM_HOME="/Users/hhh0x/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Read .env file and export variables
set -a
source "$ENV_FILE"
set +a

echo "✅ Environment variables loaded from .env"
echo ""
echo "Loaded variables:"
echo "  - GITHUB_PERSONAL_ACCESS_TOKEN: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:20}..."
echo "  - APTOS_NETWORK: $APTOS_NETWORK"
echo "  - APTOS_CONTRACT_ADDRESS: $APTOS_CONTRACT_ADDRESS"
echo "  - APTOS_PRIVATE_KEY: ${APTOS_PRIVATE_KEY:0:10}..."
echo "  - TEST_REPO: $TEST_REPO"
echo ""
echo "You can now start Claude Code with MCP servers configured."
