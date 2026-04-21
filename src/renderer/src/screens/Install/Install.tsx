import { useEffect, useState } from "react";
import { ArrowRight } from "../../assets/icons";
import { useI18n } from "../../components/useI18n";

interface InstallProgress {
  step: number;
  totalSteps: number;
  title: string;
  detail: string;
  log: string;
}

interface InstallProps {
  onComplete: () => void;
  onFailed: (error: string) => void;
}

function Install({ onComplete, onFailed }: InstallProps): React.JSX.Element {
  const { t } = useI18n();
  const [progress] = useState<InstallProgress>({
    step: 0,
    totalSteps: 7,
    title: "Preparing...",
    detail: "Starting installation",
    log: "",
  });
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = window.hermesAPI.onInstallProgress(() => {});

    window.hermesAPI
      .startInstall()
      .then((result) => {
        if (result.success) {
          setDone(true);
        } else {
          setFailed(result.error || t('install.installationFailedHint'));
        }
      })
      .catch((err) => {
        setFailed(err.message || t('install.installationFailedHint'));
      });

    return cleanup;
  }, [t]);

  return (
    <div className="screen install-screen">
      <h1 className="install-title">
        {done
          ? t('install.installationComplete')
          : failed
            ? t('install.installationFailed')
            : t('install.installingHermes')}
      </h1>

      <div className="install-progress-container">
        <div className="install-progress-bar">
          <div
            className={`install-progress-fill ${failed ? "install-progress-fill--error" : ""} ${!done && !failed ? "install-progress-fill--indeterminate" : ""}`}
            style={{ width: done ? "100%" : "100%" }}
          />
        </div>
      </div>

      {!done && !failed && (
        <p className="install-step-detail" style={{ textAlign: "center", marginTop: "12px" }}>
          正在安装，可能需要稍等几分钟
        </p>
      )}

      {failed && (
        <div className="install-error-banner">
          <p className="install-error-text">{failed}</p>
          <div className="install-error-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setFailed(null);
                onFailed(failed || "");
              }}
            >
              {t('install.retryInstallation')}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="install-done">
          <button className="btn btn-primary" onClick={onComplete}>
            {t('install.continueToSetup')}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Install;
