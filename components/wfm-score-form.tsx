"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Metier, Disponibilite, FFDecision, Decision, FinalDecision, Statut } from "@prisma/client"
import { calculateAutoDecisions, shouldShowTest, getMetierConfig } from "../lib/metier-utils"
import { 
  validateFaceToFace, 
  validateSimulation, 
  validatePsycho,
  validateAllMetierConditions,
  determineFinalDecision 
} from "../lib/validation-helpers"

type WFMScoreFormProps = {
  candidate: any
  score: any
  faceToFaceScores: any[]
}

export function WFMScoreForm({ candidate, score, faceToFaceScores }: WFMScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoCalculated, setAutoCalculated] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [juryAverages, setJuryAverages] = useState({
    presentation_visuelle: 0,
    verbal_communication: 0,
    voice_quality: 0
  })

  const [formData, setFormData] = useState({
    presentation_visuelle: score?.presentation_visuelle?.toString() || "",
    voice_quality: score?.voice_quality?.toString() || "",
    verbal_communication: score?.verbal_communication?.toString() || "",
    phase1_ff_decision: score?.phase1_ff_decision || "",
    
    // Test Psychotechnique - Sous-critères
    psycho_raisonnement_logique: score?.psycho_raisonnement_logique?.toString() || "",
    psycho_attention_concentration: score?.psycho_attention_concentration?.toString() || "",
    psychotechnical_test: score?.psychotechnical_test?.toString() || "",
    
    phase1_decision: score?.phase1_decision || "",
    typing_speed: score?.typing_speed?.toString() || "",
    typing_accuracy: score?.typing_accuracy?.toString() || "",
    excel_test: score?.excel_test?.toString() || "",
    dictation: score?.dictation?.toString() || "",
    
    // Simulation Vente - Sous-critères
    simulation_sens_negociation: score?.simulation_sens_negociation?.toString() || "",
    simulation_capacite_persuasion: score?.simulation_capacite_persuasion?.toString() || "",
    simulation_sens_combativite: score?.simulation_sens_combativite?.toString() || "",
    sales_simulation: score?.sales_simulation?.toString() || "",
    
    analysis_exercise: score?.analysis_exercise?.toString() || "",
    phase2_date: score?.phase2_date || "",
    decision_test: score?.decision_test || "",
    final_decision: score?.final_decision || "",
    statut: score?.statut || "",
    statutCommentaire: score?.statutCommentaire || "",
    comments: score?.comments || "",
  })

  const candidateAvailability = candidate?.availability || 'OUI'

  // Calcul des moyennes des jurys
  useEffect(() => {
    const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
    
    if (phase1FF.length > 0) {
      const presAvg = phase1FF.reduce((sum, s) => sum + (Number(s.presentation_visuelle) || 0), 0) / phase1FF.length
      const verbalAvg = phase1FF.reduce((sum, s) => sum + (Number(s.verbal_communication) || 0), 0) / phase1FF.length
      const voiceAvg = phase1FF.reduce((sum, s) => sum + (Number(s.voice_quality) || 0), 0) / phase1FF.length

      setJuryAverages({
        presentation_visuelle: presAvg,
        verbal_communication: verbalAvg,
        voice_quality: voiceAvg
      })

      // Pré-remplir avec les moyennes si pas déjà saisi
      if (!formData.presentation_visuelle && presAvg > 0) {
        setFormData(prev => ({ ...prev, presentation_visuelle: presAvg.toFixed(2) }))
      }
      if (!formData.verbal_communication && verbalAvg > 0) {
        setFormData(prev => ({ ...prev, verbal_communication: verbalAvg.toFixed(2) }))
      }
      if (!formData.voice_quality && voiceAvg > 0) {
        setFormData(prev => ({ ...prev, voice_quality: voiceAvg.toFixed(2) }))
      }
    }
  }, [faceToFaceScores])

  // Fonction pour valider toutes les conditions selon les règles du cahier des charges
  const validateAllConditions = () => {
    const errors: string[] = []
    
    // Règle 1: Si disponibilité = NON → NON_RECRUTE automatique
    if (candidateAvailability === 'NON') {
      setFormData(prev => ({
        ...prev,
        final_decision: 'NON_RECRUTE',
        phase1_ff_decision: 'DEFAVORABLE',
        phase1_decision: 'ELIMINE',
        decision_test: 'DEFAVORABLE'
      }))
      errors.push('Candidat non disponible - Automatiquement non recruté')
      setValidationErrors(errors)
      setAutoCalculated(true)
      return false
    }

    // Règle 2: Validation Face à Face selon métier
    const voiceQuality = parseFloat(formData.voice_quality) || 0
    const verbalCommunication = parseFloat(formData.verbal_communication) || 0
    const presentationVisuelle = parseFloat(formData.presentation_visuelle) || 0

    // Pour AGENCES : 3 critères
    if (candidate.metier === 'AGENCES') {
      if (voiceQuality < 3 || verbalCommunication < 3 || presentationVisuelle < 3) {
        errors.push(`Face à Face: Pour AGENCES, tous les critères doivent être ≥ 3/5`)
        errors.push(`- Qualité voix: ${voiceQuality}/5 (minimum: 3/5)`)
        errors.push(`- Communication verbale: ${verbalCommunication}/5 (minimum: 3/5)`)
        errors.push(`- Présentation visuelle: ${presentationVisuelle}/5 (minimum: 3/5)`)
        
        setFormData(prev => ({
          ...prev,
          phase1_ff_decision: 'DEFAVORABLE',
          phase1_decision: 'ELIMINE',
          decision_test: 'DEFAVORABLE',
          final_decision: 'NON_RECRUTE'
        }))
        setValidationErrors(errors)
        setAutoCalculated(true)
        return false
      }
    } 
    // Pour tous les autres métiers : 2 critères
    else {
      if (voiceQuality < 3 || verbalCommunication < 3) {
        errors.push(`Face à Face: Qualité voix et communication verbale doivent être ≥ 3/5`)
        errors.push(`- Qualité voix: ${voiceQuality}/5 (minimum: 3/5)`)
        errors.push(`- Communication verbale: ${verbalCommunication}/5 (minimum: 3/5)`)
        
        setFormData(prev => ({
          ...prev,
          phase1_ff_decision: 'DEFAVORABLE',
          phase1_decision: 'ELIMINE',
          decision_test: 'DEFAVORABLE',
          final_decision: 'NON_RECRUTE'
        }))
        setValidationErrors(errors)
        setAutoCalculated(true)
        return false
      }
    }

    // Si Face à Face validé
    setFormData(prev => ({
      ...prev,
      phase1_ff_decision: 'FAVORABLE',
      phase1_decision: 'ADMIS'
    }))

    // Règle 3: Validation Simulation pour AGENCES et TELEVENTE
    if (candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE') {
      const sensNegociation = parseFloat(formData.simulation_sens_negociation) || 0
      const capacitePersuasion = parseFloat(formData.simulation_capacite_persuasion) || 0
      const sensCombativite = parseFloat(formData.simulation_sens_combativite) || 0
      
      if (sensNegociation < 3 || capacitePersuasion < 3 || sensCombativite < 3) {
        errors.push(`Simulation: Tous les critères doivent être ≥ 3/5`)
        errors.push(`- Sens négociation: ${sensNegociation}/5 (minimum: 3/5)`)
        errors.push(`- Capacité persuasion: ${capacitePersuasion}/5 (minimum: 3/5)`)
        errors.push(`- Sens combativité: ${sensCombativite}/5 (minimum: 3/5)`)
        
        setFormData(prev => ({
          ...prev,
          decision_test: 'DEFAVORABLE',
          final_decision: 'NON_RECRUTE'
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          decision_test: 'FAVORABLE',
          final_decision: 'RECRUTE'
        }))
      }
    }

    // Règle 4: Validation Test Psycho pour BO_RECLAM
    if (candidate.metier === 'BO_RECLAM') {
      const raisonnementLogique = parseFloat(formData.psycho_raisonnement_logique) || 0
      const attentionConcentration = parseFloat(formData.psycho_attention_concentration) || 0
      
      if (raisonnementLogique < 3 || attentionConcentration < 3) {
        errors.push(`Test Psychotechnique: Tous les critères doivent être ≥ 3/5`)
        errors.push(`- Raisonnement logique: ${raisonnementLogique}/5 (minimum: 3/5)`)
        errors.push(`- Attention & concentration: ${attentionConcentration}/5 (minimum: 3/5)`)
        
        setFormData(prev => ({
          ...prev,
          decision_test: 'DEFAVORABLE',
          final_decision: 'NON_RECRUTE'
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          decision_test: 'FAVORABLE',
          final_decision: 'RECRUTE'
        }))
      }
    }

    // Règle 5: Validation autres tests techniques selon la configuration métier
    const config = getMetierConfig(candidate.metier as Metier)
    
    // Validation saisie
    if (config.requiredTests.typing) {
      const typingSpeed = parseFloat(formData.typing_speed) || 0
      const typingAccuracy = parseFloat(formData.typing_accuracy) || 0
      
      if (typingSpeed < (config.criteria.minTypingSpeed || 0) || typingAccuracy < (config.criteria.minTypingAccuracy || 0)) {
        errors.push(`Saisie: Rapidité ≥ ${config.criteria.minTypingSpeed} MPM et Précision ≥ ${config.criteria.minTypingAccuracy}%`)
        errors.push(`- Rapidité: ${typingSpeed} MPM (minimum: ${config.criteria.minTypingSpeed} MPM)`)
        errors.push(`- Précision: ${typingAccuracy}% (minimum: ${config.criteria.minTypingAccuracy}%)`)
        
        if (formData.decision_test === 'FAVORABLE') {
          setFormData(prev => ({
            ...prev,
            decision_test: 'DEFAVORABLE',
            final_decision: 'NON_RECRUTE'
          }))
        }
      }
    }

    // Validation Excel
    if (config.requiredTests.excel) {
      const excelScore = parseFloat(formData.excel_test) || 0
      if (excelScore < (config.criteria.minExcel || 0)) {
        errors.push(`Excel: Score minimum ${config.criteria.minExcel}/5`)
        errors.push(`- Score: ${excelScore}/5 (minimum: ${config.criteria.minExcel}/5)`)
        
        if (formData.decision_test === 'FAVORABLE') {
          setFormData(prev => ({
            ...prev,
            decision_test: 'DEFAVORABLE',
            final_decision: 'NON_RECRUTE'
          }))
        }
      }
    }

    // Validation Dictée
    if (config.requiredTests.dictation) {
      const dictationScore = parseFloat(formData.dictation) || 0
      if (dictationScore < (config.criteria.minDictation || 0)) {
        errors.push(`Dictée: Score minimum ${config.criteria.minDictation}/20`)
        errors.push(`- Score: ${dictationScore}/20 (minimum: ${config.criteria.minDictation}/20)`)
        
        if (formData.decision_test === 'FAVORABLE') {
          setFormData(prev => ({
            ...prev,
            decision_test: 'DEFAVORABLE',
            final_decision: 'NON_RECRUTE'
          }))
        }
      }
    }

    // Validation Analyse
    if (config.requiredTests.analysisExercise) {
      const analysisScore = parseFloat(formData.analysis_exercise) || 0
      if (analysisScore < (config.criteria.minAnalysis || 0)) {
        errors.push(`Analyse: Score minimum ${config.criteria.minAnalysis}/10`)
        errors.push(`- Score: ${analysisScore}/10 (minimum: ${config.criteria.minAnalysis}/10)`)
        
        if (formData.decision_test === 'FAVORABLE') {
          setFormData(prev => ({
            ...prev,
            decision_test: 'DEFAVORABLE',
            final_decision: 'NON_RECRUTE'
          }))
        }
      }
    }

    setValidationErrors(errors)
    setAutoCalculated(true)
    
    return errors.length === 0
  }

  // Calcul automatique des décisions
  useEffect(() => {
    const hasPhase1Scores = formData.presentation_visuelle || formData.verbal_communication || formData.voice_quality
    const hasPhase2Scores = formData.typing_speed || formData.excel_test || formData.dictation || 
                           formData.sales_simulation || formData.analysis_exercise ||
                           formData.simulation_sens_negociation || formData.psycho_raisonnement_logique

    if (hasPhase1Scores || hasPhase2Scores) {
      validateAllConditions()
    }
  }, [
    formData.presentation_visuelle,
    formData.verbal_communication, 
    formData.voice_quality,
    formData.typing_speed,
    formData.typing_accuracy,
    formData.excel_test,
    formData.dictation,
    formData.sales_simulation,
    formData.analysis_exercise,
    formData.simulation_sens_negociation,
    formData.simulation_capacite_persuasion,
    formData.simulation_sens_combativite,
    formData.psycho_raisonnement_logique,
    formData.psycho_attention_concentration,
    candidateAvailability
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation finale avant envoi
    const isValid = validateAllConditions()
    
    if (!isValid && validationErrors.length > 0) {
      setError("Des erreurs de validation empêchent l'enregistrement. Veuillez corriger les scores.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/scores/${candidate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.refresh()
      alert("Notes enregistrées avec succès")
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    setTimeout(() => {
      validateAllConditions()
    }, 100)
  }

  const useJuryAverage = (field: string) => {
    const value = juryAverages[field as keyof typeof juryAverages]
    if (value > 0) {
      handleChange(field, value.toFixed(2))
    }
  }

  // Calculate average Face to Face scores
  const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
  const avgPhase1 = phase1FF.length > 0 ? (phase1FF.reduce((sum, s) => sum + Number(s.score), 0) / phase1FF.length).toFixed(2) : "N/A"

  // Déterminer quels tests afficher selon le métier
  const showTypingTest = shouldShowTest(candidate.metier as Metier, 'typing')
  const showExcelTest = shouldShowTest(candidate.metier as Metier, 'excel')
  const showDictationTest = shouldShowTest(candidate.metier as Metier, 'dictation')
  const showSalesSimulationTest = shouldShowTest(candidate.metier as Metier, 'salesSimulation')
  const showPsychotechnicalTest = shouldShowTest(candidate.metier as Metier, 'psychotechnical')
  const showAnalysisExerciseTest = shouldShowTest(candidate.metier as Metier, 'analysisExercise')

  // Obtenir la configuration du métier pour afficher les seuils
  const config = getMetierConfig(candidate.metier as Metier)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Évaluation du Candidat
            </h1>
            <p className="text-orange-700">
              {candidate.nom} {candidate.prenom} - {candidate.metier}
            </p>
            <p className="text-sm text-orange-600 mt-1">
              Disponibilité: <span className={`font-semibold ${candidateAvailability === 'OUI' ? 'text-green-600' : 'text-red-600'}`}>
                {candidateAvailability === 'OUI' ? '✅ OUI' : '❌ NON'}
              </span>
            </p>
            {candidateAvailability === 'NON' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Le candidat sera automatiquement marqué comme non recruté
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages de validation */}
      {validationErrors.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b-2 border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Erreurs de validation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Face to Face Scores Summary */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Notes Face à Face (Saisies par les Jurys)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">1</span>
                  </div>
                  Phase 1
                </h4>
                {phase1FF.length === 0 ? (
                  <div className="text-center py-4">
                    <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-600 font-medium">Aucune note saisie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phase1FF.map((s) => (
                      <div key={s.id} className="flex justify-between items-start p-4 bg-white rounded-xl border border-blue-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{s.jury_name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{s.role_type}</span>
                          </div>
                          
                          {/* Afficher les scores détaillés */}
                          {(s.presentation_visuelle || s.verbal_communication || s.voice_quality) && (
                            <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Présentation</div>
                                <div className="text-blue-900 font-bold">
                                  {s.presentation_visuelle ? `${s.presentation_visuelle}/5` : 'N/A'}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Communication</div>
                                <div className="text-blue-900 font-bold">
                                  {s.verbal_communication ? `${s.verbal_communication}/5` : 'N/A'}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-700">Voix</div>
                                <div className="text-blue-900 font-bold">
                                  {s.voice_quality ? `${s.voice_quality}/5` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {s.comments && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              {s.comments}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-lg">{s.score}/5</span>
                          <p className="text-xs text-blue-600 mt-1">Moyenne</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-blue-200 flex justify-between font-bold">
                      <span className="text-blue-800">Moyenne Phase 1</span>
                      <span className="text-blue-600">{avgPhase1}/5</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 1 - Consolidation WFM */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Phase 1 - Consolidation WFM
            </CardTitle>
            <div className="flex flex-col gap-1">
              {autoCalculated && (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Décisions calculées automatiquement
                </p>
              )}
              <p className="text-sm text-blue-600">
                {candidate.metier === 'AGENCES' 
                  ? 'Pour AGENCES: Présentation visuelle ≥ 3/5, Qualité voix ≥ 3/5, Communication verbale ≥ 3/5'
                  : 'Pour tous les autres métiers: Qualité voix ≥ 3/5, Communication verbale ≥ 3/5'
                }
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Résumé automatique des notes jurys */}
            {phase1FF.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Résumé des Notes Jurys</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-blue-600">Présentation Visuelle</div>
                    <div className="text-xl font-bold text-blue-800">
                      {juryAverages.presentation_visuelle.toFixed(2)}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Communication Verbale</div>
                    <div className="text-xl font-bold text-blue-800">
                      {juryAverages.verbal_communication.toFixed(2)}/5
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Qualité Vocale</div>
                    <div className="text-xl font-bold text-blue-800">
                      {juryAverages.voice_quality.toFixed(2)}/5
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm text-blue-600">Moyenne Générale Phase 1</div>
                  <div className="text-2xl font-bold text-blue-800">{avgPhase1}/5</div>
                </div>
              </div>
            )}

            {/* Saisie WFM avec valeurs pré-remplies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Présentation Visuelle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="presentation_visuelle" className="text-gray-700 font-semibold">
                    Présentation Visuelle (/5)
                  </Label>
                  {phase1FF.length > 0 && (
                    <button
                      type="button"
                      onClick={() => useJuryAverage('presentation_visuelle')}
                      className="text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      Utiliser moyenne
                    </button>
                  )}
                </div>
                <Input
                  id="presentation_visuelle"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.presentation_visuelle}
                  onChange={(e) => handleChange("presentation_visuelle", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder={candidate.metier === 'AGENCES' ? "≥ 3/5" : "0-5"}
                />
                {phase1FF.length > 0 && (
                  <p className="text-xs text-blue-600">
                    Moyenne jury: {juryAverages.presentation_visuelle.toFixed(2)}/5
                  </p>
                )}
                {candidate.metier === 'AGENCES' && (
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5 pour AGENCES</p>
                )}
              </div>

              {/* Communication Verbale */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="verbal_communication" className="text-gray-700 font-semibold">
                    Communication Verbale (/5)
                  </Label>
                  {phase1FF.length > 0 && (
                    <button
                      type="button"
                      onClick={() => useJuryAverage('verbal_communication')}
                      className="text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      Utiliser moyenne
                    </button>
                  )}
                </div>
                <Input
                  id="verbal_communication"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.verbal_communication}
                  onChange={(e) => handleChange("verbal_communication", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="≥ 3/5"
                />
                {phase1FF.length > 0 && (
                  <p className="text-xs text-blue-600">
                    Moyenne jury: {juryAverages.verbal_communication.toFixed(2)}/5
                  </p>
                )}
                <p className="text-xs text-orange-600 font-medium">Minimum: 3/5 pour tous les métiers</p>
              </div>

              {/* Qualité de la Voix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice_quality" className="text-gray-700 font-semibold">
                    Qualité de la Voix (/5)
                  </Label>
                  {phase1FF.length > 0 && (
                    <button
                      type="button"
                      onClick={() => useJuryAverage('voice_quality')}
                      className="text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      Utiliser moyenne
                    </button>
                  )}
                </div>
                <Input
                  id="voice_quality"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.voice_quality}
                  onChange={(e) => handleChange("voice_quality", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="≥ 3/5"
                />
                {phase1FF.length > 0 && (
                  <p className="text-xs text-blue-600">
                    Moyenne jury: {juryAverages.voice_quality.toFixed(2)}/5
                  </p>
                )}
                <p className="text-xs text-orange-600 font-medium">Minimum: 3/5 pour tous les métiers</p>
              </div>
            </div>

            {/* Décisions Phase 1 - Auto-calculées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="phase1_ff_decision" className="text-gray-700 font-semibold">
                  Décision FF Phase 1 {autoCalculated && "✓"}
                </Label>
                <Select
                  value={formData.phase1_ff_decision}
                  onValueChange={(value) => handleChange("phase1_ff_decision", value)}
                >
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAVORABLE" className="rounded-lg">FAVORABLE</SelectItem>
                    <SelectItem value="DEFAVORABLE" className="rounded-lg">DEFAVORABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phase1_decision" className="text-gray-700 font-semibold">
                  Décision Phase 1 {autoCalculated && "✓"}
                </Label>
                <Select
                  value={formData.phase1_decision}
                  onValueChange={(value) => handleChange("phase1_decision", value)}
                >
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIS" className="rounded-lg">ADMIS</SelectItem>
                    <SelectItem value="ELIMINE" className="rounded-lg">ELIMINE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Psychotechnique - Conditionnel */}
        {showPsychotechnicalTest && (
          <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Test Psychotechnique - Sous-critères
              </CardTitle>
              <p className="text-sm text-indigo-600">
                Raisonnement logique ≥ 3/5 et Attention & concentration ≥ 3/5
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="psycho_raisonnement_logique" className="text-gray-700 font-semibold">
                    Raisonnement logique (/5)
                  </Label>
                  <Input
                    id="psycho_raisonnement_logique"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.psycho_raisonnement_logique}
                    onChange={(e) => handleChange("psycho_raisonnement_logique", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="≥ 3/5"
                  />
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="psycho_attention_concentration" className="text-gray-700 font-semibold">
                    Attention & concentration (/5)
                  </Label>
                  <Input
                    id="psycho_attention_concentration"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.psycho_attention_concentration}
                    onChange={(e) => handleChange("psycho_attention_concentration", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="≥ 3/5"
                  />
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5</p>
                </div>
              </div>

              {/* Score global (optionnel) */}
              <div className="space-y-3">
                <Label htmlFor="psychotechnical_test" className="text-gray-700 font-semibold">
                  Score global psychotechnique (/10) - Optionnel
                </Label>
                <Input
                  id="psychotechnical_test"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.psychotechnical_test}
                  onChange={(e) => handleChange("psychotechnical_test", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="0-10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 2 - Technical Tests */}
        {(showTypingTest || showExcelTest || showDictationTest || showSalesSimulationTest || showAnalysisExerciseTest) && (
          <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Phase 2 - Épreuves Techniques
              </CardTitle>
              <p className="text-sm text-purple-600">
                Tests requis pour {candidate.metier}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Saisie - Conditionnel */}
                {showTypingTest && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="typing_speed" className="text-gray-700 font-semibold">
                        Rapidité de Saisie (MPM)
                      </Label>
                      <Input
                        id="typing_speed"
                        type="number"
                        min="0"
                        value={formData.typing_speed}
                        onChange={(e) => handleChange("typing_speed", e.target.value)}
                        className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                        placeholder={`≥ ${config.criteria.minTypingSpeed || 17} MPM`}
                      />
                      <p className="text-xs text-orange-600 font-medium">
                        Minimum: {config.criteria.minTypingSpeed || 17} MPM
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="typing_accuracy" className="text-gray-700 font-semibold">
                        Précision de Saisie (%)
                      </Label>
                      <Input
                        id="typing_accuracy"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.typing_accuracy}
                        onChange={(e) => handleChange("typing_accuracy", e.target.value)}
                        className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                        placeholder={`≥ ${config.criteria.minTypingAccuracy || 85}%`}
                      />
                      <p className="text-xs text-orange-600 font-medium">
                        Minimum: {config.criteria.minTypingAccuracy || 85}%
                      </p>
                    </div>
                  </>
                )}

                {/* Excel - Conditionnel */}
                {showExcelTest && (
                  <div className="space-y-3">
                    <Label htmlFor="excel_test" className="text-gray-700 font-semibold">
                      Test Excel (/5)
                    </Label>
                    <Input
                      id="excel_test"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.excel_test}
                      onChange={(e) => handleChange("excel_test", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder={`≥ ${config.criteria.minExcel || 3}/5`}
                    />
                    <p className="text-xs text-orange-600 font-medium">
                      Minimum: {config.criteria.minExcel || 3}/5
                    </p>
                  </div>
                )}

                {/* Dictée - Conditionnel */}
                {showDictationTest && (
                  <div className="space-y-3">
                    <Label htmlFor="dictation" className="text-gray-700 font-semibold">
                      Dictée (/20)
                    </Label>
                    <Input
                      id="dictation"
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.dictation}
                      onChange={(e) => handleChange("dictation", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder={`≥ ${config.criteria.minDictation || 16}/20`}
                    />
                    <p className="text-xs text-orange-600 font-medium">
                      Minimum: {config.criteria.minDictation || 16}/20
                    </p>
                  </div>
                )}

                {/* Exercice Analyse - Conditionnel */}
                {showAnalysisExerciseTest && (
                  <div className="space-y-3">
                    <Label htmlFor="analysis_exercise" className="text-gray-700 font-semibold">
                      Exercice d'Analyse (/10)
                    </Label>
                    <Input
                      id="analysis_exercise"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.analysis_exercise}
                      onChange={(e) => handleChange("analysis_exercise", e.target.value)}
                      className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                      placeholder={`≥ ${config.criteria.minAnalysis || 6}/10`}
                    />
                    <p className="text-xs text-orange-600 font-medium">
                      Minimum: {config.criteria.minAnalysis || 6}/10
                    </p>
                  </div>
                )}

                {/* Champs communs Phase 2 */}
                <div className="space-y-3">
                  <Label htmlFor="phase2_date" className="text-gray-700 font-semibold">
                    Date Présence Phase 2
                  </Label>
                  <Input
                    id="phase2_date"
                    type="date"
                    value={formData.phase2_date}
                    onChange={(e) => handleChange("phase2_date", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="decision_test" className="text-gray-700 font-semibold">
                    Décision Test {autoCalculated && "✓"}
                  </Label>
                  <Select
                    value={formData.decision_test}
                    onValueChange={(value) => handleChange("decision_test", value)}
                  >
                    <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                      <SelectValue placeholder="Auto-calculé" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAVORABLE" className="rounded-lg">FAVORABLE</SelectItem>
                      <SelectItem value="DEFAVORABLE" className="rounded-lg">DEFAVORABLE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simulation Vente - Conditionnel */}
        {showSalesSimulationTest && (
          <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Simulation de Vente - Sous-critères
              </CardTitle>
              <p className="text-sm text-green-600">
                Sens négociation ≥ 3/5, Capacité persuasion ≥ 3/5, Sens combativité ≥ 3/5
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="simulation_sens_negociation" className="text-gray-700 font-semibold">
                    Sens de la négociation (/5)
                  </Label>
                  <Input
                    id="simulation_sens_negociation"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.simulation_sens_negociation}
                    onChange={(e) => handleChange("simulation_sens_negociation", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="≥ 3/5"
                  />
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="simulation_capacite_persuasion" className="text-gray-700 font-semibold">
                    Capacité de persuasion (/5)
                  </Label>
                  <Input
                    id="simulation_capacite_persuasion"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.simulation_capacite_persuasion}
                    onChange={(e) => handleChange("simulation_capacite_persuasion", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="≥ 3/5"
                  />
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="simulation_sens_combativite" className="text-gray-700 font-semibold">
                    Sens de la combativité (/5)
                  </Label>
                  <Input
                    id="simulation_sens_combativite"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.simulation_sens_combativite}
                    onChange={(e) => handleChange("simulation_sens_combativite", e.target.value)}
                    className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                    placeholder="≥ 3/5"
                  />
                  <p className="text-xs text-orange-600 font-medium">Minimum: 3/5</p>
                </div>
              </div>

              {/* Score global (optionnel) */}
              <div className="space-y-3">
                <Label htmlFor="sales_simulation" className="text-gray-700 font-semibold">
                  Score global simulation (/5) - Optionnel
                </Label>
                <Input
                  id="sales_simulation"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.sales_simulation}
                  onChange={(e) => handleChange("sales_simulation", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="0-5"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statut de présence */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Statut de Présence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="statut" className="text-gray-700 font-semibold">
                  Statut
                </Label>
                <Select value={formData.statut} onValueChange={(value) => handleChange("statut", value)}>
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT" className="rounded-lg">✅ PRÉSENT</SelectItem>
                    <SelectItem value="ABSENT" className="rounded-lg">❌ ABSENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="statutCommentaire" className="text-gray-700 font-semibold">
                  Commentaire Statut
                </Label>
                <Input
                  id="statutCommentaire"
                  type="text"
                  value={formData.statutCommentaire || ''}
                  onChange={(e) => handleChange("statutCommentaire", e.target.value)}
                  className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors"
                  placeholder="Justification du statut"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Decision */}
        <Card className="border-2 border-orange-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-200">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Décision Finale
            </CardTitle>
            {autoCalculated && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Décision finale calculée automatiquement
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="final_decision" className="text-gray-700 font-semibold">
                  Décision Finale {autoCalculated && "✓"}
                </Label>
                <Select value={formData.final_decision} onValueChange={(value) => handleChange("final_decision", value)}>
                  <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-orange-50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECRUTE" className="rounded-lg">RECRUTE</SelectItem>
                    <SelectItem value="NON_RECRUTE" className="rounded-lg">NON RECRUTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="comments" className="text-gray-700 font-semibold">
                Commentaires
              </Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
                rows={4}
                className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl p-3 bg-white transition-colors resize-none"
                placeholder="Commentaires supplémentaires..."
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border-2 border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl px-6 py-3 font-semibold transition-all duration-200"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl rounded-xl px-6 py-3 font-semibold transition-all duration-200 disabled:opacity-50" 
            disabled={loading || validationErrors.length > 0}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </div>
            ) : (
              "Enregistrer les Notes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}