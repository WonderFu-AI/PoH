import { useState, useCallback, useEffect, useMemo } from "react";
import Chat, { ChatMessage } from "../Chat/Chat";
import Sessions from "../Sessions/Sessions";
import Settings from "../Settings/Settings";
import Skills from "../Skills/Skills";
import Soul from "../Soul/Soul";
import Memory from "../Memory/Memory";
import Tools from "../Tools/Tools";
import Gateway from "../Gateway/Gateway";
import Office from "../Office/Office";
import Models from "../Models/Models";
import Schedules from "../Schedules/Schedules";
import {
  ChatBubble,
  Settings as SettingsIcon,
  Brain,
  Wrench,
  Download,
  ChevronRight,
} from "../../assets/icons";
import { useI18n } from "../../components/useI18n";
import { RightPanel } from "../../components/RightPanel";
import type { LucideIcon } from "lucide-react";

// ────────────────────────────────────────────────────
//  View types — simplified 5-group structure
// ────────────────────────────────────────────────────

type View =
  | "chat"
  | "sessions"
  | "models"
  | "gateway"
  | "skills"
  | "soul"
  | "memory"
  | "tools"
  | "schedules"
  | "office"
  | "settings";

// A collapsible nav group with a main item and optional sub-items
interface NavGroup {
  id: string;
  mainView: View | null; // null means it's a pure group header (no own screen)
  icon: LucideIcon;
  labelKey: string;
  label: string; // resolved translation
  subItems?: { view: View; labelKey: string; label: string }[];
}

// Config type — only has keys, not resolved labels
interface NavGroupConfig {
  id: string;
  mainView: View | null;
  icon: LucideIcon;
  labelKey: string;
  subItems?: { view: View; labelKey: string }[];
}

// ────────────────────────────────────────────────────
//  Sidebar nav structure — only "对话" (Chat)
// ────────────────────────────────────────────────────

const NAV_GROUPS_CONFIG: NavGroupConfig[] = [
  { id: "chat", mainView: "chat", icon: ChatBubble, labelKey: "navigation.sidebar.chat" },
  {
    id: "settings",
    mainView: "settings",
    icon: SettingsIcon,
    labelKey: "navigation.sidebar.settings",
    subItems: [
      { view: "settings", labelKey: "navigation.sidebar.general" },
      { view: "models", labelKey: "navigation.sidebar.models" },
      { view: "gateway", labelKey: "navigation.sidebar.gateway" },
    ],
  },
  {
    id: "ai",
    mainView: null,
    icon: Brain,
    labelKey: "navigation.sidebar.aiCapabilities",
    subItems: [
      { view: "skills", labelKey: "navigation.sidebar.skills" },
      { view: "soul", labelKey: "navigation.sidebar.persona" },
      { view: "memory", labelKey: "navigation.sidebar.memory" },
      { view: "tools", labelKey: "navigation.sidebar.tools" },
    ],
  },
  {
    id: "advanced",
    mainView: null,
    icon: Wrench,
    labelKey: "navigation.sidebar.advanced",
    subItems: [
      { view: "schedules", labelKey: "navigation.sidebar.schedules" },
      { view: "office", labelKey: "navigation.office" },
    ],
  },
];

