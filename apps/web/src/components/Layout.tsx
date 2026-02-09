import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

/**
 * Layout always renders a visible shell (header + outlet).
 * Inline fallback styles ensure something shows even if Tailwind theme fails.
 */
export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#171717",
      }}
    >
      <header
        className="border-b border-input px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #e5e5e5" }}
      >
        <Link to="/" className="text-xl font-bold no-underline" style={{ color: "inherit" }}>
          BookTalk
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm" style={{ color: "#737373" }}>
                {user?.displayName ?? user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>
      <main
        className="max-w-2xl mx-auto p-4 w-full"
        style={{
          maxWidth: "42rem",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "1rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
