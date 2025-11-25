# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Overview
- This repo is a collection of standalone PowerShell scripts for Microsoft 365/Azure administration (Exchange Online, SharePoint, Graph, Teams, Intune, Azure, Defender, Windows 10). Scripts live at the repository root; there is no build system or project scaffolding.
- Common naming groups:
  - o365-* (Microsoft 365/Exchange/SharePoint tasks),
  - graph-* and mggraph-* (Microsoft Graph tasks),
  - az-* (Azure/Azure Sentinel),
  - win10-* (Windows device reporting),
  - utility scripts (e.g., save-cred-file.ps1), plus a few precompiled helper .exe tools.
- Many “connect” scripts bootstrap module installation/updates and interactive login for their target service.

Common commands
- One-time setup (Windows PowerShell, elevated):
  - powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\o365-setup.ps1
  - Installs/updates core modules used across scripts: AzureAD, AIPService, MicrosoftTeams, Microsoft.Online.SharePoint.PowerShell, MSOnline, PowerShellGet, ExchangeOnlineManagement, Az, PnP.PowerShell, Microsoft.Graph, WindowsAutoPilotIntune, O365CentralizedAddInDeployment, Microsoft.PowerApps.* (Administration and PowerShell), MSCommerce.
- Connect to common services (run from this repo directory in PowerShell):
  - Microsoft Online (MSOL): .\o365-connect.ps1 [-noupdate] [-noprompt] [-debug]
  - Exchange Online (V2): .\o365-connect-exo.ps1 [-noupdate] [-noprompt] [-debug]
  - Microsoft Graph: .\mggraph-connect.ps1 [-noupdate] [-noprompt] [-debug]
  - SharePoint Online admin: .\o365-connect-spo.ps1 [-noupdate] [-noprompt] [-debug]
  - PnP PowerShell: .\o365-connect-pnp.ps1 [-noupdate] [-noprompt] [-debug]
  - Azure: .\az-connect.ps1 or .\az-connect-si.ps1 [-noupdate] [-noprompt] [-debug]
- Run a script (example):
  - .\graph-users-get.ps1
  - Most scripts prompt for sign-in if a connection isn’t already established by a connect script.
- Debug logging:
  - Many scripts support -debug, which starts a transcript saved in the parent directory (e.g., ..\mggraph-connect.txt, ..\o365-connect-exo.txt).
- Execution policy:
  - Many scripts include the note to enable per-user script execution if needed: Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force

Build/lint/tests
- Build: not applicable (scripts run directly).
- Lint: no linter configured in-repo.
- Tests: no test suite present; running a single test is not applicable.

High-level architecture and patterns
- Flat script toolbox: no modules (.psm1/.psd1) or test directories; each script is self-contained for its task.
- Connect-first workflow: “connect” scripts ensure the relevant module is installed (optionally elevating with Start-Process -Verb RunAs on Windows), import it, then connect to the service. Task scripts assume an existing connection or will prompt to authenticate.
- Common parameters across connect scripts: -noprompt (skip interactive prompts), -noupdate (skip gallery version checks), -debug (enable transcript logging).
- Platform notes: Several scripts use Windows-specific features (Start-Process -Verb RunAs, Out-GridView, MSOnline module). Cross-platform-friendly scripts generally use Microsoft.Graph and ExchangeOnlineManagement. If running on non-Windows, prefer scripts that don’t rely on Windows-only modules/features.
- Included helper binaries: a few precompiled .exe tools exist alongside scripts (e.g., graph-*-*.exe, az-keyvault-saveto.exe) and are invoked directly when needed.

Important repo docs
- README: points to further docs/wiki: https://github.com/directorcia/Office365/wiki
- GitHub Copilot instructions (.github/copilot-instructions.md): For Azure-related work, apply Azure best practices when generating code or commands.
- Additional references: best-practices.txt contains curated links to Microsoft 365/Azure security and operations guidance.

Notes for working here
- Scripts are intended to be executed individually; choose the relevant connect script first, then run the task script you need.
- When elevating or installing modules on Windows, run PowerShell as Administrator.

Optional terminal UI (Ink)
- A minimal TUI is provided under tui/ to help run connect and task scripts.
  - cd tui && npm install
  - npm run dev (interactive TUI)
- The TUI scans the parent directory for .ps1 files. Override the PowerShell binary with PWSH_BIN if needed (default: "pwsh" on non-Windows, "powershell" on Windows).
