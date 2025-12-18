// app/not-found.tsx
export const metadata = {
  title: "Page non trouvée",
  description: "La page que vous recherchez n'existe pas.",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page non trouvée</h2>
        <p className="text-muted-foreground mb-8">
          La page que vous recherchez n'existe pas.
        </p>
        <a 
          href="/wfm/dashboard"
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  )
}