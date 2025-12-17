// components/change-password-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react'

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]+/)) strength++
    if (password.match(/[A-Z]+/)) strength++
    if (password.match(/[0-9]+/)) strength++
    if (password.match(/[$@#&!]+/)) strength++
    return strength
  }

  const strength = passwordStrength(formData.newPassword)
  const strengthColor = 
    strength <= 2 ? 'bg-red-500' : 
    strength === 3 ? 'bg-yellow-500' : 
    'bg-green-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Tous les champs sont requis')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe')
      }

      toast.success('Mot de passe modifié avec succès')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Lock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
          <p className="text-sm text-gray-500">Mettez à jour votre mot de passe de connexion</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mot de passe actuel */}
        <div>
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Indicateur de force */}
          {formData.newPassword && (
            <div className="mt-2 space-y-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= strength ? strengthColor : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="space-y-1 text-xs">
                <div className={`flex items-center space-x-2 ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData.newPassword.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Au moins 8 caractères</span>
                </div>
                <div className={`flex items-center space-x-2 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/[A-Z]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Une majuscule</span>
                </div>
                <div className={`flex items-center space-x-2 ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/[0-9]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Un chiffre</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmer le mot de passe */}
        <div>
          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || formData.newPassword !== formData.confirmPassword}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer"
        >
          {isLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
        </Button>
      </form>
    </div>
  )
}