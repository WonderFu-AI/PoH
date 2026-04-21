import { useState, useEffect, useCallback } from "react";
import { GATEWAY_PLATFORMS } from "../../constants";
import { useI18n } from "../../components/useI18n";
import { Plus, Trash, X, Check } from "lucide-react";
import type { PlatformDef } from "../../constants";

// ── Types ────────────────────────────────────────────────

interface AddedPlatform {
  key: string; // platform key e.g. "feishu", "telegram"
  addedAt: number; // timestamp
}

interface PlatformFields {
  [key: string]: string; // env key -> value
}

// ── Storage helpers ──────────────────────────────────────

function loadAddedPlatforms(profile?: string): AddedPlatform[] {
  try {
    const raw = localStorage.getItem(
      `poh-platforms-${profile ?? "default"}`,
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAddedPlatforms(
  platforms: AddedPlatform[],
  profile?: string,
): void {
  localStorage.setItem(
    `poh-platforms-${profile ?? "default"}`,
    JSON.stringify(platforms),
  );
}

// ── Env-based platform discovery ─────────────────────────

function discoverPlatformsFromEnv(
  env: Record<string, string>,
  gatewayState: Record<string, { state: string }>,
): AddedPlatform[] {
  return GATEWAY_PLATFORMS
    .filter((p) => {
      // Platform must have at least one field configured in env
      const hasConfig = p.fields.some((f) => env[f]?.trim());
      // Must appear in gateway_state (Hermes is aware of it)
      const hasState = !!gatewayState[p.key];
      return hasConfig && hasState;
    })
    .map((p) => ({ key: p.key, addedAt: 0 })); // addedAt=0 means discovered from env
}

// Merge manually-added platforms (localStorage) with env-discovered platforms
function mergePlatforms(
  local: AddedPlatform[],
  discovered: AddedPlatform[],
): AddedPlatform[] {
  const map = new Map<string, AddedPlatform>();
  for (const p of discovered) map.set(p.key, p);
  for (const p of local) map.set(p.key, p); // localStorage wins if duplicate
  return Array.from(map.values());
}

// ── Platform card component ──────────────────────────────

type ConnStatus = "connected" | "failed" | "notConfigured" | "disabled" | "disconnected";

interface PlatformCardProps {
  platform: PlatformDef;
  fields: PlatformFields;
  connStatus: ConnStatus;
  connError?: string;
  onDelete: () => void;
  onEdit: () => void;
}

function StatusBadge({
  status,
  error,
}: {
  status: ConnStatus;
  error?: string;
}): React.JSX.Element {
  const { t } = useI18n();
  const labels: Record<ConnStatus, string> = {
    connected: t("gateway.status.connected"),
    failed: t("gateway.status.failed"),
    notConfigured: t("gateway.status.notConfigured"),
    disabled: t("gateway.status.disabled"),
    disconnected: t("gateway.status.disconnected"),
  };
  const colors: Record<ConnStatus, string> = {
    connected: "bg-green-500",
    failed: "bg-red-500",
    notConfigured: "bg-yellow-500",
    disabled: "bg-gray-400",
    disconnected: "bg-yellow-500",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {labels[status]}
      </span>
      {status === "failed" && error && (
        <span className="text-xs text-red-500" title={error}>
          ({error.slice(0, 30)})
        </span>
      )}
    </div>
  );
}

function PlatformCard({
  platform,
  fields,
  connStatus,
  connError,
  onDelete,
  onEdit,
}: PlatformCardProps): React.JSX.Element {
  const { t } = useI18n();

  // Show a summary field (first non-empty field value, truncated)
  const summaryField = platform.fields.find((f) => fields[f]?.trim());
  const summaryValue = summaryField ? fields[summaryField] : null;
  const displayValue = summaryValue
    ? summaryValue.length > 20
      ? summaryValue.slice(0, 20) + "…"
      : summaryValue
    : null;
  // Get the field def to show a label
  const summaryFieldDef = summaryField
    ? GATEWAY_SECTIONSForPlatform(platform).find((f) => f.key === summaryField)
    : null;

  return (
    <div className="platform-card">
      <div className="platform-card-header">
        <div className="platform-card-title">{platform.label}</div>
      </div>

      <StatusBadge status={connStatus} error={connError} />

      {displayValue && (
        <div className="platform-card-summary">
          <span className="platform-card-summary-label">{summaryFieldDef?.label}: </span>
          {displayValue}
        </div>
      )}

      <div className="platform-card-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={onEdit}
          title={t("common.edit")}
        >
          {t("common.edit")}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onDelete}
          title={t("gateway.form.delete")}
        >
          <Trash size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Add platform modal ──────────────────────────────────

interface AddModalProps {
  onAdd: (platformKey: string) => void;
  onClose: () => void;
}

function AddPlatformModal({ onAdd, onClose }: AddModalProps): React.JSX.Element {
  const { t } = useI18n();

  const groups = [
    { key: "china" as const, label: t("gateway.platformGroups.china") },
    {
      key: "international" as const,
      label: t("gateway.platformGroups.international"),
    },
    { key: "other" as const, label: t("gateway.platformGroups.other") },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gateway-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gateway-modal-header">
          <h2>{t("gateway.selectPlatform")}</h2>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="gateway-modal-body">
          {groups.map((group) => {
            const platforms = GATEWAY_PLATFORMS.filter(
              (p) => p.group === group.key,
            );
            if (platforms.length === 0) return null;
            return (
              <div key={group.key} className="modal-group">
                <div className="modal-group-title">{group.label}</div>
                <div className="modal-platform-grid">
                  {platforms.map((p) => (
                    <button
                      key={p.key}
                      className="modal-platform-btn"
                      onClick={() => onAdd(p.key)}
                    >
                      <div className="modal-platform-name">{p.label}</div>
                      <div className="modal-platform-desc">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Edit / config modal ─────────────────────────────────

interface EditModalProps {
  platform: PlatformDef;
  initialFields: PlatformFields;
  isNew: boolean;
  onSave: (fields: PlatformFields) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function EditPlatformModal({
  platform,
  initialFields,
  isNew,
  onSave,
  onDelete,
  onClose,
}: EditModalProps): React.JSX.Element {
  const { t } = useI18n();
  const [fields, setFields] = useState<PlatformFields>(initialFields);
  const [saved, setSaved] = useState(false);

  // Load field definitions from GATEWAY_SECTIONS
  const fieldDefs = GATEWAY_SECTIONSForPlatform(platform);

  function handleSave(): void {
    onSave(fields);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gateway-modal gateway-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="gateway-modal-header">
          <h2>{isNew ? t("gateway.addPlatform") : platform.label}</h2>
          <button className="btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="gateway-modal-body">
          {fieldDefs.map((field) => (
            <div key={field.key} className="settings-field">
              <label className="settings-field-label">
                {field.label}
                {saved && (
                  <span className="settings-saved">
                    <Check size={12} /> {t("gateway.form.save")}
                  </span>
                )}
              </label>
              <input
                className="input"
                type={field.type === "password" ? "password" : "text"}
                value={fields[field.key] || ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.hint}
              />
              <div className="settings-field-hint">{field.hint}</div>
            </div>
          ))}
        </div>
        <div className="gateway-modal-footer">
          {!isNew && onDelete && (
            <button
              className="btn btn-secondary"
              onClick={onDelete}
            >
              <Trash size={14} /> {t("gateway.form.delete")}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            {t("gateway.form.cancel")}
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={14} /> {t("gateway.form.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field defs helper ────────────────────────────────────
// Inline field defs for each platform (avoid importing GATEWAY_SECTIONS)

// Field definitions for all platforms (used in edit modal)
interface FieldDef {
  key: string;
  label: string;
  type: string;
  hint: string;
}

function GATEWAY_SECTIONSForPlatform(platform: PlatformDef): FieldDef[] {
  const allFields: Record<string, FieldDef> = {
    // Feishu
    FEISHU_APP_ID: {
      key: "FEISHU_APP_ID",
      label: "App ID",
      type: "text",
      hint: "飞书开放平台控制台获取",
    },
    FEISHU_APP_SECRET: {
      key: "FEISHU_APP_SECRET",
      label: "App Secret",
      type: "password",
      hint: "飞书开放平台控制台获取",
    },
    // DingTalk
    DINGTALK_CLIENT_ID: {
      key: "DINGTALK_CLIENT_ID",
      label: "Client ID",
      type: "text",
      hint: "钉钉开放平台获取的 App Key",
    },
    DINGTALK_CLIENT_SECRET: {
      key: "DINGTALK_CLIENT_SECRET",
      label: "Client Secret",
      type: "password",
      hint: "钉钉开放平台获取的 App Secret",
    },
    // WeCom
    WECOM_BOT_ID: {
      key: "WECOM_BOT_ID",
      label: "Bot ID",
      type: "text",
      hint: "企业微信后台获取的企业 ID",
    },
    WECOM_SECRET: {
      key: "WECOM_SECRET",
      label: "Secret",
      type: "password",
      hint: "企业微信 Secret",
    },
    // WeChat
    WEIXIN_ACCOUNT_ID: {
      key: "WEIXIN_ACCOUNT_ID",
      label: "Account ID",
      type: "text",
      hint: "微信 iLink 机器人 Account ID",
    },
    WEIXIN_TOKEN: {
      key: "WEIXIN_TOKEN",
      label: "Token",
      type: "password",
      hint: "iLink Bot API Token",
    },
    // Telegram
    TELEGRAM_BOT_TOKEN: {
      key: "TELEGRAM_BOT_TOKEN",
      label: "Bot Token",
      type: "password",
      hint: "从 @BotFather 获取",
    },
    TELEGRAM_ALLOWED_USERS: {
      key: "TELEGRAM_ALLOWED_USERS",
      label: "允许的用户",
      type: "text",
      hint: "Telegram 用户 ID，多个用逗号分隔",
    },
    // Discord
    DISCORD_BOT_TOKEN: {
      key: "DISCORD_BOT_TOKEN",
      label: "Bot Token",
      type: "password",
      hint: "Discord Developer Portal 获取",
    },
    DISCORD_ALLOWED_CHANNELS: {
      key: "DISCORD_ALLOWED_CHANNELS",
      label: "允许的频道",
      type: "text",
      hint: "频道 ID，多个用逗号分隔",
    },
    // Slack
    SLACK_BOT_TOKEN: {
      key: "SLACK_BOT_TOKEN",
      label: "Bot Token (xoxb)",
      type: "password",
      hint: "Slack App 设置中的 xoxb- Token",
    },
    SLACK_APP_TOKEN: {
      key: "SLACK_APP_TOKEN",
      label: "App Token (xapp)",
      type: "password",
      hint: "Socket Mode 的 xapp- Token",
    },
    // WhatsApp
    WHATSAPP_API_URL: {
      key: "WHATSAPP_API_URL",
      label: "API 地址",
      type: "text",
      hint: "WhatsApp Business API 地址",
    },
    WHATSAPP_API_TOKEN: {
      key: "WHATSAPP_API_TOKEN",
      label: "API Token",
      type: "password",
      hint: "WhatsApp API 认证令牌",
    },
    // Signal
    SIGNAL_PHONE_NUMBER: {
      key: "SIGNAL_PHONE_NUMBER",
      label: "手机号",
      type: "text",
      hint: "注册 signal-cli 的手机号",
    },
    // Matrix
    MATRIX_HOMESERVER: {
      key: "MATRIX_HOMESERVER",
      label: "Homeserver",
      type: "text",
      hint: "例如 https://matrix.org",
    },
    MATRIX_USER_ID: {
      key: "MATRIX_USER_ID",
      label: "User ID",
      type: "text",
      hint: "例如 @hermes:matrix.org",
    },
    MATRIX_ACCESS_TOKEN: {
      key: "MATRIX_ACCESS_TOKEN",
      label: "Access Token",
      type: "password",
      hint: "Matrix 登录后的 Access Token",
    },
    // Mattermost
    MATTERMOST_URL: {
      key: "MATTERMOST_URL",
      label: "服务器地址",
      type: "text",
      hint: "Mattermost 服务器 URL",
    },
    MATTERMOST_TOKEN: {
      key: "MATTERMOST_TOKEN",
      label: "Personal Access Token",
      type: "password",
      hint: "Mattermost 个人访问令牌",
    },
    // Email
    EMAIL_IMAP_SERVER: {
      key: "EMAIL_IMAP_SERVER",
      label: "IMAP 服务器",
      type: "text",
      hint: "例如 imap.gmail.com",
    },
    EMAIL_SMTP_SERVER: {
      key: "EMAIL_SMTP_SERVER",
      label: "SMTP 服务器",
      type: "text",
      hint: "例如 smtp.gmail.com",
    },
    EMAIL_ADDRESS: {
      key: "EMAIL_ADDRESS",
      label: "邮箱地址",
      type: "text",
      hint: "你的邮箱地址",
    },
    EMAIL_PASSWORD: {
      key: "EMAIL_PASSWORD",
      label: "密码",
      type: "password",
      hint: "应用专用密码（非登录密码）",
    },
    // SMS
    SMS_PROVIDER: {
      key: "SMS_PROVIDER",
      label: "Provider",
      type: "text",
      hint: "twilio 或 vonage",
    },
    TWILIO_ACCOUNT_SID: {
      key: "TWILIO_ACCOUNT_SID",
      label: "Account SID",
      type: "text",
      hint: "Twilio Dashboard 获取",
    },
    TWILIO_AUTH_TOKEN: {
      key: "TWILIO_AUTH_TOKEN",
      label: "Auth Token",
      type: "password",
      hint: "Twilio Auth Token",
    },
    TWILIO_PHONE_NUMBER: {
      key: "TWILIO_PHONE_NUMBER",
      label: "手机号",
      type: "text",
      hint: "你的 Twilio 电话号码",
    },
    // iMessage
    BLUEBUBBLES_URL: {
      key: "BLUEBUBBLES_URL",
      label: "服务器地址",
      type: "text",
      hint: "例如 http://localhost:1234",
    },
    BLUEBUBBLES_PASSWORD: {
      key: "BLUEBUBBLES_PASSWORD",
      label: "密码",
      type: "password",
      hint: "BlueBubbles 服务器密码",
    },
    // Webhooks
    WEBHOOK_SECRET: {
      key: "WEBHOOK_SECRET",
      label: "Webhook Secret",
      type: "password",
      hint: "设置一个安全的随机字符串",
    },
    // Home Assistant
    HA_URL: {
      key: "HA_URL",
      label: "Home Assistant URL",
      type: "text",
      hint: "例如 http://homeassistant.local:8123",
    },
    HA_TOKEN: {
      key: "HA_TOKEN",
      label: "Long-lived Access Token",
      type: "password",
      hint: "Home Assistant 长期访问令牌",
    },
  };

  return platform.fields
    .map((key) => allFields[key])
    .filter((f): f is FieldDef => !!f);
}

// ── Main Gateway component ──────────────────────────────

function Gateway({
  profile,
}: {
  profile?: string;
}): React.JSX.Element {
  const { t } = useI18n();

  // Core state
  const [addedPlatforms, setAddedPlatforms] = useState<AddedPlatform[]>([]);
  const [env, setEnv] = useState<Record<string, string>>({});
  const [gatewayState, setGatewayState] = useState<Record<string, {
    state: string;
    error_message?: string;
  }>>({});

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformDef | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadConfig = useCallback(async (): Promise<void> => {
    const [localPlatforms, envData, gwState] = await Promise.all([
      Promise.resolve(loadAddedPlatforms(profile)),
      window.hermesAPI.getEnv(profile),
      window.hermesAPI.getGatewayState(),
    ]);
    const discovered = discoverPlatformsFromEnv(envData, gwState?.platforms ?? {});
    const merged = mergePlatforms(localPlatforms, discovered);
    setAddedPlatforms(merged);
    setEnv(envData);
    setGatewayState(gwState?.platforms ?? {});
  }, [profile]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Get platform definition by key
  function getPlatformDef(key: string): PlatformDef | undefined {
    return GATEWAY_PLATFORMS.find((p) => p.key === key);
  }

  // Determine connection status for a platform
  function getConnStatus(platform: PlatformDef): ConnStatus {
    const pState = gatewayState[platform.key];
    const hasConfig = platform.fields.some((f) => env[f]?.trim());

    if (!hasConfig) return "notConfigured";
    if (!pState) return "notConfigured";
    if (pState.state === "connected") return "connected";
    if (pState.state === "failed") return "failed";
    if (pState.state === "disconnected") return "disconnected";
    return "notConfigured";
  }

  function getConnError(platform: PlatformDef): string | undefined {
    return gatewayState[platform.key]?.error_message;
  }

  // Add new platform
  function handleAddPlatform(platformKey: string): void {
    const platform = getPlatformDef(platformKey);
    if (!platform) return;
    setShowAddModal(false);
    setEditingPlatform(platform);
  }

  // Save platform config
  async function handleSavePlatform(
    platform: PlatformDef,
    fields: PlatformFields,
  ): Promise<void> {
    // Save env values
    for (const [key, value] of Object.entries(fields)) {
      await window.hermesAPI.setEnv(key, value, profile);
    }
    // Enable the platform in config.yaml
    await window.hermesAPI.setPlatformEnabled(platform.key, true, profile);
    // Add to local list if new
    const current = loadAddedPlatforms(profile);
    if (!current.find((p) => p.key === platform.key)) {
      saveAddedPlatforms([...current, { key: platform.key, addedAt: Date.now() }], profile);
    }
    await loadConfig();
  }

  // Delete platform
  async function handleDeletePlatform(platformKey: string): Promise<void> {
    const platform = getPlatformDef(platformKey);
    if (!platform) return;
    // Disable in config
    await window.hermesAPI.setPlatformEnabled(platform.key, false, profile);
    // Clear env values
    for (const key of platform.fields) {
      await window.hermesAPI.setEnv(key, "", profile);
    }
    // Remove from local list
    const current = loadAddedPlatforms(profile);
    saveAddedPlatforms(current.filter((p) => p.key !== platformKey), profile);
    setConfirmDelete(null);
    setEditingPlatform(null);
    await loadConfig();
  }

  // Get initial fields for edit modal
  function getInitialFields(platform: PlatformDef): PlatformFields {
    const result: PlatformFields = {};
    for (const key of platform.fields) {
      result[key] = env[key] ?? "";
    }
    return result;
  }

  const hasAddedPlatforms = addedPlatforms.length > 0;

  return (
    <div className="settings-container">
      <h1 className="settings-header">{t("gateway.title")}</h1>

      {/* Header with add button */}
      <div className="gateway-list-header">
        <span />
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={14} />
          {t("gateway.addPlatform")}
        </button>
      </div>

      {/* Platform cards */}
      {hasAddedPlatforms ? (
        <div className="gateway-grid">
          {addedPlatforms.map((ap) => {
            const platform = getPlatformDef(ap.key);
            if (!platform) return null;
            return (
              <PlatformCard
                key={ap.key}
                platform={platform}
                fields={env}
                connStatus={getConnStatus(platform)}
                connError={getConnError(platform)}
                onDelete={() => setConfirmDelete(ap.key)}
                onEdit={() => setEditingPlatform(platform)}
              />
            );
          })}
        </div>
      ) : (
        <div className="gateway-empty">
          <div className="gateway-empty-title">{t("gateway.noPlatforms")}</div>
          <div className="gateway-empty-hint">{t("gateway.noPlatformsHint")}</div>
        </div>
      )}

      {/* Add platform modal */}
      {showAddModal && (
        <AddPlatformModal
          onAdd={handleAddPlatform}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit platform modal */}
      {editingPlatform && (
        <EditPlatformModal
          platform={editingPlatform}
          initialFields={getInitialFields(editingPlatform)}
          isNew={!addedPlatforms.find((p) => p.key === editingPlatform.key)}
          onSave={(fields) => handleSavePlatform(editingPlatform, fields)}
          onDelete={
            addedPlatforms.find((p) => p.key === editingPlatform.key)
              ? () => setConfirmDelete(editingPlatform.key)
              : undefined
          }
          onClose={() => setEditingPlatform(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="gateway-modal gateway-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="gateway-modal-header">
              <h2>{t("gateway.form.deleteConfirm")}</h2>
            </div>
            <div className="gateway-modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                {t("gateway.form.no")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleDeletePlatform(confirmDelete)}
              >
                {t("gateway.form.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gateway;
