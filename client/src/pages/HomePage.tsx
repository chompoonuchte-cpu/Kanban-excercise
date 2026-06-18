import { useAuth } from "../contexts/AuthContext.tsx";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome, {user?.displayName}
      </h1>
      <button
        onClick={logout}
        className="mt-4 rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  );
}
