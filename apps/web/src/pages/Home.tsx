import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-input px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">BookTalk</h1>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
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
      <main className="max-w-2xl mx-auto p-4">
        {isAuthenticated ? (
          <p className="text-muted-foreground">
            Welcome, {user?.displayName ?? user?.username}. Your feed will go
            here.
          </p>
        ) : (
          <div className="text-center py-16 space-y-4">
            <h2 className="text-2xl font-semibold">
              Talk about books with other readers
            </h2>
            <p className="text-muted-foreground">
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
      </main>
    </div>
  );
}
