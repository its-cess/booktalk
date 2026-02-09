import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

/**
 * Home page content. Shown for everyone at "/".
 * Layout (header + nav) is provided by Layout; this is just the main content.
 */
export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <p className="text-muted-foreground" style={{ color: "#737373" }}>
          Welcome, {user?.displayName ?? user?.username}. Your feed will go here.
        </p>
      ) : (
        <div className="text-center py-16 space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: "#171717" }}>
            BookTok for Millenials
          </h2>
          <p style={{ color: "#737373" }}>
            Sign up or log in to start posting and following.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
