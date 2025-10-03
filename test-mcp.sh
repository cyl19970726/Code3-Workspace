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

# 2. Check pnpm global bin directory
echo "2. Checking pnpm setup:"
if [ -z "$PNPM_HOME" ]; then
    echo "  ❌ PNPM_HOME not set"
else
    echo "  ✅ PNPM_HOME: $PNPM_HOME"
fi

echo ""

# 3. Check MCP commands availability
echo "3. Checking MCP commands:"
if command -v aptos-chain-mcp &> /dev/null; then
    echo "  ✅ aptos-chain-mcp: $(which aptos-chain-mcp)"
else
    echo "  ❌ aptos-chain-mcp not found in PATH"
fi

if command -v spec-kit-mcp &> /dev/null; then
    echo "  ✅ spec-kit-mcp: $(which spec-kit-mcp)"
else
    echo "  ❌ spec-kit-mcp not found in PATH"
fi

echo ""
echo "=== Diagnostics Complete ==="
echo ""
echo "If environment variables are missing, run:"
echo "  source ./load-env.sh"
