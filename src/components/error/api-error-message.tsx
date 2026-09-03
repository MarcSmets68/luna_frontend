import { AppShell } from "@/components/layout/app-shell";

interface ApiErrorMessageProps {
  error: unknown;
  pageName?: string;
}

export function ApiErrorMessage({ error, pageName = "deze pagina" }: ApiErrorMessageProps) {
  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">API Niet Bereikbaar</h1>
        <p className="text-gray-700 mb-4">
          De backend API is momenteel niet bereikbaar voor {pageName}. Dit kan gebeuren wanneer:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
          <li>De PASOE server is niet publiek beschikbaar</li>
          <li>De API_BASE_URL environment variable is niet correct geconfigureerd</li>
          <li>De backend server is offline</li>
        </ul>
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="text-sm font-semibold text-gray-700 mb-2">Technische details:</p>
          <p className="text-sm text-gray-600 font-mono">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Voor ontwikkelaars:</strong> Configureer de <code className="bg-blue-100 px-1 rounded">API_BASE_URL</code> environment 
            variable in Vercel met een publiek bereikbare PASOE server URL.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
