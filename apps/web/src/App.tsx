import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import Layout from "@/components/Layout";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import PostDetail from "@/pages/PostDetail";
import FollowList from "@/pages/FollowList";
import SearchPage from "@/pages/Search";
import BookDetail from "@/pages/BookDetail";
import ShelfDetail from "@/pages/ShelfDetail";
import Settings from "@/pages/Settings";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <PWAUpdatePrompt />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="posts/:id" element={<PostDetail />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path=":username/followers" element={<FollowList />} />
            <Route path=":username/following" element={<FollowList />} />
            <Route path=":username/shelves/:shelfId" element={<ShelfDetail />} />
            <Route path=":username" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
