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

  const roleTypes = ["DRH", "EPC", "Représentant du Métier", "WFM"]

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
      const response = await fetch(`/api/jury/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (error) {
      alert("Erreur lors de la suppression")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-border focus:ring-primary"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-64 border-border focus:ring-primary">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {roleTypes.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>{availableUsers.length}</strong> utilisateur(s) avec le rôle JURY n'ont pas encore été ajoutés comme
            membres du jury.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rôle dans le Jury
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun membre du jury trouvé
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.user_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {member.role_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/wfm/jury/${member.id}/edit`}>
                        <Button variant="ghost" size="sm" className="hover:bg-muted">
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(member.id)}
                        disabled={deleting === member.id}
                      >
                        {deleting === member.id ? "..." : "Supprimer"}
                      </Button>
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
