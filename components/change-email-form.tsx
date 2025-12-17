// components/change-email-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Mail, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChangeEmailFormProps {
  currentEmail: string
}

export function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    newEmail: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 Début du changement d\'email')
    console.log('📊 Données:', { 
      currentEmail, 
      newEmail: formData.newEmail,
      hasPassword: !!formData.password 
    })

    // Validation
    if (!formData.newEmail || !formData.password) {
      console.log('❌ Validation échouée: champs manquants')
      toast.error('Tous les champs sont requis')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.newEmail)) {
      console.log('❌ Validation échouée: format email invalide')
      toast.error('Format d\'email invalide')
      return
    }

    if (formData.newEmail === currentEmail) {
      console.log('❌ Validation échouée: même email')
      toast.error('Le nouvel email doit être différent de l\'email actuel')
      return
    }

    console.log('✅ Validation réussie, envoi de la requête...')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('📡 Réponse reçue:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('📦 Données de réponse:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement d\'email')
      }

      console.log('✅ Email changé avec succès!')
      toast.success('Email modifié avec succès. Veuillez vous reconnecter.')
      
      // Attendre 2 secondes puis rediriger vers login
      setTimeout(() => {
        console.log('🔄 Redirection vers /auth/login')
        router.push('/auth/login')
      }, 2000)

    } catch (error) {
      console.error('❌ Erreur lors du changement d\'email:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
      console.log('🏁 Fin du traitement')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Changer l'adresse email</h2>
          <p className="text-sm text-gray-500">Email actuel : {currentEmail}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nouvel email */}
        <div>
          <Label htmlFor="newEmail">Nouvelle adresse email</Label>
          <Input
            id="newEmail"
            type="email"
            value={formData.newEmail}
            onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
            placeholder="nouveau@exemple.com"
            required
          />
        </div>

        {/* Mot de passe pour confirmer */}
        <div>
          <Label htmlFor="password">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Entrez votre mot de passe"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Confirmez avec votre mot de passe pour des raisons de sécurité
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
             Après avoir changé votre email, vous serez déconnecté et devrez vous reconnecter avec votre nouvel email.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
        >
          {isLoading ? 'Modification en cours...' : 'Modifier l\'email'}
        </Button>
      </form>
    </div>
  )
}