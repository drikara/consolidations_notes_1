//components/DBTest.tsx
import { useState } from 'react'

export default function DBTest() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const testConnection = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ ${data.message} - Heure: ${new Date(data.time).toLocaleString()}`)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Test Base de Données Neon</h2>
      <button 
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Test en cours...' : 'Tester la connexion DB'}
      </button>
      {message && (
        <p className={`mt-3 p-2 rounded ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}