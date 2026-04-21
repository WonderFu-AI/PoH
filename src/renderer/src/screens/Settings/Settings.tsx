import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../components/ThemeProvider";
import { useI18n } from "../../components/useI18n";
import { APP_LOCALES } from "../../../../shared/i18n";
import { THEME_OPTIONS } from "../../constants";
import { Download, Upload, FileText, Plus, Trash } from "lucide-react";
import { ChatBubble } from "../../assets/icons";
import icon from "../../assets/icon.png";

// Read cached values from localStorage for instant display
function getCachedVersion(): string | null {
  try {
    return localStorage.getItem("hermes-version-cache");
  } catch {
    return null;
  }
}

function getCachedOpenClaw(): { found: boolean; path: string | null } | null {
  try {
    const raw = localStorage.getItem("hermes-openclaw-cache");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Profile types ────────────────────────────────────────

interface ProfileInfo {
  name: string;
  path: string;
  isDefault: boolean;
  isActive: boolean;
  model: string;
  provider: string;
  hasEnv: boolean;
  hasSoul: boolean;
  skillCount: number;
  gatewayRunning: boolean;
}

function AgentAvatar({ name }: { name: string }): React.JSX.Element {
  if (name === "default") {
    return (
      <div className="agents-card-avatar agents-card-avatar-icon">
        <img src={icon} width={22} height={22} alt="" />
      </div>
    );
  }
  return (
    <div className="agents-card-avatar">{name.charAt(0).toUpperCase()}</div>
  );
}

// ── Settings component ───────────────────────────────────

function Settings({
  profile,
  onSelectProfile,
  onChatWith,
}: {
  profile?: string;
  onSelectProfile?: (name: string) => void;
  onChatWith?: (name: string) => void;
}): React.JSX.Element {
  const [hermesHome, setHermesHome] = useState("");
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  // ── Install status ─────────────────────────────────────
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  // ── Profile management ────────────────────────────────
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [cloneConfig, setCloneConfig] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadProfiles = useCallback(async (): Promise<void> => {
    const list = await window.hermesAPI.listProfiles();
    setProfiles(list);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function handleCreate(): Promise<void> {
    const name = newName.trim().toLowerCase();
    if (!name) return;
    setCreating(true);
    setCreateError("");
    const result = await window.hermesAPI.createProfile(name, cloneConfig);
    setCreating(false);
    if (result.success) {
      setShowCreate(false);
      setNewName("");
      loadProfiles();
    } else {
      setCreateError(result.error || t("agents.createFailed"));
    }
  }

  async function handleDelete(name: string): Promise<void> {
    const result = await window.hermesAPI.deleteProfile(name);
    if (result.success) {
      if (profile === name) onSelectProfile?.("default");
      loadProfiles();
    }
    setConfirmDelete(null);
  }

  async function handleSelect(name: string): Promise<void> {
    await window.hermesAPI.setActiveProfile(name);
    onSelectProfile?.(name);
    loadProfiles();
  }

  // ── PoH engine info ────────────────────────────────
  const [hermesVersion, setHermesVersion] = useState<string | null>(
    getCachedVersion,
  );
  const [appVersion, setAppVersion] = useState("");
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ── OpenClaw migration ───────────────────────────────
  const cachedClaw = getCachedOpenClaw();
  const [openclawFound, setOpenclawFound] = useState(
    cachedClaw?.found ?? false,
  );
  const [openclawPath, setOpenclawPath] = useState<string | null>(
    cachedClaw?.path ?? null,
  );
  const [migrationDismissed, setMigrationDismissed] = useState(
    () => localStorage.getItem("hermes-openclaw-dismissed") === "true",
  );
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState("");
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const migrationLogRef = useRef<HTMLPreElement>(null);

  // ── Backup / Import ─────────────────────────────────
  const [backingUp, setBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // ── Debug dump ──────────────────────────────────────
  const [dumpRunning, setDumpRunning] = useState(false);

  // ── Log viewer ──────────────────────────────────────
  const [logContent, setLogContent] = useState("");
  const [logFile, setLogFile] = useState("gateway.log");
  const [logPath, setLogPath] = useState("");
  const [logsExpanded, setLogsExpanded] = useState(false);

  const loadConfig = useCallback(async (): Promise<void> => {
    const [home, aVersion, installStatus] = await Promise.all([
      window.hermesAPI.getHermesHome(profile),
      window.hermesAPI.getAppVersion(),
      window.hermesAPI.checkInstall(),
    ]);
    setHermesHome(home);
    setAppVersion(aVersion);
    setInstalled(installStatus.installed);

    window.hermesAPI.getHermesVersion().then((v) => {
      setHermesVersion(v);
      if (v) {
        try {
          localStorage.setItem("hermes-version-cache", v);
        } catch {
          /* ignore */
        }
      }
    });

    if (localStorage.getItem("hermes-openclaw-dismissed") !== "true") {
      window.hermesAPI.checkOpenClaw().then((claw) => {
        setOpenclawFound(claw.found);
        setOpenclawPath(claw.path);
        try {
          localStorage.setItem("hermes-openclaw-cache", JSON.stringify(claw));
        } catch {
          /* ignore */
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleMigrate(): Promise<void> {
    setMigrating(true);
    setMigrationLog("");
    setMigrationResult(null);

    const cleanup = window.hermesAPI.onInstallProgress((p) => {
      setMigrationLog(p.log);
    });

    try {
      const result = await window.hermesAPI.runClawMigrate();
      cleanup();
      if (result.success) {
        setMigrationResult(
          "Migration complete! Your config, keys, and data have been imported.",
        );
        setOpenclawFound(false);
      } else {
        setMigrationResult(result.error || "Migration failed.");
      }
    } catch (err) {
      cleanup();
      setMigrationResult((err as Error).message || "Migration failed.");
    }
    setMigrating(false);
  }

  function handleDismissMigration(): void {
    localStorage.setItem("hermes-openclaw-dismissed", "true");
    setMigrationDismissed(true);
  }

  async function handleBackup(): Promise<void> {
    setBackingUp(true);
    setBackupResult(null);
    const result = await window.hermesAPI.runHermesBackup(profile);
    setBackingUp(false);
    if (result.success) {
      setBackupResult(`Backup created: ${result.path || "success"}`);
    } else {
      setBackupResult(result.error || "Backup failed.");
    }
  }

  async function handleImport(): Promise<void> {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".tar.gz,.tgz,.zip";
    input.onchange = async (): Promise<void> => {
      const file = input.files?.[0];
      if (!file) return;
      setImporting(true);
      setImportResult(null);
      const filePath = (file as File & { path: string }).path;
      const result = await window.hermesAPI.runHermesImport(filePath, profile);
      setImporting(false);
      if (result.success) {
        setImportResult("Import complete! Restart the app to apply changes.");
      } else {
        setImportResult(result.error || "Import failed.");
      }
    };
    input.click();
  }

  async function loadLogs(): Promise<void> {
    const result = await window.hermesAPI.readLogs(logFile, 300);
    setLogContent(result.content);
    setLogPath(result.path);
  }

  async function handleDoctor(): Promise<void> {
    setDoctorRunning(true);
    await window.hermesAPI.runHermesDoctor();
    setDoctorRunning(false);
  }

  function refreshVersion(): void {
    window.hermesAPI.refreshHermesVersion().then((v) => {
      setHermesVersion(v);
      if (v) {
        try {
          localStorage.setItem("hermes-version-cache", v);
        } catch {
          /* ignore */
        }
      }
    });
  }

  async function handleUpdateHermes(): Promise<void> {
    setUpdating(true);
    const result = await window.hermesAPI.runHermesUpdate();
    setUpdating(false);
    if (result.success) {
      refreshVersion();
    }
  }

  async function handleInstallHermes(): Promise<void> {
    setInstalling(true);
    await window.hermesAPI.startInstall();
    setInstalling(false);
    refreshVersion();
    const status = await window.hermesAPI.checkInstall();
    setInstalled(status.installed);
  }

  const parsedVersion = (() => {
    if (!hermesVersion) return null;
    const v = hermesVersion;
    const version = v.match(/v([\d.]+)/)?.[1] || "";
    const date = v.match(/\(([\d.]+)\)/)?.[1] || "";
    const python = v.match(/Python:\s*([\d.]+)/)?.[1] || "";
    const sdk = v.match(/OpenAI SDK:\s*([\d.]+)/)?.[1] || "";
    const updateMatch = v.match(/Update available:\s*(.+?)(?:\s*—|$)/);
    const updateInfo = updateMatch?.[1]?.trim() || null;
    return { version, date, python, sdk, updateInfo };
  })();

  return (
    <div className="settings-container">
      <h1 className="settings-header">{t("settings.title")}</h1>

      {/* ── Profiles ──────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">{t("settings.sections.hermesAgent")}</div>
        <div className="settings-hermes-info">
          <div className="settings-hermes-row">
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.engine")}</span>
              {hermesVersion === null ? (
                <span className="skeleton skeleton-sm" />
              ) : (
                <span className="settings-hermes-value">
                  {parsedVersion ? `v${parsedVersion.version}` : t("settings.notDetected")}
                </span>
              )}
            </div>
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.released")}</span>
              {hermesVersion === null ? (
                <span className="skeleton skeleton-sm" />
              ) : (
                <span className="settings-hermes-value">
                  {parsedVersion?.date || t("settings.notAvailable")}
                </span>
              )}
            </div>
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.desktop")}</span>
              {!appVersion ? (
                <span className="skeleton skeleton-sm" />
              ) : (
                <span className="settings-hermes-value">v{appVersion}</span>
              )}
            </div>
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.python")}</span>
              {hermesVersion === null ? (
                <span className="skeleton skeleton-sm" />
              ) : (
                <span className="settings-hermes-value">
                  {parsedVersion?.python || t("settings.notAvailable")}
                </span>
              )}
            </div>
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.openaiSdk")}</span>
              {hermesVersion === null ? (
                <span className="skeleton skeleton-sm" />
              ) : (
                <span className="settings-hermes-value">
                  {parsedVersion?.sdk || t("settings.notAvailable")}
                </span>
              )}
            </div>
            <div className="settings-hermes-detail">
              <span className="settings-hermes-label">{t("settings.home")}</span>
              {!hermesHome ? (
                <span className="skeleton skeleton-md" />
              ) : (
                <span className="settings-hermes-value settings-hermes-path">
                  {hermesHome}
                </span>
              )}
            </div>
          </div>
          {parsedVersion?.updateInfo && (
            <div className="settings-hermes-update-badge">
              {parsedVersion.updateInfo}
            </div>
          )}
          <div className="settings-hermes-actions">
            {!installed ? (
              <button
                className="btn btn-primary"
                onClick={handleInstallHermes}
                disabled={installing}
              >
                {installing ? t("settings.installing") : t("settings.installHermes")}
              </button>
            ) : parsedVersion?.updateInfo ? (
              <button
                className="btn btn-primary"
                onClick={handleUpdateHermes}
                disabled={updating}
              >
                {updating ? t("settings.updating") : t("settings.updateEngine")}
              </button>
            ) : (
              <button className="btn btn-secondary" disabled>
                {t("settings.upToDate")}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleDoctor}
              disabled={doctorRunning}
            >
              {doctorRunning ? t("settings.running") : t("settings.runDoctor")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                setDumpRunning(true);
                await window.hermesAPI.runHermesDump();
                setDumpRunning(false);
              }}
              disabled={dumpRunning}
            >
              {dumpRunning ? t("settings.running") : t("settings.debugDump")}
            </button>
          </div>
        </div>
        {openclawFound && !migrationDismissed && (
          <div className="settings-migration-banner">
          <div className="settings-migration-header">
            <div>
              <div className="settings-migration-title">
                {t("settings.openClawDetected")}
              </div>
              <div className="settings-migration-desc">
                {t("settings.openClawDesc", { path: openclawPath })}
              </div>
            </div>
            <button
              className="btn-ghost settings-migration-dismiss"
              onClick={handleDismissMigration}
              title={t("settings.dontShowAgain")}
            >
              &times;
            </button>
          </div>
          {migrationLog && (
            <pre className="settings-hermes-doctor" ref={migrationLogRef}>
              {migrationLog}
            </pre>
          )}
          {migrationResult && (
            <div
              className={`settings-hermes-result ${migrationResult.includes("complete") ? "success" : "error"}`}
            >
              {migrationResult}
            </div>
          )}
          <div className="settings-migration-actions">
            <button
              className="btn btn-primary"
              onClick={handleMigrate}
              disabled={migrating}
            >
              {migrating ? t("settings.migrating") : t("settings.migrateToPoH")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDismissMigration}
            >
              {t("settings.skip")}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* ── Appearance ────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">{t("settings.sections.appearance")}</div>
        <div className="settings-field">
          <label className="settings-field-label">{t("settings.theme.label")}</label>
          <div className="settings-theme-options">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`settings-theme-option ${theme === opt.value ? "active" : ""}`}
                onClick={() => setTheme(opt.value)}
              >
                {t(`settings.theme.${opt.value}`)}
              </button>
            ))}
          </div>
          <div className="settings-field-hint">
            {t("settings.chooseTheme")}
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-field-label">{t("settings.language")}</label>
          <div className="settings-theme-options">
            {APP_LOCALES.map((loc) => (
              <button
                key={loc}
                className={`settings-theme-option ${locale === loc ? "active" : ""}`}
                onClick={() => setLocale(loc)}
              >
                {loc === "en" ? t("settings.english") : t("settings.chinese")}
              </button>
            ))}
          </div>
          <div className="settings-field-hint">
            {t("settings.chooseLanguage")}
          </div>
        </div>
      </div>

      {/* ── Profiles ──────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">{t("agents.title")}</div>

        {showCreate && (
          <div className="agents-create">
            <input
              className="input"
              placeholder={t("agents.namePlaceholder")}
              value={newName}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                setNewName(v);
                setCreateError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <label className="agents-create-clone">
              <input
                type="checkbox"
                checked={cloneConfig}
                onChange={(e) => setCloneConfig(e.target.checked)}
              />
              <span>{t("agents.cloneConfig")}</span>
            </label>
            {createError && <div className="agents-create-error">{createError}</div>}
            <div className="agents-create-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
              >
                {creating ? t("agents.creating") : t("agents.create")}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError("");
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="agents-grid">
          {profiles.map((p) => (
            <div
              key={p.name}
              className={`agents-card ${profile === p.name ? "active" : ""}`}
              onClick={() => handleSelect(p.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") handleSelect(p.name); }}
            >
              <div className="agents-card-header">
                <AgentAvatar name={p.name} />
                <div className="agents-card-info">
                  <div className="agents-card-name">{p.name}</div>
                  <div className="agents-card-provider">
                    {p.provider
                      ? p.provider.charAt(0).toUpperCase() + p.provider.slice(1)
                      : t("agents.auto")}
                  </div>
                </div>
                {profile === p.name && (
                  <span className="agents-card-active-badge">{t("agents.active")}</span>
                )}
              </div>
              <div className="agents-card-model">
                {p.model ? p.model.split("/").pop() : t("agents.noModel")}
              </div>
              <div className="agents-card-stats">
                <span>{t("agents.skillsCount", { count: p.skillCount })}</span>
                <span className="agents-card-dot" />
                {p.gatewayRunning ? (
                  <span className="agents-card-gateway-on">{t("agents.gatewayRunning")}</span>
                ) : (
                  <span>{t("agents.gatewayOff")}</span>
                )}
              </div>
              <div className="agents-card-footer">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatWith?.(p.name);
                  }}
                >
                  <ChatBubble size={13} />
                  {t("agents.chat")}
                </button>
                {!p.isDefault &&
                  (confirmDelete === p.name ? (
                    <div
                      className="agents-card-confirm-delete"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{t("agents.deleteConfirm")}</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.name);
                        }}
                      >
                        {t("agents.yes")}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(null);
                        }}
                      >
                        {t("agents.no")}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="agents-card-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(p.name);
                      }}
                      title={t("agents.deleteTitle")}
                    >
                      <Trash size={14} />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowCreate(true)}
          style={{ marginTop: 12 }}
        >
          <Plus size={14} />
          {t("agents.newAgent")}
        </button>
      </div>

      {/* ── Data Backup ──────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">{t("settings.data")}</div>
        <div className="settings-field">
          <div className="settings-field-hint" style={{ marginBottom: 10 }}>
            {t("settings.dataHint")}
          </div>
          <div className="settings-hermes-actions">
            <button
              className="btn btn-secondary"
              onClick={handleBackup}
              disabled={backingUp}
            >
              <Download size={14} style={{ marginRight: 6 }} />
              {backingUp ? t("settings.backingUp") : t("settings.exportBackup")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleImport}
              disabled={importing}
            >
              <Upload size={14} style={{ marginRight: 6 }} />
              {importing ? t("settings.importing") : t("settings.importBackup")}
            </button>
          </div>
          {backupResult && (
            <div
              className={`settings-hermes-result ${backupResult.includes("created") || backupResult.includes("success") ? "success" : "error"}`}
              style={{ marginTop: 8 }}
            >
              {backupResult}
            </div>
          )}
          {importResult && (
            <div
              className={`settings-hermes-result ${importResult.includes("complete") ? "success" : "error"}`}
              style={{ marginTop: 8 }}
            >
              {importResult}
            </div>
          )}
        </div>
      </div>

      {/* ── Logs ─────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              const next = !logsExpanded;
              setLogsExpanded(next);
              if (next) loadLogs();
            }}
          >
            <FileText
              size={14}
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            {t("settings.logs")}{" "}
            {logsExpanded ? t("settings.logsExpanded") : t("settings.logsCollapsed")}
          </span>
        </div>
        {logsExpanded && (
          <div className="settings-field">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {["gateway.log", "agent.log", "errors.log"].map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${logFile === f ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setLogFile(f);
                    window.hermesAPI.readLogs(f, 300).then((r) => {
                      setLogContent(r.content);
                      setLogPath(r.path);
                    });
                  }}
                >
                  {t(`settings.${f.replace(".log", "")}`)}
                </button>
              ))}
              <button className="btn btn-sm btn-secondary" onClick={loadLogs}>
                {t("settings.refresh")}
              </button>
            </div>
            {logPath && (
              <div className="settings-field-hint" style={{ marginBottom: 4 }}>
                {logPath}
              </div>
            )}
            <pre
              className="settings-hermes-doctor"
              style={{
                maxHeight: 300,
                overflow: "auto",
                fontSize: 11,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {logContent || t("settings.empty")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
