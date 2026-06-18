import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome, {user?.displayName}
      </h1>
      <div className="mt-4 flex gap-3">
        <Link
          to="/profile"
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Profile
        </Link>
        <button
          onClick={logout}
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
