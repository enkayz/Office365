# Compliance CLI

A quality-of-life command-line interface for Microsoft 365 compliance and security tasks. This tool interacts directly with Microsoft Graph and Office 365 Management APIs, avoiding the need for PowerShell modules.

## Prerequisites

- Node.js (v18+ recommended)
- An Azure AD Application Registration with appropriate permissions (e.g., `Directory.Read.All`, `AuditLog.Read.All`, `Organization.Read.All`).

## Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure environment variables:
    Copy `.env.sample` to `.env` and fill in your Azure AD credentials.
    ```bash
    cp .env.sample .env
    ```
    
    Edit `.env`:
    ```ini
    AZURE_TENANT_ID=<your-tenant-id>
    AZURE_CLIENT_ID=<your-client-id>
    AZURE_CLIENT_SECRET=<your-client-secret>
    ```

## Usage

You can run the tool directly using `npm run dev` (using tsx) or build it first.

### Development
```bash
npm run dev -- [command] [options]
```

### Production
Build the project:
```bash
npm run build
```
Run the built CLI:
```bash
npm start -- [command] [options]
# OR
node dist/index.js [command] [options]
```

## Commands

| Command | Description | Options |
| :--- | :--- | :--- |
| `auth-test` | Verify authentication and print tenant info | |
| `quickcheck` | Quick visibility check: roles, labels, audit API | |
| `licensing-skus` | List subscribed SKUs | `--only-compliance` |
| `licensing-users` | List users and their assigned license SKUs | `--top <n>` |
| `roles-list` | List directory roles (active) | `--filter <q>` |
| `role-members` | List members of a directory role | `--role-id <id>` (required) |
| `roles-audit` | Audit presence of Purview/DLP-relevant roles | `--members` |
| `labels-list` | List sensitivity labels (Graph beta) | |
| `audit-list-subs` | List Office 365 Management Activity API subscriptions | |
| `audit-start` | Start a subscription for a content type | `--type <contentType>` (required) |
| `audit-list-content` | List available content blobs for a time window | `--type`, `--start`, `--end` |
| `audit-fetch` | Fetch audit content blobs to files or stdout | `--type`, `--since`, `--start`, `--end`, `--out`, `--stdout`, `--concurrency` |
| `diagnose` | Run a best-practices diagnosis of Purview Sensitivity Labels | |

### Examples

**Run Diagnosis:**
```bash
npm run dev -- diagnose
```

**Check Compliance SKUs:**
```bash
npm run dev -- licensing-skus --only-compliance
```

**Audit DLP Roles:**
```bash
npm run dev -- roles-audit --members
```

**Fetch Audit Logs (Last 24h):**
```bash
npm run dev -- audit-fetch --type DLP.All --since 24h --out ./logs
```
