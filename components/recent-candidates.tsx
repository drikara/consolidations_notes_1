import { sql } from "@/lib/db"
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

// Types pour les seuils
interface BaseThresholds {
  dictation: number
}

interface FaceToFaceThresholds extends BaseThresholds {
  faceToFace: number
}

interface TypingThresholds extends BaseThresholds {
  typingSpeed: number
  typingAccuracy: number
}

interface ExcelThresholds extends BaseThresholds {
  excel: number
}

interface SalesThresholds extends BaseThresholds {
  salesSimulation: number
}

interface PsychotechnicalThresholds extends BaseThresholds {
  psychotechnicalTest: number
}

interface AnalysisThresholds extends BaseThresholds {
  analysisExercise: number
}

type CallCenterThresholds = FaceToFaceThresholds & TypingThresholds & ExcelThresholds
type AgencesThresholds = FaceToFaceThresholds & TypingThresholds & SalesThresholds
type BoReclamThresholds = TypingThresholds & ExcelThresholds & PsychotechnicalThresholds
type TeleventeThresholds = FaceToFaceThresholds & TypingThresholds & SalesThresholds
type ReseauxSociauxThresholds = FaceToFaceThresholds & TypingThresholds
type SupervisionThresholds = FaceToFaceThresholds & TypingThresholds & ExcelThresholds
type BotCognitiveTrainerThresholds = FaceToFaceThresholds & ExcelThresholds & AnalysisThresholds
type SmcFixeMobileThresholds = FaceToFaceThresholds & TypingThresholds & ExcelThresholds

type MetierThresholds = 
  | CallCenterThresholds
  | AgencesThresholds
  | BoReclamThresholds
  | TeleventeThresholds
  | ReseauxSociauxThresholds
  | SupervisionThresholds
  | BotCognitiveTrainerThresholds
  | SmcFixeMobileThresholds

interface MetierCriteria {
  requiredTests: string[]
  thresholds: MetierThresholds
}

// Configuration des critères par métier
const metierCriteria: Record<string, MetierCriteria> = {
  "Call Center": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16
    } as CallCenterThresholds
  },
  "Agences": {
    requiredTests: ["Face à Face", "Saisie", "Dictée", "Simulation Vente"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16,
      salesSimulation: 3
    } as AgencesThresholds
  },
  "Bo Réclam": {
    requiredTests: ["Saisie", "Excel", "Dictée", "Test Psychotechnique"],
    thresholds: {
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16,
      psychotechnicalTest: 8
    } as BoReclamThresholds
  },
  "Télévente": {
    requiredTests: ["Face à Face", "Saisie", "Dictée", "Simulation Vente"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16,
      salesSimulation: 3
    } as TeleventeThresholds
  },
  "Réseaux Sociaux": {
    requiredTests: ["Face à Face", "Saisie", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      dictation: 16
    } as ReseauxSociauxThresholds
  },
  "Supervision": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16
    } as SupervisionThresholds
  },
  "Bot Cognitive Trainer": {
    requiredTests: ["Face à Face", "Excel", "Dictée", "Exercice Analyse"],
    thresholds: {
      faceToFace: 3,
      excel: 3,
      dictation: 16,
      analysisExercise: 6
    } as BotCognitiveTrainerThresholds
  },
  "SMC Fixe & Mobile": {
    requiredTests: ["Face à Face", "Saisie", "Excel", "Dictée"],
    thresholds: {
      faceToFace: 3,
      typingSpeed: 17,
      typingAccuracy: 85,
      excel: 3,
      dictation: 16
    } as SmcFixeMobileThresholds
  }
}

