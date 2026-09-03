# Global Skills Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a portable OneDrive recovery bundle that backs up and restores Toby's global skills and tool instructions on Windows and macOS, with automatic sign-in bootstrap and a manual fallback.

**Architecture:** A small cross-platform command-line tool owns manifest validation, safe file selection, copy-if-changed behavior, dry runs, logging, backup, restore, and verification. Platform scripts call that tool and register per-user startup hooks. The bundle stores relative paths and never stores credentials, caches, databases, binaries, or dependencies.

**Tech Stack:** PowerShell 5.1+, POSIX shell, Python 3.11+ standard library, JSON, Windows Task Scheduler, macOS LaunchAgent, OneDrive local folder.

## Global Constraints

- Preserve the normal global tool paths; do not require project-local copies.
- Exclude credentials, auth tokens, cookies, databases, caches, installed binaries, `node_modules`, and dependency environments.
- Do not delete unrelated OneDrive content or overwrite credentials.
- Missing sources must be reported explicitly; missing one tool must not block other tools.
- Automatic startup is best-effort; manual backup and restore commands must remain available.
- Only changed files should be copied during routine operations.
- Do not install applications.

---

### Task 1: Create the portable bundle manifest and shared engine

**Files:**
- Create: `tools/toby-recovery/recovery.py`
- Create: `tools/toby-recovery/manifest.template.json`
- Create: `tools/toby-recovery/test_recovery.py`

**Interfaces:**
- Produces CLI commands: `python recovery.py backup --bundle PATH [--dry-run]`, `restore`, and `verify`.
- Produces manifest fields: `schemaVersion`, `bundleName`, `sources`, `excludedNames`, and `excludedExtensions`.
- `sources` entries contain `id`, `sourceCandidates`, `bundlePath`, and `restoreTargets`.

- [ ] **Step 1: Write failing tests for safe selection, manifest validation, and copy-if-changed**

```python
def test_excluded_files_are_not_selected(tmp_path):
    root = tmp_path / "source"
    (root / "skills").mkdir(parents=True)
    (root / "skills" / "SKILL.md").write_text("ok", encoding="utf-8")
    (root / "auth.json").write_text("secret", encoding="utf-8")
    selected = recovery.select_files(root, {"auth.json"}, {".db"})
    assert [path.name for path in selected] == ["SKILL.md"]

def test_copy_if_changed_does_not_rewrite_same_file(tmp_path):
    source = tmp_path / "source.txt"
    target = tmp_path / "target.txt"
    source.write_text("same", encoding="utf-8")
    target.write_text("same", encoding="utf-8")
    before = target.stat().st_mtime_ns
    assert recovery.copy_if_changed(source, target) is False
    assert target.stat().st_mtime_ns == before

def test_manifest_rejects_missing_required_fields():
    with pytest.raises(recovery.ManifestError):
        recovery.validate_manifest({"schemaVersion": 1})
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `python -m pytest tools/toby-recovery/test_recovery.py -q`

Expected: FAIL because `recovery.py` and its public functions do not exist.

- [ ] **Step 3: Implement the engine**

Implement `load_manifest(path)`, `validate_manifest(data)`, `select_files(root, excluded_names, excluded_extensions)`, `copy_if_changed(source, target)`, `write_log(bundle, operation, entries)`, and CLI parsing with explicit non-zero errors for invalid manifests or unavailable bundle paths. Use `pathlib`, `hashlib` only when metadata differs, and `shutil.copy2`; never follow files outside the declared source root.

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run: `python -m pytest tools/toby-recovery/test_recovery.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add tools/toby-recovery
git commit -m "feat: add portable recovery engine"
```

### Task 2: Define safe sources and implement backup/restore/verify

**Files:**
- Modify: `tools/toby-recovery/manifest.template.json`
- Modify: `tools/toby-recovery/recovery.py`
- Modify: `tools/toby-recovery/test_recovery.py`

**Interfaces:**
- Backup copies each configured source into `files/<source-id>/`.
- Restore copies from `files/<source-id>/` into the first valid restore target, preserving a newer local file and logging conflicts.
- Verify returns exit code `0` only when the manifest is valid and all available source groups have expected files.

- [ ] **Step 1: Add source-group tests**

```python
def test_restore_preserves_newer_local_file(tmp_path):
    bundle = tmp_path / "bundle"
    target = tmp_path / "target.md"
    bundled = bundle / "file.md"
    bundle.mkdir()
    bundled.write_text("older", encoding="utf-8")
    target.write_text("newer", encoding="utf-8")
    os.utime(target, (target.stat().st_atime, bundled.stat().st_mtime - 10))
    result = recovery.restore_file(bundled, target)
    assert result.status == "conflict"
    assert target.read_text(encoding="utf-8") == "newer"

