// components/recent-candidates.tsx (VERSION PRISMA - SANS SQL DIRECT)
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface RecentCandidatesProps {
  filters?: {
    year?: string
    month?: string
    metier?: string
    search?: string
    status?: string
    dateRange?: string
  }
}

// Configuration des critères par métier (identique à avant)
const metierCriteria: Record<string, any> = {
  "CALL_CENTER": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      excel: 3,
      dictation: 14
    }
  },
  "AGENCES": {
    requiredTests: ["Face à Face", "Saisie", "Dictée", "Simulation Vente"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      dictation: 14,
      salesSimulation: 3
    }
  },
  "BO_RECLAM": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée", "Test Psychotechnique"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      excel: 3,
      dictation: 14,
      psychotechnicalTest: 3
    }
  },
  "TELEVENTE": {
    requiredTests: ["Face à Face", "Saisie", "Dictée", "Simulation Vente"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      dictation: 14,
      salesSimulation: 3
    }
  },
  "RESEAUX_SOCIAUX": {
    requiredTests: ["Face à Face", "Saisie", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 23,
      typingAccuracy: 85,
      dictation: 16
    }
  },
  "SUPERVISION": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      excel: 3,
      dictation: 14
    }
  },
  "BOT_COGNITIVE_TRAINER": {
    requiredTests: ["Face à Face", "Excel", "Dictée", "Exercice Analyse"],
    thresholds: {
      faceToFace: 3,
      excel: 3,
      dictation: 14,
      analysisExercise: 3
    }
  },
  "SMC_FIXE": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 75,
      excel: 3,
      dictation: 14
    }
  },
  "SMC_MOBILE": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 14
    }
  }
}

