# Code3 Workspace

> 完整的 Code3 开发和测试工作区

## 快速开始

### 1. 配置环境变量

复制模板文件并填入你的密钥：

```bash
cp .env.template .env
```

编辑 `.env` 文件，填入以下信息：

- `GITHUB_PERSONAL_ACCESS_TOKEN`: 你的 GitHub Personal Access Token
  - 获取地址：https://github.com/settings/tokens
  - 权限要求：`repo` (full control of private repositories)

- `APTOS_PRIVATE_KEY`: 你的 Aptos 私钥
  - 获取方式：`cat ~/.aptos/config.yaml | grep private_key`
  - 或创建新账户：`aptos init --network testnet`

### 2. 配置 MCP 服务器

本项目已包含 `.mcp.json` 配置文件，定义了两个 MCP 服务器：

#### aptos-chain-mcp
- **功能**: 与 Aptos 区块链交互（创建赏金、接受赏金、领取奖励等）
- **包名**: `@code3-team/aptos-chain-mcp`
- **安装方式**: 自动通过 npx 安装

#### GitHub Copilot MCP
- **功能**: GitHub 仓库操作（创建 Issue、PR、Fork 等）
- **连接方式**: HTTP transport 连接到 GitHub Copilot API
- **认证**: 通过 `GITHUB_PERSONAL_ACCESS_TOKEN` 环境变量

### 3. 验证配置

在 Claude Code 中测试 MCP 服务器是否正常工作：

```
User: 列出 aptos-chain 可用的工具
```

预期输出：
```
create_bounty, accept_bounty, submit_pr, mark_merged, claim_payout, cancel_bounty,
get_bounty, get_bounty_by_issue_hash, list_bounties, get_bounties_by_sponsor, get_bounties_by_winner
```

```
User: 列出 github 可用的工具
```

预期输出：
```
create_issue, update_issue, create_pr, merge_pr, fork, add_comment
```

## 项目结构

```
Code3-Workspace/
├── .mcp.json            # MCP 服务器配置
├── .env.template        # 环境变量模板
├── .env                 # 环境变量（不要提交到 git）
├── .gitignore           # Git 忽略文件
├── LICENSE              # MIT 许可证
└── README.md            # 本文件
```

## 相关链接

- **MCP 包文档**:
  - [@code3-team/aptos-chain-mcp](https://www.npmjs.com/package/@code3-team/aptos-chain-mcp)
  - [@code3-team/spec-kit-mcp](https://www.npmjs.com/package/@code3-team/spec-kit-mcp)

- **Claude Code MCP 文档**: https://docs.claude.com/en/docs/claude-code/mcp

- **Aptos 文档**: https://aptos.dev

- **GitHub PAT 文档**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## 安全提示

⚠️ **重要**: 请勿将 `.env` 文件提交到 git！该文件包含敏感信息（私钥、Token）。

已在 `.gitignore` 中排除：
```
.env
.env.*
!.env.template
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
