import { Link, useParams } from "react-router-dom";

export default function BoardPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-4">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          &larr; Boards
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Board {id}</h1>
      <p className="mt-2 text-gray-500">Board detail page — columns and cards coming soon.</p>
    </div>
  );
}
