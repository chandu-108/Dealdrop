import Link from "next/link";

export default async function ErrorPage({ searchParams }) {
  const sp = searchParams ? await searchParams : {};
  const debug = sp?.debug ?? null;

  const isDev = process.env.NODE_ENV !== "production";
  const serviceKeyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKeyPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, there was an error during authentication. Please try again.
        </p>
        {debug ? (
          <pre className="text-sm text-left bg-gray-100 p-3 rounded mb-4 overflow-x-auto">
            {debug}
          </pre>
        ) : null}

        {isDev ? (
          <div className="text-xs text-left text-gray-500 mb-4">
            <div className="font-medium">Dev diagnostics:</div>
            <div>SUPABASE_SERVICE_ROLE_KEY present: {String(serviceKeyPresent)}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY present: {String(anonKeyPresent)}</div>
          </div>
        ) : null}

        {isDev && !serviceKeyPresent ? (
          <div className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
            <div className="font-medium">Action</div>
            <div className="mt-1">Add a server-only env var <code>SUPABASE_SERVICE_ROLE_KEY</code> to your <code>.env.local</code>, then restart the dev server.</div>
            <pre className="mt-2 text-xs bg-white p-2 rounded">NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</pre>
          </div>
        ) : null}

        <Link
          href="/"
          className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}