export async function RecentCandidates({ filters }: RecentCandidatesProps) {
  // Requête simple sans filtres
  const query = sql`
    SELECT 
      c.*, 
      s.final_decision,
      s.comments,
      s.presentation_visuelle,
      s.voice_quality,
      s.verbal_communication,
      s.psychotechnical_test,
      s.typing_speed,
      s.typing_accuracy,
      s.excel_test,
      s.dictation,
      s.sales_simulation,
      s.analysis_exercise,
      s.phase2_date,
      s.phase1_decision,
      s.phase2_ff_decision,
      s.call_status,
      s.call_attempts,
      s.last_call_date,
      s.call_notes,
      COALESCE(ffs.score, 0) as face_to_face_score
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN (
      SELECT candidate_id, AVG(score) as score 
      FROM face_to_face_scores 
      GROUP BY candidate_id
    ) ffs ON c.id = ffs.candidate_id
    LIMIT 10
  `

  const candidates = await query

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Fonction pour formater les nombres avec 2 décimales
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    return Number(value).toFixed(2)
  }

  // ✅ Fonction pour normaliser une note sur /20
  const normalizeScore = (value: number, max: number): number => {
    return (value / max) * 20
  }

  // Fonction pour vérifier si un test est requis pour le métier
  const isTestRequired = (metier: string, testName: string) => {
    const criteria = metierCriteria[metier]
    return criteria?.requiredTests.includes(testName) || false
  }

  // Fonction pour vérifier si le candidat a réussi un test avec vérification de type sécurisée
  const isTestPassed = (candidate: any, testName: string) => {
    const criteria = metierCriteria[candidate.metier]
    if (!criteria) return null

    const thresholds = criteria.thresholds

    switch (testName) {
      case "Face à Face":
        return 'faceToFace' in thresholds ? candidate.face_to_face_score >= thresholds.faceToFace : null
      case "Saisie":
        return ('typingSpeed' in thresholds && 'typingAccuracy' in thresholds) 
          ? candidate.typing_speed >= thresholds.typingSpeed && 
            candidate.typing_accuracy >= thresholds.typingAccuracy
          : null
      case "Excel":
        return 'excel' in thresholds ? candidate.excel_test >= thresholds.excel : null
      case "Dictée":
        return candidate.dictation >= thresholds.dictation
      case "Simulation Vente":
        return 'salesSimulation' in thresholds ? candidate.sales_simulation >= thresholds.salesSimulation : null
      case "Test Psychotechnique":
        return 'psychotechnicalTest' in thresholds ? candidate.psychotechnical_test >= thresholds.psychotechnicalTest : null
      case "Exercice Analyse":
        return 'analysisExercise' in thresholds ? candidate.analysis_exercise >= thresholds.analysisExercise : null
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
        return 'faceToFace' in thresholds ? `≥ ${thresholds.faceToFace}/5` : ""
      case "Saisie":
        return ('typingSpeed' in thresholds && 'typingAccuracy' in thresholds) 
          ? `≥ ${thresholds.typingSpeed} MPM + ${thresholds.typingAccuracy}%` 
          : ""
      case "Excel":
        return 'excel' in thresholds ? `≥ ${thresholds.excel}/5` : ""
      case "Dictée":
        return `≥ ${thresholds.dictation}/20`
      case "Simulation Vente":
        return 'salesSimulation' in thresholds ? `≥ ${thresholds.salesSimulation}/5` : ""
      case "Test Psychotechnique":
        return 'psychotechnicalTest' in thresholds ? `≥ ${thresholds.psychotechnicalTest}/10` : ""
      case "Exercice Analyse":
        return 'analysisExercise' in thresholds ? `≥ ${thresholds.analysisExercise}/10` : ""
      default:
        return ""
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
      {/* En-tête élégant */}
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
          candidates.map((candidate: any) => {
            const criteria = metierCriteria[candidate.metier]
            
            // ✅ CORRECTION: Définition des scores avec leurs échelles
            const phase1Scores = [
              { name: "Présentation Visuelle", value: candidate.presentation_visuelle, max: 5 },
              { name: 'Qualité Vocale', value: candidate.voice_quality, max: 5 },
              { name: 'Communication Verbale', value: candidate.verbal_communication, max: 5 },
              { name: 'Test Psychotechnique', value: candidate.psychotechnical_test, max: 10 }
            ]
            
            const phase2Scores = [
              { name: 'Vitesse Saisie', value: candidate.typing_speed, max: null, unit: ' MPM', skipInAverage: true },
              { name: 'Précision Saisie', value: candidate.typing_accuracy, max: 100, unit: '%' },
              { name: 'Excel', value: candidate.excel_test, max: 5 },
              { name: 'Dictée', value: candidate.dictation, max: 20 },
              { name: 'Simulation Vente', value: candidate.sales_simulation, max: 5 },
              { name: 'Exercice Analyse', value: candidate.analysis_exercise, max: 10 }
            ]

            // ✅ CORRECTION: Calcul des moyennes avec normalisation sur /20
            const phase1NormalizedScores = phase1Scores
              .filter(score => 
                score.value !== null && 
                score.value !== undefined && 
                !isNaN(Number(score.value))
              )
              .map(score => normalizeScore(Number(score.value), score.max))

            const phase1Average = phase1NormalizedScores.length > 0
              ? phase1NormalizedScores.reduce((a, b) => a + b, 0) / phase1NormalizedScores.length
              : null

            const phase2NormalizedScores = phase2Scores
              .filter(score => 
                !score.skipInAverage && 
                score.value !== null && 
                score.value !== undefined && 
                !isNaN(Number(score.value)) &&
                score.max !== null
              )
              .map(score => normalizeScore(Number(score.value), score.max!))

            const phase2Average = phase2NormalizedScores.length > 0
              ? phase2NormalizedScores.reduce((a, b) => a + b, 0) / phase2NormalizedScores.length
              : null
            
            return (
              <div key={candidate.id} className="bg-white rounded-2xl p-6 space-y-6 border-2 border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-orange-200 group">
                {/* En-tête avec nom et statut */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {candidate.full_name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl group-hover:text-orange-700 transition-colors">
                          {candidate.full_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {candidate.final_decision && (
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                                candidate.final_decision === "RECRUTE" 
                                  ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200" 
                                  : "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {candidate.final_decision}
                            </span>
                          )}
                          {candidate.call_status === 'RESISTANT' && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200 shadow-sm">
                              Résistant
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
                        {candidate.metier}
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {candidate.email}
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {candidate.age} ans
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {candidate.call_status === 'RESISTANT' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 cursor-pointer font-medium rounded-lg px-4"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Rappeler
                      </Button>
                    )}
                    <Link href={`/wfm/scores/${candidate.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 cursor-pointer font-medium rounded-lg px-4"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier les notes
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
                        Modifier infos
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Scores détaillés */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Phase 1 */}
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border-2 border-blue-100 shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>Phase 1 - Évaluation Initiale</span>
                      {phase1Average !== null && (
                        <span className="ml-auto text-xl font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                          {phase1Average.toFixed(2)}/20
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3">
                      {phase1Scores.map((score, index) => (
                        score.value !== null && score.value !== undefined && !isNaN(Number(score.value)) && (
                          <div key={index} className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded-lg border border-blue-50">
                            <span className="text-blue-700 font-medium">{score.name}:</span>
                            <span className="font-bold text-blue-800">
                              {Number(score.value).toFixed(2)}
                              {score.max && `/${score.max}`}
                            </span>
                          </div>
                        )
                      ))}
                      {phase1NormalizedScores.length === 0 && (
                        <div className="text-center py-4 text-blue-400">
                          Aucune note disponible
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span>Phase 2 - Tests Techniques</span>
                      {phase2Average !== null && (
                        <span className="ml-auto text-xl font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">
                          {phase2Average.toFixed(2)}/20
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3">
                      {phase2Scores.map((score, index) => (
                        score.value !== null && score.value !== undefined && !isNaN(Number(score.value)) && (
                          <div key={index} className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded-lg border border-purple-50">
                            <span className="text-purple-700 font-medium">{score.name}:</span>
                            <span className="font-bold text-purple-800">
                              {Number(score.value).toFixed(2)}
                              {score.unit ? score.unit : score.max ? `/${score.max}` : ''}
                            </span>
                          </div>
                        )
                      ))}
                      {phase2NormalizedScores.length === 0 && (
                        <div className="text-center py-4 text-purple-400">
                          Aucune note disponible
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statut d'appel pour les candidats résistants */}
                {candidate.call_status === 'RESISTANT' && (
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 border-2 border-orange-200 shadow-sm">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Statut d'Appel - Candidat Résistant
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white px-4 py-3 rounded-lg border border-orange-100">
                        <span className="text-orange-600 font-medium">Tentatives:</span>
                        <span className="ml-2 font-bold text-orange-700">{candidate.call_attempts || 0}</span>
                      </div>
                      <div className="bg-white px-4 py-3 rounded-lg border border-orange-100">
                        <span className="text-orange-600 font-medium">Dernier appel:</span>
                        <span className="ml-2 font-bold text-orange-700">{formatDate(candidate.last_call_date)}</span>
                      </div>
                      <div className="bg-white px-4 py-3 rounded-lg border border-orange-100">
                        <span className="text-orange-600 font-medium">Statut:</span>
                        <span className="ml-2 font-bold text-orange-700">À rappeler</span>
                      </div>
                    </div>
                    {candidate.call_notes && (
                      <div className="mt-4 p-4 bg-orange-100 rounded-xl border border-orange-200">
                        <span className="font-semibold text-orange-700">Notes d'appel:</span>
                        <p className="text-orange-800 mt-1">{candidate.call_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Critères du métier */}
                {criteria && (
                  <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 border-2 border-orange-100 shadow-sm">
                    <h4 className="font-semibold text-orange-800 mb-5 flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      Critères {candidate.metier}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {criteria.requiredTests.map((testName) => {
                        const status = getTestStatus(candidate, testName)
                        const threshold = getTestThreshold(candidate.metier, testName)
                        
                        return (
                          <div 
                            key={testName}
                            className={`text-center p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                              status.passed 
                                ? 'bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm' 
                                : status.passed === false 
                                  ? 'bg-gradient-to-br from-red-50 to-white border-red-200 shadow-sm'
                                  : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
                            }`}
                          >
                            <div className="font-semibold text-sm mb-2 text-orange-900">{testName}</div>
                            <div className="text-2xl font-bold mb-2">
                              {status.passed !== null ? (
                                <span className={status.passed ? 'text-green-500' : 'text-red-500'}>
                                  {status.passed ? '✓' : '✗'}
                                </span>
                              ) : (
                                <span className="text-orange-400">?</span>
                              )}
                            </div>
                            <div className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-lg">
                              {threshold}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Commentaires */}
                {candidate.comments && (
                  <div className={`rounded-2xl p-5 border-2 ${
                    candidate.final_decision === "NON_RECRUTE" 
                      ? "bg-gradient-to-br from-red-50 to-white border-red-200" 
                      : "bg-gradient-to-br from-blue-50 to-white border-blue-200"
                  }`}>
                    <h4 className="font-semibold mb-3 flex items-center gap-3">
                      {candidate.final_decision === "NON_RECRUTE" ? (
                        <>
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-red-700">Raison du non-recrutement</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-blue-700">Commentaires</span>
                        </>
                      )}
                    </h4>
                    <p className="text-sm leading-relaxed bg-white px-4 py-3 rounded-xl border">{candidate.comments}</p>
                  </div>
                )}

                {/* Disponibilité */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-gradient-to-r from-orange-50 to-white rounded-2xl border-2 border-orange-200 shadow-sm">
                  {candidate.interview_date && (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-green-200 shadow-sm">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-green-700">
                        Entretien: {formatDate(candidate.interview_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}