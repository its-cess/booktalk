import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Home, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <div
      className="flex min-h-screen bg-background text-foreground"
      style={{ backgroundColor: "#ffffff", color: "#171717" }}
    >
      {/* Left sidebar */}
      <aside
        className="fixed inset-y-0 left-0 flex flex-col w-60 px-4 py-6"
        style={{ borderRight: "1px solid #e5e5e5", width: "15rem" }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold mb-8"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <BookOpen className="w-6 h-6" />
          BookTalk
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: location.pathname === "/" ? "#f5f5f5" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== "/")
                (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== "/")
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </nav>

        {/* Bottom: profile + auth actions */}
        <div className="mt-auto flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to={`/profile/${user?.username}`}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                style={{ textDecoration: "none", color: "inherit" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                }
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: "#e5e5e5", color: "#404040" }}
                >
                  {(user?.displayName ?? user?.username ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-medium leading-tight">
                    {user?.displayName}
                  </span>
                  <span className="truncate text-xs" style={{ color: "#737373" }}>
                    @{user?.username}
                  </span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left"
                style={{
                  color: "#737373",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                }
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" style={{ textDecoration: "none" }}>
                <Button className="w-full">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1" style={{ marginLeft: "15rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