def test_backup_reports_missing_source_without_aborting(tmp_path):
    result = recovery.backup_sources(
        manifest={"sources": [
            {"id": "present", "sourceCandidates": [str(tmp_path)], "bundlePath": "files/present"},
            {"id": "missing", "sourceCandidates": [str(tmp_path / "missing")], "bundlePath": "files/missing"},
        ]},
        bundle=tmp_path / "bundle",
    )
    assert result.missing == ["missing"]
    assert (tmp_path / "bundle" / "files" / "present").exists()
```

- [ ] **Step 2: Run tests and confirm the new cases fail**

Run: `python -m pytest tools/toby-recovery/test_recovery.py -q`

Expected: FAIL on source-group behavior.

- [ ] **Step 3: Add the manifest source groups**

Configure canonical rules, Copilot skills, OpenCode skills, Monica Code skills, Freebuff adapters, Codex `AGENTS.md`, Copilot instructions, OpenCode/Monica/Freebuff/Zed `AGENTS.md`, Antigravity `GEMINI.md`, and the shared `C:\Users\USER\AGENTS.md`/`C:\Dev\AGENTS.md` adapters. Add exclusions for `auth.json`, `*.db`, `*.sqlite*`, `node_modules`, `.venv`, caches, lock files belonging to runtime state, and binaries.

- [ ] **Step 4: Implement backup, restore, and verify commands**

Use environment expansion for Windows (`USERPROFILE`, `OneDrive`) and macOS (`HOME`, `OneDrive`, `OneDrive - *` candidates). Copy only regular files, preserve relative structure, create parent directories, and log `copied`, `unchanged`, `missing`, `conflict`, and `error` statuses. Add `--dry-run` to all commands.

- [ ] **Step 5: Run tests and verify against the current installation**

Run:

```text
python -m pytest tools/toby-recovery/test_recovery.py -q
python tools/toby-recovery/recovery.py verify --bundle "C:\Users\USER\OneDrive - COVENANT UNIVERSITY COMMUNITY\Toby-AI-Environment"
```

Expected: tests pass; verification reports current source availability and does not print credentials.

- [ ] **Step 6: Commit**

```text
git add tools/toby-recovery
git commit -m "feat: back up and restore global tool state"
```

### Task 3: Add Windows OneDrive bootstrap and logon registration

**Files:**
- Create: `tools/toby-recovery/windows/bootstrap.ps1`
- Create: `tools/toby-recovery/windows/install-startup-task.ps1`
- Create: `tools/toby-recovery/windows/uninstall-startup-task.ps1`
- Create: `tools/toby-recovery/windows/README.md`

**Interfaces:**
- `bootstrap.ps1 -Operation backup|restore|verify [-BundlePath PATH] [-DryRun]`.
- `install-startup-task.ps1 -BundlePath PATH` registers a per-user task named `TobyGlobalSkillsRestore`.
- `uninstall-startup-task.ps1` removes only that named task.

- [ ] **Step 1: Implement bootstrap argument validation and OneDrive discovery**

Resolve the selected OneDrive path from `OneDrive`, `OneDriveCommercial`, `OneDriveConsumer`, then the explicit bundle path. Wait up to 10 minutes for `manifest.json`, returning a non-zero exit code with a log entry if unavailable. Invoke the shared Python engine using `py -3` when available, otherwise `python`.

- [ ] **Step 2: Implement startup registration**

Use `Register-ScheduledTask` with `AtLogOn`, the current user, and a 3-minute delay. Register only under the current user; do not request elevation or store credentials.

- [ ] **Step 3: Add syntax and dry-run checks**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -Command "& { [System.Management.Automation.Language.Parser]::ParseFile('tools/toby-recovery/windows/bootstrap.ps1',[ref]$null,[ref]$null); [System.Management.Automation.Language.Parser]::ParseFile('tools/toby-recovery/windows/install-startup-task.ps1',[ref]$null,[ref]$null) }"`

Expected: no parser errors.

- [ ] **Step 4: Commit**

```text
git add tools/toby-recovery/windows
git commit -m "feat: add Windows recovery bootstrap"
```

### Task 4: Add macOS OneDrive bootstrap and LaunchAgent registration

**Files:**
- Create: `tools/toby-recovery/macos/bootstrap.sh`
- Create: `tools/toby-recovery/macos/install-launch-agent.sh`
- Create: `tools/toby-recovery/macos/uninstall-launch-agent.sh`
- Create: `tools/toby-recovery/macos/README.md`

