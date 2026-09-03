# Global Skills Recovery Design

## Objective

Preserve Toby's global AI skills, engineering-learning rules, and safe tool instructions in OneDrive so they can be restored on a reformatted Windows machine or a new Mac after OneDrive and the tools are installed.

## Scope

The recovery bundle covers:

- the canonical `toby-engineering-learning-system.md`
- global `SKILL.md` libraries for Copilot, OpenCode, and Monica Code/Freebuff
- global instruction adapters for Codex, Copilot, OpenCode, Monica Code, Freebuff, Zed, and Antigravity
- a manifest describing bundle version, source paths, destination paths, and excluded data
- Windows and macOS bootstrap scripts
- timestamped backup/restore logs

It does not include credentials, auth tokens, cookies, databases, caches, installed binaries, `node_modules`, or app installers.

## Architecture

OneDrive is the durable storage layer. A recovery folder contains a portable bundle and platform scripts:

```text
OneDrive/Toby-AI-Environment/
  manifest.json
  files/
    canonical/toby-engineering-learning-system.md
    copilot/skills/...
    opencode/skills/...
    manicode/skills/...
    adapters/...
  windows/
    bootstrap.ps1
    install-startup-task.ps1
  macos/
    bootstrap.sh
    install-launch-agent.sh
  logs/
```

The local machine keeps its normal tool-specific paths. The bundle stores relative copies, avoiding machine-specific absolute paths except in the manifest and scripts.

## Backup behavior

The backup command copies approved files from the local global paths into the OneDrive bundle. It excludes secrets, volatile state, caches, binaries, databases, and dependency directories. It creates the destination folder if needed and reports every source that is missing rather than silently treating missing data as success.

Backup is idempotent and safe to run repeatedly. It does not delete unrelated OneDrive content.

## Restore behavior

The restore command waits for the OneDrive bundle to become available, validates the manifest, creates destination directories, and copies the bundle into the correct global paths. Existing local files are preserved unless the bundle contains a newer version; conflicts are logged. Restore never overwrites credentials or unrelated files.

Windows registers a per-user Task Scheduler logon task. macOS registers a per-user LaunchAgent. Both retry while OneDrive is still syncing and write a timestamped log. Automatic startup is best-effort; the manual command remains the recovery fallback.

The scripts do not install applications. App installation is intentionally left to the operating system/package manager because application names, permissions, and distribution methods vary across Windows and macOS.

## Verification

The implementation will include:

- manifest validation
- dry-run support
- explicit source-missing and OneDrive-unavailable errors
- backup/restore logs
- a verification command that checks expected files and skill counts
- shell/PowerShell syntax checks where available

## Performance and safety

Only changed files should be copied during routine backup/restore. The canonical rules file is kept compact so agent startup remains fast. No network service or project dependency is introduced; the system uses local file copies and the already-signed-in OneDrive client.

## Definition of done

- A backup command creates a complete OneDrive recovery bundle.
- A restore command reconstructs the global skill/config layout on Windows.
- A macOS bootstrap reconstructs the same logical layout using macOS paths.
- Logon/startup registration is available on both platforms.
- Missing tools do not prevent restoring the skills that do exist.
- Secrets and volatile machine state are excluded.
- Verification reports the restored files and any limitations clearly.
