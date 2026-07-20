import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Bell, Home, LogOut, LogIn, Megaphone, Pencil, User, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/queries";
import NotificationPanel from "./NotificationDropdown";
import PostComposer from "./post/PostComposer";
import FeedbackDialog from "./FeedbackDialog";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const HEADER_H = "3.5rem";
const SIDEBAR_W = "22rem";

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/");
  }
  const [searchParams] = useSearchParams();

  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const [notifExpanded, setNotifExpanded] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Sync header search input with URL when on /search
  const urlQuery = location.pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [searchInput, setSearchInput] = useState(urlQuery);
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  // Navigate home when search is cleared (via backspace/delete, not just X button)
  useEffect(() => {
    if (searchInput.trim() !== "") return;
    if (location.pathname !== "/search") return;
    const timer = setTimeout(() => navigate("/"), 350);
    return () => clearTimeout(timer);
  }, [searchInput, location.pathname, navigate]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  function handleSearchClear() {
    setSearchInput("");
    if (location.pathname === "/search") navigate("/");
  }

  const isActive = (path: string) => location.pathname === path;

  function navClass(active: boolean) {
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors w-full text-left",
      active
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">

      {/* ── Full-width top header ── */}
      <header
        className="bg-background fixed top-0 left-0 right-0 z-30 flex items-center border-b border-border"
        style={{ height: HEADER_H }}
      >
        {/* Logo — same width as sidebar so search aligns with content column */}
        <div
          className="hidden md:flex items-center flex-shrink-0"
          style={{ width: SIDEBAR_W, paddingLeft: "1.25rem" }}
        >
          <Link
            to="/"
            className="text-foreground"
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              textDecoration: "none",
              fontFamily: '"Zalando Sans SemiExpanded", sans-serif',
            }}
          >
            BookTalk
          </Link>
        </div>

        {/* Mobile logo — hidden on mobile */}
        <div className="hidden items-center flex-shrink-0" style={{ paddingLeft: "1rem", marginRight: "0.75rem" }}>
          <Link
            to="/"
            className="text-foreground"
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: '"Zalando Sans SemiExpanded", sans-serif',
            }}
          >
            BookTalk
          </Link>
        </div>

        {/* Search — centered in content column */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 1.25rem" }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ position: "relative", width: "100%", maxWidth: "35rem" }}
          >
            <Search
              size={15}
              className="text-muted-foreground"
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search books or posts..."
              style={{
                paddingLeft: "2.25rem",
                paddingRight: searchInput ? "2.25rem" : undefined,
              }}
            />
            {searchInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleSearchClear}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              >
                <X size={14} />
              </Button>
            )}
          </form>
        </div>

        {/* Right side: theme toggle (all sizes) + feedback (mobile only) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.125rem", flexShrink: 0, paddingRight: "1rem", paddingLeft: "0.5rem" }}>
          <ThemeToggle />
          <button
            onClick={() => setFeedbackOpen(true)}
            aria-label="Send feedback"
            className="flex md:hidden items-center text-muted-foreground"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0.5rem", flexShrink: 0 }}
          >
            <Megaphone size={20} />
          </button>
        </div>
      </header>

      {/* ── Below header: sidebar + main ── */}
      <div
        className="flex"
        style={{ paddingTop: HEADER_H, minHeight: "100vh" }}
      >
        {/* Desktop sidebar — hidden on mobile */}
        <aside
          className="hidden md:flex flex-col bg-background fixed left-0 bottom-0 z-20"
          style={{
            width: SIDEBAR_W,
            top: HEADER_H,
            borderRight: "1px solid hsl(var(--border))",
            overflow: "hidden",
          }}
        >
          <nav
            style={{
              flex: 1,
              padding: "0.75rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              fontFamily: '"Zalando Sans SemiExpanded", sans-serif',
              gap: "0.125rem",
              overflowY: "auto",
            }}
          >
            <Link to="/" className={navClass(isActive("/"))}>
              <Home size={16} />
              Home
            </Link>

            {isAuthenticated && (
              <>
                {/* Notifications — inline collapsible */}
                <button
                  data-testid="notifications-toggle"
                  onClick={() => setNotifExpanded((v) => !v)}
                  className={navClass(notifExpanded)}
                  style={{ border: "none", cursor: "pointer", background: "none" }}
                >
                  <Bell size={16} />
                  <span style={{ flex: 1 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      data-testid="notification-badge"
                      className="bg-primary text-primary-foreground"
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 3px",
                        lineHeight: 1,
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {notifExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {notifExpanded && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    <NotificationPanel />
                  </div>
                )}

                <Link
                  to={`/${user?.username}`}
                  className={navClass(location.pathname === `/${user?.username}`)}
                >
                  <User size={16} />
                  Profile
                </Link>

                <Button
                  onClick={() => setPostModalOpen(true)}
                  className="w-full mt-2 gap-3 justify-start px-3"
                  style={{ fontFamily: '"Zalando Sans SemiExpanded", sans-serif', fontSize: "0.875rem" }}
                >
                  <Pencil size={16} />
                  Post
                </Button>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/login" className={navClass(isActive("/login"))}>
                <LogIn size={16} />
                Log in
              </Link>
            )}
          </nav>

          <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid hsl(var(--border))", fontFamily: '"Zalando Sans SemiExpanded", sans-serif' }}>
            <button
              onClick={() => setFeedbackOpen(true)}
              className={navClass(false)}
              style={{ border: "none", cursor: "pointer", background: "none" }}
            >
              <Megaphone size={16} />
              Feedback
            </button>
            {isAuthenticated && (
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className={navClass(false)}
                style={{ border: "none", cursor: "pointer", background: "none" }}
              >
                <LogOut size={16} />
                Log out
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main
          className="md:ml-[22rem] md:pb-0"
          style={{ flex: 1, paddingBottom: "5rem", minWidth: 0 }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav (hidden on md+) ── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-background z-20 items-center justify-around border-t border-border" style={{ height: "4rem" }}>
        <MobileNavBtn
          icon={<Home size={21} />}
          label="Home"
          onClick={() => navigate("/")}
          active={isActive("/")}
        />

        {isAuthenticated && (
          <>
            <div style={{ position: "relative" }}>
              <MobileNavBtn
                icon={<Bell size={21} />}
                label="Notifications"
                onClick={() => setMobileNotifOpen(true)}
                active={mobileNotifOpen}
              />
              {unreadCount > 0 && (
                <span
                  className="bg-primary text-primary-foreground"
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    minWidth: "14px",
                    height: "14px",
                    borderRadius: "7px",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 2px",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            <button
              aria-label="New post"
              onClick={() => setPostModalOpen(true)}
              className="bg-primary text-primary-foreground"
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                width: "2.75rem",
                height: "2.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Pencil size={18} />
            </button>

            <MobileNavBtn
              icon={<User size={21} />}
              label="Profile"
              onClick={() => navigate(`/${user?.username}`)}
              active={location.pathname === `/${user?.username}`}
            />

            <MobileNavBtn
              icon={<LogOut size={21} />}
              label="Log out"
              onClick={handleLogout}
              active={false}
            />
          </>
        )}

        {!isAuthenticated && (
          <MobileNavBtn
            icon={<LogIn size={21} />}
            label="Log in"
            onClick={() => navigate("/login")}
            active={isActive("/login")}
          />
        )}
      </nav>

      {/* ── Post modal ── */}
      <Dialog.Root open={postModalOpen} onOpenChange={setPostModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="bg-black/40"
            style={{ position: "fixed", inset: 0, zIndex: 50 }}
          />
          <Dialog.Content
            className="bg-background rounded-sm shadow-lg"
            style={{
              position: "fixed",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 2rem)",
              maxWidth: "38rem",
              zIndex: 51,
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.5rem 0.75rem 0" }}>
              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground"
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: "0.25rem" }}
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
            <PostComposer onSuccess={() => setPostModalOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Mobile notification Sheet ── */}
      <Sheet open={mobileNotifOpen} onOpenChange={setMobileNotifOpen}>
        <SheetContent
          side="bottom"
          showClose={false}
          style={{ maxHeight: "70vh", overflow: "hidden" }}
        >
          <NotificationPanel onClose={() => setMobileNotifOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Feedback modal ── */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

function MobileNavBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={active ? "text-primary" : "text-muted-foreground"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.375rem",
      }}
    >
      {icon}
    </button>
  );
}