export async function RecentCandidates({ filters }: RecentCandidatesProps) {
  // Pagination
  const itemsPerPage = 10
  const currentPage = 1 // Tu peux le rendre dynamique avec searchParams
  
  // Récupérer le nombre total de candidats
  const totalCandidates = await prisma.candidate.count()
  const totalPages = Math.ceil(totalCandidates / itemsPerPage)
  
  // Récupérer les candidats avec Prisma
  const candidates = await prisma.candidate.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      scores: true,
      faceToFaceScores: {
        where: { phase: 1 },
        select: {
          presentationVisuelle: true,
          verbalCommunication: true,
          voiceQuality: true,
          score: true
        }
      }
    }
  })

  // Fonction pour formater la date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  // Fonction pour formater les nombres
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    // Convertir Decimal en number
    const numValue = typeof value === 'object' && 'toNumber' in value ? value.toNumber() : Number(value)
    return numValue.toFixed(2)
  }

  // Fonction pour vérifier si un test est requis
  const isTestRequired = (metier: string, testName: string) => {
    const criteria = metierCriteria[metier]
    return criteria?.requiredTests.includes(testName) || false
  }

  // Fonction pour vérifier si un test est passé
  const isTestPassed = (candidate: any, testName: string) => {
    const criteria = metierCriteria[candidate.metier]
    if (!criteria) return null

    const thresholds = criteria.thresholds
    const scores = candidate.scores

    if (!scores) return null

    switch (testName) {
      case "Face à Face":
        // Vérifier les sous-critères individuellement
        const scores = candidate.scores
        if (!scores) return null
        
        const voiceOk = (Number(scores.voiceQuality) || 0) >= 3
        const verbalOk = (Number(scores.verbalCommunication) || 0) >= 3
        const presOk = candidate.metier === 'AGENCES' 
          ? (Number(scores.presentationVisuelle) || 0) >= 3 
          : true
        
        return voiceOk && verbalOk && presOk
      
      case "Saisie":
        return scores.typingSpeed >= thresholds.typingSpeed && 
               scores.typingAccuracy >= thresholds.typingAccuracy
      
      case "Excel":
        return Number(scores.excelTest) >= thresholds.excel
      
      case "Dictée":
        return Number(scores.dictation) >= thresholds.dictation
      
      case "Simulation Vente":
        // Vérifier les sous-critères
        const simNeg = Number(scores.simulationSensNegociation) || 0
        const simPers = Number(scores.simulationCapacitePersuasion) || 0
        const simComb = Number(scores.simulationSensCombativite) || 0
        return simNeg >= 3 && simPers >= 3 && simComb >= 3
      
      case "Test Psychotechnique":
        // Vérifier les sous-critères
        const psychoRais = Number(scores.psychoRaisonnementLogique) || 0
        const psychoAtt = Number(scores.psychoAttentionConcentration) || 0
        return psychoRais >= 3 && psychoAtt >= 3
      
      case "Exercice Analyse":
        return Number(scores.analysisExercise) >= thresholds.analysisExercise
      
      default:
        return null
    }
  }

  // Fonction pour obtenir le statut d'un test
  const getTestStatus = (candidate: any, testName: string) => {
    const required = isTestRequired(candidate.metier, testName)
    if (!required) return { required: false, passed: null }

    const passed = isTestPassed(candidate, testName)
    return { required: true, passed }
  }

  // Fonction pour obtenir le seuil d'un test
  const getTestThreshold = (metier: string, testName: string): string => {
    const criteria = metierCriteria[metier]
    if (!criteria) return ""

    const thresholds = criteria.thresholds

    switch (testName) {
      case "Face à Face":
        return `≥ ${thresholds.faceToFace}/5`
      case "Saisie":
        return `≥ ${thresholds.typingSpeed} MPM + ${thresholds.typingAccuracy}%`
      case "Excel":
        return `≥ ${thresholds.excel}/5`
      case "Dictée":
        return `≥ ${thresholds.dictation}/20`
      case "Simulation Vente":
        return `≥ 3/5 (tous critères)`
      case "Test Psychotechnique":
        return `≥ 3/5 (tous critères)`
      case "Exercice Analyse":
        return `≥ ${thresholds.analysisExercise}/5`
      default:
        return ""
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Candidats Récents
          </h2>
          <p className="text-orange-500 font-medium">
            {candidates.length} candidat{candidates.length > 1 ? 's' : ''} affiché{candidates.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/wfm/candidates">
            <Button 
              variant="outline" 
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 cursor-pointer font-semibold px-6 py-2 rounded-xl"
            >
              Voir tout
            </Button>
          </Link>
          <Link href="/wfm/candidates/new">
            <Button 
              className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 transition-all duration-300 cursor-pointer font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Candidat
            </Button>
          </Link>
        </div>
      </div>

      {/* Liste des candidats */}
      <div className="space-y-6">
        {candidates.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-white rounded-2xl border-2 border-dashed border-orange-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="text-orange-600 text-xl font-semibold mb-2">Aucun candidat trouvé</div>
            <p className="text-orange-500 mb-6 max-w-sm mx-auto">
              Les candidats apparaîtront ici une fois ajoutés au système.
            </p>
            <Link href="/wfm/candidates/new">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 transition-all duration-300 cursor-pointer font-semibold px-6 py-3 rounded-xl">
                Ajouter le premier candidat
              </Button>
            </Link>
          </div>
        ) : (
          candidates.map((candidate) => {
            const criteria = metierCriteria[candidate.metier]
            const scores = candidate.scores
            
            return (
              <div key={candidate.id} className="bg-white rounded-2xl p-6 space-y-6 border-2 border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-orange-200 group">
                {/* En-tête avec nom et statut */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {candidate.nom.charAt(0)}{candidate.prenom.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl group-hover:text-orange-700 transition-colors">
                          {candidate.nom} {candidate.prenom}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {scores?.finalDecision && (
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                                scores.finalDecision === "RECRUTE" 
                                  ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200" 
                                  : "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {scores.finalDecision}
                            </span>
                          )}
                          {scores?.statut && (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                              scores.statut === 'PRESENT'
                                ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200"
                                : "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200"
                            }`}>
                              {scores.statut === 'PRESENT' ? '✅ Présent' : '❌ Absent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-600 ml-16">
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {candidate.metier.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {candidate.email || 'Pas d\'email'}
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {candidate.age} ans
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        {candidate.niveauEtudes.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/wfm/scores/${candidate.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 cursor-pointer font-medium rounded-lg px-4"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                      </Button>
                    </Link>
                    <Link href={`/wfm/candidates/${candidate.id}/edit`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 cursor-pointer font-medium rounded-lg px-4"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Modifier
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Informations académiques */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 border-2 border-orange-100">
                  <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span>Formation & Études</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-orange-100">
                      <div className="text-sm text-orange-600 font-medium mb-2">Formation</div>
                      <div className="text-base font-semibold text-gray-900">{candidate.diploma}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-100">
                      <div className="text-sm text-orange-600 font-medium mb-2">Établissement</div>
                      <div className="text-base font-semibold text-gray-900">{candidate.institution}</div>
                    </div>
                  </div>
                </div>

                {/* Notes détaillées - Face à Face (Sous-critères) */}
                {scores && (
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border-2 border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <span>Face à Face - Sous-critères</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Qualité de la voix */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-2">Qualité de la voix</div>
                        <div className={`text-2xl font-bold ${
                          scores.voiceQuality && Number(scores.voiceQuality) >= 3 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {scores.voiceQuality ? `${formatNumber(scores.voiceQuality)}/5` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                      </div>

                      {/* Communication verbale */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-2">Communication verbale</div>
                        <div className={`text-2xl font-bold ${
                          scores.verbalCommunication && Number(scores.verbalCommunication) >= 3 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {scores.verbalCommunication ? `${formatNumber(scores.verbalCommunication)}/5` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                      </div>

                      {/* Présentation visuelle (si AGENCES) */}
                      {candidate.metier === 'AGENCES' && (
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                          <div className="text-sm text-blue-600 font-medium mb-2">Présentation visuelle</div>
                          <div className={`text-2xl font-bold ${
                            scores.presentationVisuelle && Number(scores.presentationVisuelle) >= 3 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {scores.presentationVisuelle ? `${formatNumber(scores.presentationVisuelle)}/5` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tests Techniques - Affichage conditionnel selon métier */}
                {scores && (
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border-2 border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span>Tests Techniques</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {/* Saisie - Rapidité (si requis) */}
                      {isTestRequired(candidate.metier, "Saisie") && scores.typingSpeed !== null && scores.typingSpeed !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Rapidité de saisie</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.typingSpeed) >= (criteria?.thresholds?.typingSpeed || 17)
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {scores.typingSpeed} MPM
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Minimum: {criteria?.thresholds?.typingSpeed || 17} MPM
                          </div>
                        </div>
                      )}

                      {/* Saisie - Précision (si requis) */}
                      {isTestRequired(candidate.metier, "Saisie") && scores.typingAccuracy !== null && scores.typingAccuracy !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Précision de saisie</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.typingAccuracy) >= (criteria?.thresholds?.typingAccuracy || 75)
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.typingAccuracy)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Minimum: {criteria?.thresholds?.typingAccuracy || 75}%
                          </div>
                        </div>
                      )}

                      {/* Excel (si requis) */}
                      {isTestRequired(candidate.metier, "Excel") && scores.excelTest !== null && scores.excelTest !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Test Excel</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.excelTest) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.excelTest)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Dictée (si requis) */}
                      {isTestRequired(candidate.metier, "Dictée") && scores.dictation !== null && scores.dictation !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Dictée</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.dictation) >= (criteria?.thresholds?.dictation || 14)
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.dictation)}/20
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Minimum: {criteria?.thresholds?.dictation || 14}/20
                          </div>
                        </div>
                      )}

                      {/* Simulation - Sens négociation (si requis) */}
                      {isTestRequired(candidate.metier, "Simulation Vente") && scores.simulationSensNegociation !== null && scores.simulationSensNegociation !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Sens de la négociation</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.simulationSensNegociation) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.simulationSensNegociation)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Simulation - Capacité persuasion (si requis) */}
                      {isTestRequired(candidate.metier, "Simulation Vente") && scores.simulationCapacitePersuasion !== null && scores.simulationCapacitePersuasion !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Capacité de persuasion</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.simulationCapacitePersuasion) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.simulationCapacitePersuasion)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Simulation - Sens combativité (si requis) */}
                      {isTestRequired(candidate.metier, "Simulation Vente") && scores.simulationSensCombativite !== null && scores.simulationSensCombativite !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Sens de la combativité</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.simulationSensCombativite) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.simulationSensCombativite)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Psychotechnique - Raisonnement logique (si requis) */}
                      {isTestRequired(candidate.metier, "Test Psychotechnique") && scores.psychoRaisonnementLogique !== null && scores.psychoRaisonnementLogique !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Raisonnement logique</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.psychoRaisonnementLogique) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.psychoRaisonnementLogique)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Psychotechnique - Attention concentration (si requis) */}
                      {isTestRequired(candidate.metier, "Test Psychotechnique") && scores.psychoAttentionConcentration !== null && scores.psychoAttentionConcentration !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Attention & concentration</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.psychoAttentionConcentration) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.psychoAttentionConcentration)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}

                      {/* Exercice d'analyse (si requis) */}
                      {isTestRequired(candidate.metier, "Exercice Analyse") && scores.analysisExercise !== null && scores.analysisExercise !== undefined && (
                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                          <div className="text-sm text-purple-600 font-medium mb-2">Exercice d'analyse</div>
                          <div className={`text-2xl font-bold ${
                            Number(scores.analysisExercise) >= 3
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatNumber(scores.analysisExercise)}/5
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Minimum: 3/5</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commentaires */}
                {scores?.comments && (
                  <div className="rounded-2xl p-5 border-2 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <h4 className="font-semibold mb-3 text-blue-700">Commentaires</h4>
                    <p className="text-sm leading-relaxed bg-white px-4 py-3 rounded-xl border">
                      {scores.comments}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-orange-100 pt-6">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-orange-600">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Link href={`?page=${Math.max(1, currentPage - 1)}`}>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </Button>
            </Link>
            
            {/* Numéros de pages */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Link key={pageNum} href={`?page=${pageNum}`}>
                    <Button
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={currentPage === pageNum 
                        ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0 rounded-lg px-4"
                        : "border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg px-4"
                      }
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>

            <Link href={`?page=${Math.min(totalPages, currentPage + 1)}`}>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4"
              >
                Suivant
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}