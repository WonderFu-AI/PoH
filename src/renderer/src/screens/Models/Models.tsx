import { useState, useEffect, useCallback } from "react";
import { Plus, Trash, X, Eye, EyeOff, Refresh } from "../../assets/icons";
import { PROVIDERS } from "../../constants";
import { useI18n } from "../../components/useI18n";

interface ModelConfig {
  id: string;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  name: string;
  createdAt: number;
}

function providerLabel(value: string, t: (key: string) => string): string {
  if (!value) return t("models.noProvider");
  const key = `models.provider.${value}`;
  const translated = t(key);
  return translated !== key ? translated : value;
}

function maskApiKey(key: string): string {
  if (!key) return "••••••••";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

function Models({ profile }: { profile?: string }): React.JSX.Element {
  const { t } = useI18n();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);

  // Form state
  const [formProvider, setFormProvider] = useState("minimax");
  const [formApiKey, setFormApiKey] = useState("");
  const [formModel, setFormModel] = useState("auto");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Current active config
  const [currentProvider, setCurrentProvider] = useState("");
  const [currentModel, setCurrentModel] = useState("");
  const [currentBaseUrl, setCurrentBaseUrl] = useState("");
  const [configSaved, setConfigSaved] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const loadModels = useCallback(async () => {
    const list = await window.hermesAPI.listModels();
    setModels(list.map((m) => ({ ...m, apiKey: m.apiKey || "" })));
    setLoading(false);
  }, []);

  const loadConfig = useCallback(async () => {
    const mc = await window.hermesAPI.getModelConfig(profile);
    setCurrentProvider(mc.provider || "");
    setCurrentModel(mc.model || "");
    setCurrentBaseUrl(mc.baseUrl || "");
    setConfigLoaded(true);
  }, [profile]);

  useEffect(() => {
    loadModels();
    loadConfig();
  }, [loadModels, loadConfig]);

  // Auto-save current config when values change
  useEffect(() => {
    if (!configLoaded) return;
    const timer = setTimeout(async () => {
      await window.hermesAPI.setModelConfig(
        currentProvider,
        currentModel,
        currentBaseUrl,
        profile,
      );
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentProvider, currentModel, currentBaseUrl, profile, configLoaded]);

  // Group models by provider
  const groupedModels = models.reduce<Record<string, ModelConfig[]>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {});

  function openAddModal(): void {
    setEditingModel(null);
    setFormProvider("minimax");
    setFormApiKey("");
    setFormModel("auto");
    setFormBaseUrl("");
    setFormName("");
    setFormError("");
    setShowApiKey(false);
    setShowModal(true);
  }

  function openEditModal(m: ModelConfig): void {
    setEditingModel(m);
    setFormProvider(m.provider);
    setFormApiKey(m.apiKey || "");
    setFormModel(m.model || "auto");
    setFormBaseUrl(m.baseUrl || "");
    setFormName(m.name);
    setFormError("");
    setShowApiKey(false);
    setShowModal(true);
  }

  function closeModal(): void {
    setShowModal(false);
    setEditingModel(null);
    setFormError("");
  }

  async function handleSave(): Promise<void> {
    if (!formProvider) {
      setFormError(t("models.providerRequired"));
      return;
    }
    if (!formApiKey.trim()) {
      setFormError(t("models.apiKeyRequired"));
      return;
    }
    setFormError("");

    if (editingModel) {
      await window.hermesAPI.updateModel(editingModel.id, {
        name: formName.trim() || providerLabel(formProvider, t),
        provider: formProvider,
        model: formModel || "auto",
        baseUrl: formBaseUrl.trim(),
        apiKey: formApiKey.trim(),
      });
    } else {
      await window.hermesAPI.addModel(
        formName.trim() || providerLabel(formProvider, t),
        formProvider,
        formModel || "auto",
        formBaseUrl.trim(),
        formApiKey.trim(),
      );
    }
    closeModal();
    await loadModels();
  }

  async function handleDelete(id: string): Promise<void> {
    await window.hermesAPI.removeModel(id);
    await loadModels();
  }

  async function handleSetActive(provider: string, config: ModelConfig): Promise<void> {
    setCurrentProvider(provider);
    setCurrentModel(config.model || "");
    setCurrentBaseUrl(config.baseUrl || "");
    await window.hermesAPI.setModelConfig(provider, config.model || "auto", config.baseUrl || "", profile);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  }

  function isActive(config: ModelConfig): boolean {
    return (
      currentProvider === config.provider &&
      currentModel === (config.model || "auto") &&
      currentBaseUrl === (config.baseUrl || "")
    );
  }

  return (
    <div className="settings-container">
      <h1 className="settings-header">{t("models.title")}</h1>
      <p className="settings-field-hint" style={{ marginBottom: 24, marginTop: -16 }}>
        {t("models.subtitle")}
      </p>

      {/* ── Add Model Button ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} style={{ marginRight: 6 }} />
          {t("models.addModel")}
        </button>
        {configSaved && (
          <span className="models-saved">
            {t("models.activeSaved")}
          </span>
        )}
      </div>

      {/* ── Current Hermes Config ─────────────────── */}
      {currentProvider && (
        <div className="models-section-title">{t("models.currentConfig")}</div>
      )}
      {currentProvider && (
        <div className="models-current-card">
          <div className="models-current-info">
            <div className="models-current-provider">
              {providerLabel(currentProvider, t)}
            </div>
            <div className="models-current-model">
              {currentModel || "Auto"}
            </div>
          </div>
          <div className="models-current-actions">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setFormProvider(currentProvider);
                setFormApiKey("");
                setFormModel(currentModel || "auto");
                setFormBaseUrl(currentBaseUrl || "");
                setFormName("");
                setFormError("");
                setShowApiKey(false);
                setShowModal(true);
              }}
            >
              {t("models.editCurrent")}
            </button>
          </div>
        </div>
      )}

      {/* ── Saved Presets ──────────────────────────── */}
      {currentProvider && Object.keys(groupedModels).length > 0 && (
        <div className="models-section-title" style={{ marginTop: 24 }}>
          {t("models.savedPresets")}
        </div>
      )}
      {loading ? (
        <div className="models-loading">
          <div className="loading-spinner" />
        </div>
      ) : Object.keys(groupedModels).length === 0 && !currentProvider ? (
        <div className="models-empty">
          <p className="models-empty-text">{t("models.empty")}</p>
        </div>
      ) : Object.keys(groupedModels).length > 0 ? (
        <div className="models-provider-grid">
          {Object.entries(groupedModels).map(([provider, configs]) => {
            return (
              <div
                key={provider}
                className={`models-provider-card ${currentProvider === provider ? "active" : ""}`}
              >
                <div className="models-provider-header">
                  <div className="models-provider-info">
                    <span className="models-provider-name">
                      {providerLabel(provider, t)}
                    </span>
                    {currentProvider === provider && (
                      <span className="models-provider-active-badge">
                        {t("models.active")}
                      </span>
                    )}
                  </div>
                  {configs.length > 1 && (
                    <div className="models-provider-actions">
                      <span className="models-provider-count">
                        {configs.length} {t("models.configs")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="models-provider-configs">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className={`models-config-item ${isActive(config) ? "active" : ""}`}
                      onClick={() => handleSetActive(provider, config)}
                    >
                      <div className="models-config-main">
                        <div className="models-config-name">
                          {config.name || config.model || "Auto"}
                        </div>
                        <div className="models-config-model">
                          {config.model || "Auto"}
                        </div>
                      </div>
                      <div className="models-config-key">
                        {config.apiKey ? maskApiKey(config.apiKey) : "••••••••"}
                      </div>
                      <div className="models-config-actions">
                        <button
                          className="btn-ghost models-config-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(config);
                          }}
                          title={t("models.edit")}
                        >
                          <span style={{ fontSize: 12 }}>✏️</span>
                        </button>
                        <button
                          className="btn-ghost models-config-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(config.id);
                          }}
                          title={t("models.delete")}
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {configs.length > 1 && (
                  <div className="models-provider-rotate">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const idx = configs.findIndex((c) => isActive(c));
                        const next = configs[(idx + 1) % configs.length];
                        handleSetActive(provider, next);
                      }}
                    >
                      <Refresh size={12} style={{ marginRight: 4 }} />
                      {t("models.rotate")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ── Add/Edit Modal ──────────────────────────── */}
      {showModal && (
        <div className="models-modal-overlay" onClick={closeModal}>
          <div className="models-modal" onClick={(e) => e.stopPropagation()}>
            <div className="models-modal-header">
              <h2 className="models-modal-title">
                {editingModel ? t("models.editModel") : t("models.addModel")}
              </h2>
              <button className="btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="models-modal-body">
              <div className="models-modal-field">
                <label className="models-modal-label">{t("models.provider")}</label>
                <select
                  className="input"
                  value={formProvider}
                  onChange={(e) => {
                    setFormProvider(e.target.value);
                    if (e.target.value === "custom" && !formBaseUrl) {
                      setFormBaseUrl("http://localhost:1234/v1");
                    }
                  }}
                >
                  {PROVIDERS.options
                    .filter((p) => p.value !== "auto")
                    .map((p) => (
                      <option key={p.value} value={p.value}>
                        {providerLabel(p.value, t)}
                      </option>
                    ))}
                </select>
                <div className="settings-field-hint">{t("models.providerHint")}</div>
              </div>

              <div className="models-modal-field">
                <label className="models-modal-label">{t("models.apiKey")}</label>
                <div className="models-api-key-input">
                  <input
                    className="input"
                    type={showApiKey ? "text" : "password"}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder={t("models.apiKeyPlaceholder")}
                  />
                  <button
                    className="btn-ghost models-api-key-toggle"
                    onClick={() => setShowApiKey(!showApiKey)}
                    type="button"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="models-modal-field">
                <label className="models-modal-label">{t("models.modelName")}</label>
                <select
                  className="input"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                >
                  <option value="auto">{t("models.auto")}</option>
                  <option value="MiniMax-OpenChat-7B">MiniMax-OpenChat-7B</option>
                  <option value="MiniMax-OpenChat-8B">MiniMax-OpenChat-8B</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                  <option value="qwen-plus">Qwen Plus</option>
                  <option value="qwen-max">Qwen Max</option>
                  <option value="qwen-turbo">Qwen Turbo</option>
                </select>
                <div className="settings-field-hint">{t("models.modelNameHint")}</div>
              </div>

              {formProvider === "custom" && (
                <div className="models-modal-field">
                  <label className="models-modal-label">{t("models.baseURL")}</label>
                  <input
                    className="input"
                    type="text"
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder={t("models.baseURLPlaceholder")}
                  />
                </div>
              )}

              {formError && <div className="models-error">{formError}</div>}
            </div>

            <div className="models-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>
                {t("models.cancel")}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                {editingModel ? t("models.update") : t("models.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Models;
