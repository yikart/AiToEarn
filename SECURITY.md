# Security Policy / 安全策略

## Credential Safety Warning / 凭证安全警告

AiToEarn automates publishing to platforms like Douyin, Kuaishou, and Xiaohongshu. It manages session logins, cookies, and tokens.
- **Never commit your configuration files containing cookies or secrets to public forks or repositories.**
- Keep your local `.env` and database files private.

## Supported Versions / 支持的版本

Only the latest stable release on the `main` branch is supported with security updates.

## Reporting a Vulnerability / 漏洞汇报

If you identify a security vulnerability (such as a local credential storage decryption exploit or session leak), please do **not** open a public issue.

Please report vulnerabilities privately by emailing the repository owner or using GitHub's private vulnerability reporting feature.

We will coordinate a patch swiftly.
