import { Outlet, Link } from "react-router-dom";
import { BookOpen, Bell, Home, LogOut, LogIn, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const HEADER_HEIGHT = "3.5rem";

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();

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
              <IconButton
                to="/"
                label="Home"
                icon={<Home size={18} />}
              />
              <IconButton
                to={`/${user?.username}`}
                label="Profile"
                icon={<User size={18} />}
              />
              <IconButton
                to="/notifications"
                label="Notifications"
                icon={<Bell size={18} />}
              />
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
