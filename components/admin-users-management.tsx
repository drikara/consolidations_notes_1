// components/admin-users-management.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Users, Key, Eye, EyeOff, Shield, Mail, UserPlus, Trash2, Edit, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AdminUsersManagementProps {
  users: User[]
  currentUserId: string
}

export function AdminUsersManagement({ users, currentUserId }: AdminUsersManagementProps) {
  const router = useRouter()
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // États pour réinitialiser le mot de passe
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // États pour créer un utilisateur
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'JURY',
    roleType: 'REPRESENTANT_METIER',
    specialite: 'NONE'
  })
  const [showCreatePassword, setShowCreatePassword] = useState(false)

  // États pour changer le rôle
  const [newRole, setNewRole] = useState('')

  // Réinitialiser le mot de passe
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation')
      }

      toast.success(`Mot de passe réinitialisé pour ${selectedUser.email}`)
      setIsResetOpen(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  // Créer un utilisateur
  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.role) {
      toast.error('Tous les champs sont requis')
      return
    }

    if (createForm.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success(`Utilisateur ${createForm.email} créé avec succès`)
      setIsCreateOpen(false)
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'JURY',
        roleType: 'REPRESENTANT_METIER',
        specialite: 'NONE'
      })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  // Changer le rôle
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) {
      toast.error('Veuillez sélectionner un rôle')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newRole
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de rôle')
      }

      toast.success(`Rôle changé de ${data.oldRole} vers ${data.newRole}`)
      setIsChangeRoleOpen(false)
      setNewRole('')
      setSelectedUser(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success(`Utilisateur ${selectedUser.email} supprimé avec succès`)
      setIsDeleteOpen(false)
      setSelectedUser(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'WFM':
        return 'bg-orange-100 text-orange-700'
      case 'JURY':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Bouton créer un utilisateur */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Liste des jurys</h2>
          <p className="text-sm text-gray-500">{users.length} utilisateur(s) au total</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer">
              <UserPlus className="w-4 h-4 mr-2" />
              Créer un jury
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouvel jury</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau membre au jury
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="create-name">Nom complet</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="jean.dupont@orange.com"
                />
              </div>

              <div>
                <Label htmlFor="create-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 8 caractères"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="create-role">Rôle</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WFM">Administrateur WFM</SelectItem>
                    <SelectItem value="JURY">Membre du Jury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createForm.role === 'JURY' && (
                <>
                  <div>
                    <Label htmlFor="create-roleType">Type de jury</Label>
                    <Select value={createForm.roleType} onValueChange={(value) => setCreateForm({ ...createForm, roleType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRH">DRH</SelectItem>
                        <SelectItem value="EPC">EPC</SelectItem>
                        <SelectItem value="REPRESENTANT_METIER">Représentant Métier</SelectItem>
                        <SelectItem value="WFM_JURY">WFM Jury</SelectItem>
                        <SelectItem value="FORMATEUR">Formateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="create-specialite">Métiers </Label>
                    <Select value={createForm.specialite || 'NONE'} onValueChange={(value) => setCreateForm({ ...createForm, specialite: value === 'NONE' ? '' : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucune" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Aucune</SelectItem>
                        <SelectItem value="CALL_CENTER">Call Center</SelectItem>
                        <SelectItem value="AGENCES">Agences</SelectItem>
                        <SelectItem value="BO_RECLAM">BO Réclamation</SelectItem>
                        <SelectItem value="TELEVENTE">Télévente</SelectItem>
                        <SelectItem value="RESEAUX_SOCIAUX">Réseaux Sociaux</SelectItem>
                        <SelectItem value="SUPERVISION">Supervision</SelectItem>
                        <SelectItem value="BOT_COGNITIVE_TRAINER">Bot Cognitive Trainer</SelectItem>
                        <SelectItem value="SMC_FIXE">SMC Fixe</SelectItem>
                        <SelectItem value="SMC_MOBILE">SMC Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={handleCreateUser}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer"
              >
                {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId
          
          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{user.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </div>

                {!isCurrentUser && (
                  <div className="flex items-center space-x-2">
                    {/* Changer le rôle */}
                    <Dialog open={isChangeRoleOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsChangeRoleOpen(open)
                      if (!open) {
                        setSelectedUser(null)
                        setNewRole('')
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.role)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Changer le rôle</DialogTitle>
                          <DialogDescription>
                            Modifier le rôle de <strong>{user.name}</strong>
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Rôle actuel</Label>
                            <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getRoleBadgeColor(user.role)} mt-2`}>
                              {user.role}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="new-role">Nouveau rôle</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WFM">Administrateur WFM</SelectItem>
                                <SelectItem value="JURY">Membre du Jury</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                               Le changement de rôle prendra effet immédiatement. L'utilisateur devra se reconnecter.
                            </p>
                          </div>

                          <Button
                            onClick={handleChangeRole}
                            disabled={isLoading || newRole === user.role}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                          >
                            {isLoading ? 'Modification...' : 'Changer le rôle'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Réinitialiser le mot de passe */}
                    <Dialog open={isResetOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsResetOpen(open)
                      if (!open) {
                        setSelectedUser(null)
                        setNewPassword('')
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                          <DialogDescription>
                            Nouveau mot de passe pour <strong>{user.name}</strong>
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 8 caractères"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4 cursor-pointer" /> : <Eye className="w-4 h-4 cursor-pointer" />}
                              </button>
                            </div>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                               Communiquez le mot de passe de manière sécurisée.
                            </p>
                          </div>

                          <Button
                            onClick={handleResetPassword}
                            disabled={isLoading || newPassword.length < 8}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer"
                          >
                            {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Supprimer */}
                    <Dialog open={isDeleteOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsDeleteOpen(open)
                      if (!open) setSelectedUser(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Supprimer l'utilisateur</span>
                          </DialogTitle>
                          <DialogDescription>
                            Cette action est irréversible. Êtes-vous sûr de vouloir supprimer <strong>{user.name}</strong> ?
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                              <strong>Attention :</strong> Toutes les données associées à cet utilisateur seront supprimées.
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={handleDeleteUser}
                              disabled={isLoading}
                              className="flex-1 bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                              {isLoading ? 'Suppression...' : 'Confirmer la suppression'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsDeleteOpen(false)}
                              disabled={isLoading}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}