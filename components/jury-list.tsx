//components/jury-list.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

type JuryMember = {
  id: number
  user_id: string
  full_name: string
  role_type: string
  email: string
  user_name: string
}

type User = {
  id: string
  name: string
  email: string
}

export function JuryList({ juryMembers, availableUsers }: { juryMembers: JuryMember[]; availableUsers: User[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [deleting, setDeleting] = useState<number | null>(null)

  const roleTypes = ["DRH", "EPC","FORMATEUR", "REPRESENTANT_METIER", "WFM_JURY"]

  const filteredMembers = juryMembers.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role_type === roleFilter
    return matchesSearch && matchesRole
  })

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre du jury ?")) {
      return
    }

    setDeleting(id)
    try {
      console.log(`🗑️ Suppression du membre jury ID: ${id}`)
      const response = await fetch(`/api/jury/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        console.log("✅ Membre du jury supprimé avec succès")
        router.refresh()
      } else {
        const error = await response.json()
        console.error("❌ Erreur suppression:", error)
        alert(`Erreur lors de la suppression: ${error.error}`)
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error)
      alert("Erreur réseau lors de la suppression")
    } finally {
      setDeleting(null)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "DRH":
        return "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
      case "EPC":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
      case "FORMATEUR":
        return "bg-gradient-to-r from-yellow-500 to-cyan-500 text-white"
      case "REPRESENTANT_METIER":
        return "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
      case "WFM_JURY":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Membres du Jury
            </h1>
            <p className="text-orange-700">
              Gestion des {juryMembers.length} membre{juryMembers.length > 1 ? 's' : ''} du jury
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-64 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="rounded-lg">Tous les rôles</SelectItem>
                {roleTypes.map((role) => (
                  <SelectItem key={role} value={role} className="rounded-lg">
                    {role === "REPRESENTANT_METIER" ? "Représentant du Métier" : 
                     role === "WFM_JURY" ? "WFM Jury" : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bannière utilisateurs disponibles */}
      {availableUsers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {availableUsers.length} utilisateur{availableUsers.length > 1 ? 's' : ''} disponible{availableUsers.length > 1 ? 's' : ''}
              </h3>
              <p className="text-amber-700 text-sm">
                Avec le rôle JURY, pas encore ajoutés comme membres du jury.
              </p>
            </div>
            <Link href="/wfm/jury/new">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un membre
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Tableau des membres */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-orange-600 font-medium text-lg">Aucun membre trouvé</p>
                      <p className="text-orange-500 text-sm mt-1">
                        Aucun membre du jury ne correspond à vos critères de recherche
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-orange-50/50 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                          {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                            {member.full_name}
                          </p>
                          <p className="text-sm text-orange-600">{member.user_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getRoleColor(member.role_type)} shadow-sm`}>
                        {member.role_type === "REPRESENTANT_METIER" ? "Représentant du Métier" : 
                         member.role_type === "WFM_JURY" ? "WFM Jury" : member.role_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/wfm/jury/${member.id}/edit`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 rounded-lg px-4 shadow-sm cursor-pointer"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifier
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 rounded-lg px-4 shadow-sm"
                          onClick={() => handleDelete(member.id)}
                          disabled={deleting === member.id}
                        >
                          {deleting === member.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          {deleting === member.id ? "..." : "Supprimer"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}