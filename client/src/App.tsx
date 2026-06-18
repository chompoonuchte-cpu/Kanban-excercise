import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import BoardListPage from "./pages/BoardListPage.tsx";
import BoardPage from "./pages/BoardPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <BoardListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boards/:id"
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
