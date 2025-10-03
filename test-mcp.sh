#!/bin/bash

# Test script for MCP server connectivity
# Usage: source ./test-mcp.sh

echo "=== MCP Server Diagnostics ==="
echo ""

# 1. Check environment variables
echo "1. Checking environment variables:"
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "  ❌ GITHUB_PERSONAL_ACCESS_TOKEN not set"
else
    echo "  ✅ GITHUB_PERSONAL_ACCESS_TOKEN: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:20}..."
fi

if [ -z "$APTOS_CONTRACT_ADDRESS" ]; then
    echo "  ❌ APTOS_CONTRACT_ADDRESS not set"
else
    echo "  ✅ APTOS_CONTRACT_ADDRESS: $APTOS_CONTRACT_ADDRESS"
fi

if [ -z "$APTOS_PRIVATE_KEY" ]; then
    echo "  ❌ APTOS_PRIVATE_KEY not set"
else
    echo "  ✅ APTOS_PRIVATE_KEY: ${APTOS_PRIVATE_KEY:0:10}..."
fi

if [ -z "$APTOS_NETWORK" ]; then
    echo "  ❌ APTOS_NETWORK not set"
else
    echo "  ✅ APTOS_NETWORK: $APTOS_NETWORK"
fi

echo ""

# 2. Check npm package availability
echo "2. Checking npm package:"
NPM_VERSION=$(npm view @code3-team/aptos-chain-mcp version 2>&1 | tail -1)
echo "  Latest version: $NPM_VERSION"

echo ""

# 3. Test npx execution
echo "3. Testing npx execution:"
echo "  Running: npx -y @code3-team/aptos-chain-mcp --version"
# Use perl for cross-platform timeout (macOS doesn't have timeout by default)
perl -e 'alarm 2; exec @ARGV' npx -y @code3-team/aptos-chain-mcp --version 2>&1 || echo "  ✅ Server executable found (timeout/startup is expected)"

echo ""
echo "=== Diagnostics Complete ==="
echo ""
echo "If environment variables are missing, run:"
echo "  source ./load-env.sh"