**Interfaces:**
- `bootstrap.sh backup|restore|verify [--bundle PATH] [--dry-run]`.
- `install-launch-agent.sh --bundle PATH` installs `com.toby.global-skills-recovery.plist`.
- `uninstall-launch-agent.sh` unloads and removes only that plist.

- [ ] **Step 1: Implement portable path discovery**

Search `$OneDrive`, `$HOME/OneDrive`, and `$HOME/Library/CloudStorage/OneDrive*` for `Toby-AI-Environment/manifest.json`. Wait with bounded retries, then invoke `python3 recovery.py`.

- [ ] **Step 2: Implement LaunchAgent registration**

Write a user-level plist with `RunAtLoad`, `StartInterval` 900, standard output/error logs inside the bundle, and an argument list that calls `bootstrap.sh restore`. Do not use `sudo` or system-wide launch daemons.

- [ ] **Step 3: Run shell syntax checks**

Run: `sh -n tools/toby-recovery/macos/bootstrap.sh tools/toby-recovery/macos/install-launch-agent.sh tools/toby-recovery/macos/uninstall-launch-agent.sh`

Expected: exit code `0`.

- [ ] **Step 4: Commit**

```text
git add tools/toby-recovery/macos
git commit -m "feat: add macOS recovery bootstrap"
```

### Task 5: Build the initial OneDrive bundle and document recovery

**Files:**
- Create: `tools/toby-recovery/backup-current-machine.ps1`
- Create: `tools/toby-recovery/backup-current-machine.sh`
- Create: `tools/toby-recovery/README.md`
- Create: `tools/toby-recovery/RECOVERY-CHECKLIST.md`

**Interfaces:**
- Current-machine scripts create/update `Toby-AI-Environment` in the selected OneDrive folder.
- README documents install prerequisites, backup, restore, startup registration, verification, and limitations.

- [ ] **Step 1: Add current-machine backup wrappers**

The Windows wrapper uses `C:\Users\USER\OneDrive - COVENANT UNIVERSITY COMMUNITY\Toby-AI-Environment` when it exists, otherwise the first discovered OneDrive root. The macOS wrapper discovers the first matching OneDrive folder. Both run a dry-run first, print the excluded categories, then require an explicit `-Confirm`/`--confirm` before writing.

- [ ] **Step 2: Run a dry-run backup**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/toby-recovery/backup-current-machine.ps1 -DryRun`

Expected: source inventory is printed; credentials, databases, caches, binaries, and dependencies are listed as excluded.

- [ ] **Step 3: Run the confirmed backup**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/toby-recovery/backup-current-machine.ps1 -Confirm`

Expected: `manifest.json`, `files/`, platform scripts, and logs exist in `Toby-AI-Environment`.

- [ ] **Step 4: Verify the generated bundle**

Run: `python tools/toby-recovery/recovery.py verify --bundle "C:\Users\USER\OneDrive - COVENANT UNIVERSITY COMMUNITY\Toby-AI-Environment"`

Expected: verification succeeds and reports skill counts for each available library.

- [ ] **Step 5: Commit documentation and wrappers**

```text
git add tools/toby-recovery
git commit -m "docs: document global skills recovery"
```

### Task 6: Final recovery drill and safety review

**Files:**
- Modify: `tools/toby-recovery/README.md`
- Modify: `tools/toby-recovery/RECOVERY-CHECKLIST.md`

- [ ] **Step 1: Test restore into an isolated temporary HOME**

Copy the bundle to a temporary directory, set the tool path environment variables to temporary destinations, run `restore --dry-run`, and confirm no real credentials or global files are changed.

- [ ] **Step 2: Test idempotence**

Run backup and restore twice. Confirm the second run reports unchanged files and does not rewrite them.

- [ ] **Step 3: Test missing-tool tolerance**

Temporarily remove one source candidate from the test manifest and confirm the other groups still back up and restore while verification reports the missing group.

- [ ] **Step 4: Test conflict preservation**

Create a newer local target and an older bundle copy. Confirm restore logs a conflict and leaves the newer target untouched.

- [ ] **Step 5: Review security exclusions**

Search the generated bundle for `auth.json`, `.env`, `.db`, `.sqlite`, `node_modules`, `.venv`, and known credential names. Expected: no matches.

- [ ] **Step 6: Commit final checklist**

```text
git add tools/toby-recovery
git commit -m "test: validate skills recovery workflow"
```
