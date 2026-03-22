import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Bell, Home, LogOut, LogIn, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/queries";
import NotificationDropdown from "./NotificationDropdown";
import { Button } from "@/components/ui/button";

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
    <div className="bg-muted/50" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <header
        className="bg-background border-b"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="text-foreground"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 700,
            fontSize: "1.1rem",
            textDecoration: "none",
            fontFamily: '"Zalando Sans SemiExpanded", sans-serif',
          }}
        >
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                  className={`relative h-9 w-9${notifOpen ? " bg-muted" : ""}`}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      data-testid="notification-badge"
                      className="bg-destructive text-destructive-foreground"
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "8px",
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
                </Button>

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
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={to ? () => navigate(to) : onClick}
      className="h-9 w-9 text-muted-foreground"
    >
      {icon}
    </Button>
  );
}
