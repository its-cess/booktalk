import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { BookOpen, Bell, Home, LogOut, LogIn, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/queries";
import NotificationDropdown from "./NotificationDropdown";

const HEADER_HEIGHT = "3.5rem";

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: HEADER_HEIGHT,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#171717",
            textDecoration: "none",
          }}
        >
          <BookOpen size={20} />
          BookTalk
        </Link>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {isAuthenticated ? (
            <>
              <IconButton to="/" label="Home" icon={<Home size={18} />} />
              <IconButton
                to={`/${user?.username}`}
                label="Profile"
                icon={<User size={18} />}
              />

              {/* Notification bell with badge + dropdown */}
              <div ref={bellRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  title="Notifications"
                  aria-label="Notifications"
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.5rem",
                    color: notifOpen ? "#171717" : "#525252",
                    background: notifOpen ? "#f0f0f0" : "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f0f0";
                    (e.currentTarget as HTMLElement).style.color = "#171717";
                  }}
                  onMouseLeave={(e) => {
                    if (!notifOpen) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#525252";
                    }
                  }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      data-testid="notification-badge"
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "8px",
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 3px",
                        lineHeight: 1,
                        pointerEvents: "none",
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <NotificationDropdown onClose={() => setNotifOpen(false)} />
                )}
              </div>

              <IconButton
                label="Log out"
                icon={<LogOut size={18} />}
                onClick={logout}
              />
            </>
          ) : (
            <IconButton
              to="/login"
              label="Log in"
              icon={<LogIn size={18} />}
            />
          )}
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function IconButton({
  to,
  label,
  icon,
  onClick,
}: {
  to?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.5rem",
    color: "#525252",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
  };

  const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f0f0";
    (e.currentTarget as HTMLElement).style.color = "#171717";
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
    (e.currentTarget as HTMLElement).style.color = "#525252";
  };

  if (to) {
    return (
      <Link
        to={to}
        title={label}
        aria-label={label}
        style={style}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={style}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      {icon}
    </button>
  );
}
