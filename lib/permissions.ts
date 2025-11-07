// lib/permissions.ts
import { Metier, JuryRoleType, SessionStatus } from "@prisma/client"

export function canJuryMemberAccessCandidate(juryMember: any, candidate: any): boolean {
  // DRH, EPC et WFM_JURY peuvent voir tous les candidats
  if (["DRH", "EPC", "WFM_JURY"].includes(juryMember.roleType)) {
    return true
  }

  // REPRESENTANT_METIER ne voit que les candidats de son métier
  if (juryMember.roleType === "REPRESENTANT_METIER") {
    return juryMember.specialite === candidate.metier
  }

  return false
}

export function isSessionActive(session: any): boolean {
  if (!session) return false
  return session.status === "PLANIFIED" || session.status === "IN_PROGRESS"
}

export function canJuryEvaluate(session: any): boolean {
  if (!session) return false
  // Les jurys ne peuvent noter que pendant les sessions PLANIFIED ou IN_PROGRESS
  return session.status === "PLANIFIED" || session.status === "IN_PROGRESS"
}

export function filterCandidatesForJury(candidates: any[], juryMember: any): any[] {
  return candidates.filter(candidate => 
    canJuryMemberAccessCandidate(juryMember, candidate) &&
    isSessionActive(candidate.session)
  )
}