function Layout(): React.JSX.Element {
  // ── i18n ─────────────────────────────────────────────
  const { t } = useI18n();

  // ── Core state ────────────────────────────────────────
  const [view, setView] = useState<View>("chat");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("settings"); // which group is expanded
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState("default");
  // Lazy mount: only render Office after first visit, then keep mounted
  const [officeVisited, setOfficeVisited] = useState(false);

  // ── Translated nav groups ─────────────────────────────
  const NAV_GROUPS = useMemo(
    () =>
      NAV_GROUPS_CONFIG.map((group) => ({
        ...group,
        label: t(group.labelKey),
        subItems: group.subItems?.map((sub) => ({
          ...sub,
          label: t(sub.labelKey),
        })),
      })),
    [t],
  );

  // ── Auto-update state ─────────────────────────────────
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateState, setUpdateState] = useState<
    "available" | "downloading" | "ready" | null
  >(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  useEffect(() => {
    const cleanupAvailable = window.hermesAPI.onUpdateAvailable((info) => {
      setUpdateVersion(info.version);
      setUpdateState("available");
    });
    const cleanupProgress = window.hermesAPI.onUpdateDownloadProgress(
      (info) => {
        setDownloadPercent(info.percent);
      },
    );
    const cleanupDownloaded = window.hermesAPI.onUpdateDownloaded(() => {
      setUpdateState("ready");
    });
    return () => {
      cleanupAvailable();
      cleanupProgress();
      cleanupDownloaded();
    };
  }, []);

  async function handleUpdate(): Promise<void> {
    if (updateState === "available") {
      setUpdateState("downloading");
      await window.hermesAPI.downloadUpdate();
    } else if (updateState === "ready") {
      await window.hermesAPI.installUpdate();
    }
  }

  // ── Nav interaction ───────────────────────────────────
  const handleNavClick = useCallback(
    (group: NavGroup) => {
      if (group.subItems && group.subItems.length > 0) {
        // Collapsible group — toggle expansion
        setExpandedGroup((prev) => (prev === group.id ? null : group.id));
        // Set to first sub-item when expanded
        if (expandedGroup !== group.id) {
          setView(group.subItems[0].view);
        }
      } else if (group.mainView) {
        // Direct nav item
        setExpandedGroup(null);
        setView(group.mainView);
        if (group.mainView === "office") setOfficeVisited(true);
      }
    },
    [expandedGroup],
  );

  const handleSubItemClick = useCallback((subView: View, groupId: string) => {
    setView(subView);
    setExpandedGroup(groupId);
    if (subView === "office") setOfficeVisited(true);
  }, []);

  const handleNewChat = useCallback(() => {
    // Abort any in-flight chat before clearing
    window.hermesAPI.abortChat();
    setMessages([]);
    setCurrentSessionId(null);
    setSessionStartedAt(Date.now());
    setView("chat");
  }, []);

  // Listen for menu IPC events (Cmd+N, Cmd+K from app menu)
  useEffect(() => {
    const cleanupNewChat = window.hermesAPI.onMenuNewChat(() => {
      handleNewChat();
    });
    const cleanupSearch = window.hermesAPI.onMenuSearchSessions(() => {
      setView("sessions");
    });
    return () => {
      cleanupNewChat();
      cleanupSearch();
    };
  }, [handleNewChat]);

  const handleSelectProfile = useCallback((name: string) => {
    setActiveProfile(name);
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const handleResumeSession = useCallback(async (sessionId: string) => {
    const dbMessages = await window.hermesAPI.getSessionMessages(sessionId);
    const chatMessages: ChatMessage[] = dbMessages.map((m) => ({
      id: `db-${m.id}`,
      role: m.role === "user" ? "user" : "agent",
      content: m.content,
    }));
    const metadata = await window.hermesAPI.getSessionMetadata(sessionId);
    setMessages(chatMessages);
    setCurrentSessionId(sessionId);
    setSessionStartedAt(metadata?.startedAt ? metadata.startedAt * 1000 : null);
    setView("chat");
  }, []);

  // ── Derived: which group is currently active ───────────
  const activeGroupId = NAV_GROUPS.find((g) => {
    if (g.mainView === view) return true;
    if (g.subItems?.some((s) => s.view === view)) return true;
    return false;
  })?.id;

  const isGroupExpanded = (groupId: string) => expandedGroup === groupId;

  return (
    <div className="layout">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const isExpanded = isGroupExpanded(group.id);
            const isActive = activeGroupId === group.id;

            return (
              <div key={group.id} className="sidebar-group">
                {/* Main nav item / group header */}
                <button
                  className={`sidebar-nav-item ${isActive && !group.subItems ? "active" : ""} ${isActive && group.subItems ? "active-group" : ""}`}
                  onClick={() => handleNavClick(group)}
                >
                  <Icon size={16} />
                  <span className="nav-label">{group.label}</span>
                  {group.subItems && (
                    <ChevronRight
                      size={12}
                      className={`nav-chevron ${isExpanded ? "expanded" : ""}`}
                    />
                  )}
                </button>

                {/* Sub-items (collapsible) */}
                {group.subItems && isExpanded && (
                  <div className="sidebar-sub-items">
                    {group.subItems.map((sub) => (
                      <button
                        key={sub.view}
                        className={`sidebar-sub-item ${view === sub.view ? "active" : ""}`}
                        onClick={() => handleSubItemClick(sub.view, group.id)}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {updateState && (
            <button className="sidebar-update-btn" onClick={handleUpdate}>
              <Download size={13} />
              {updateState === "available" && (
                <span>Update v{updateVersion}</span>
              )}
              {updateState === "downloading" && (
                <span>Downloading {downloadPercent}%</span>
              )}
              {updateState === "ready" && <span>Restart to update</span>}
            </button>
          )}
          <div className="sidebar-footer-text">
            {activeProfile === "default" ? "Hermes Agent" : activeProfile}
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────── */}
      <main className="content">
        {/* Chat — always mounted for instant switching */}
        <div
          style={{
            display: view === "chat" ? "flex" : "none",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Chat
            messages={messages}
            setMessages={setMessages}
            sessionId={currentSessionId}
            sessionStartedAt={sessionStartedAt}
            profile={activeProfile}
            onNewChat={handleNewChat}
            onOpenHistory={() => setHistoryPanelOpen(true)}
          />
        </div>

        <RightPanel
          isOpen={historyPanelOpen}
          onClose={() => setHistoryPanelOpen(false)}
        >
          <Sessions
            onResumeSession={(id) => {
              handleResumeSession(id);
              setHistoryPanelOpen(false);
            }}
            onNewChat={() => {
              handleNewChat();
              setHistoryPanelOpen(false);
            }}
            currentSessionId={currentSessionId}
          />
        </RightPanel>

        {view === "models" && <Models />}

        {view === "gateway" && <Gateway profile={activeProfile} />}

        {view === "settings" && (
          <Settings
            profile={activeProfile}
            onSelectProfile={handleSelectProfile}
            onChatWith={(name: string) => {
              handleSelectProfile(name);
              setView("chat");
            }}
          />
        )}

        {/* AI Capabilities */}
        {view === "skills" && <Skills profile={activeProfile} />}
        {view === "soul" && <Soul profile={activeProfile} />}
        {view === "memory" && <Memory profile={activeProfile} />}
        {view === "tools" && <Tools profile={activeProfile} />}

        {/* Advanced */}
        {officeVisited && view === "office" && (
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Office visible={view === "office"} />
          </div>
        )}
        {view === "schedules" && <Schedules profile={activeProfile} />}
      </main>
    </div>
  );
}

export default Layout;
