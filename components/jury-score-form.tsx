"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface JuryScoreFormProps {
  candidate: {
    id: number
    fullName: string
    metier: string
  }
  juryMember: {
    id: number
    fullName: string
    roleType: string
  }
  phase1Complete: boolean
  canDoPhase2: boolean
}

/* ===========================
   Composant de saisie décimale
   =========================== */
function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (score: number) => void
  label: string
}) {
  const presets = [0, 1, 2, 3, 4, 5]

  const handleChange = (val: number) => {
    if (isNaN(val)) return
    if (val < 0 || val > 5) return
    onChange(Math.round(val * 10) / 10) // 1 décimale max
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-800">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Boutons rapides avec design amélioré */}
      <div className="flex gap-2">
        {presets.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => handleChange(score)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-sm ${
              value === score
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-300'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Champ décimal avec meilleur style */}
      <input
        type="number"
        min={0}
        max={5}
        step={0.1}
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => handleChange(Number(e.target.value))}
        placeholder="Ex : 3.5"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 font-medium"
      />

      {value !== null && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4 py-3 border border-blue-200">
          <p className="text-sm text-center text-gray-700">
            Note sélectionnée : <span className="font-bold text-blue-700 text-lg">{value.toFixed(1)} / 5</span>
          </p>
        </div>
      )}
    </div>
  )
}

/* ===========================
   Composant Commentaires
   =========================== */
function CommentsInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (comments: string) => void
  label: string
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Commentaires, observations..."
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-32 text-gray-800"
      />
    </div>
  )
}

export function JuryScoreForm({
  candidate,
  juryMember,
  phase1Complete,
  canDoPhase2,
}: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activePhase, setActivePhase] = useState<1 | 2>(1)

  /* ===========================
     Détermination du type de fiche
     =========================== */
  const isAgenceOrTelevente = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'
  
  const needsSimulation = isAgenceOrTelevente

  /* ===========================
     États pour les sous-critères
     =========================== */
  
  // États pour AGENCES/TELEVENTE
  const [agenceScores, setAgenceScores] = useState({
    // Présentation Visuelle
    tenue_vestimentaire: null as number | null,
    tenue_corporelle: null as number | null,
    
    // Communication Verbale
    expression_claire: null as number | null,
    assurance_voix: null as number | null,
    aimable_disponible: null as number | null,
    
    // Qualité de la Voix
    ecoute_active: null as number | null,
    pose_questions: null as number | null,
    presente_idees: null as number | null,
    communique_jury: null as number | null,
  })

  // États pour CALL_CENTER
  const [callCenterScores, setCallCenterScores] = useState({
    // Communication Verbale
    expression_claire: null as number | null,
    assurance_voix: null as number | null,
    aimable_disponible: null as number | null,
   
    
    // Qualité de la Voix
    ecoute_active: null as number | null,
    pose_questions: null as number | null,
    presente_idees: null as number | null,
    communique_jury: null as number | null,
   
  })

  // États communs
  const [comments, setComments] = useState('')

  // États Phase  Simulation (AGENCES/TELEVENTE seulement)
  const [phase2Scores, setPhase2Scores] = useState({
    // Sens de la Négociation
    ecoute_active_sim: null as number | null,
    susciter_desir: null as number | null,
    conclure_vente: null as number | null,
    
    // Capacité de Persuasion
    connaissance_produit: null as number | null,
    lead_confiance: null as number | null,
    impact_decision: null as number | null,
    
    // Sens de la Combativité
    attitude_positive: null as number | null,
    resilience_objections: null as number | null,
    attitude_cooperative: null as number | null,
    
    comments: '',
  })

  /* ===========================
     Calcul des moyennes selon Excel
     =========================== */
  const calculatePhase1Averages = () => {
    if (isAgenceOrTelevente) {
      // Moyennes selon fiche AGENCES/TELEVENTE
      const presentationVisuelle = agenceScores.tenue_vestimentaire !== null && 
        agenceScores.tenue_corporelle !== null
        ? (agenceScores.tenue_vestimentaire + agenceScores.tenue_corporelle) / 2
        : null

      const verbalCommunication = agenceScores.expression_claire !== null && 
        agenceScores.assurance_voix !== null && 
        agenceScores.aimable_disponible !== null
        ? (agenceScores.expression_claire + agenceScores.assurance_voix + agenceScores.aimable_disponible) / 3
        : null

      const voiceQuality = agenceScores.ecoute_active !== null && 
        agenceScores.pose_questions !== null && 
        agenceScores.presente_idees !== null && 
        agenceScores.communique_jury !== null
        ? (agenceScores.ecoute_active + agenceScores.pose_questions + 
           agenceScores.presente_idees + agenceScores.communique_jury) / 4
        : null

      return { presentationVisuelle, verbalCommunication, voiceQuality }
    } else {
      // Moyennes selon fiche CALL_CENTER
      const verbalCommunication = callCenterScores.expression_claire !== null && 
        callCenterScores.assurance_voix !== null && 
        callCenterScores.aimable_disponible !== null
        ? (callCenterScores.expression_claire + callCenterScores.assurance_voix + 
           callCenterScores.aimable_disponible) / 3
        : null

      const voiceQuality = callCenterScores.ecoute_active !== null && 
        callCenterScores.pose_questions !== null && 
        callCenterScores.presente_idees !== null && 
        callCenterScores.communique_jury !== null
        ? (callCenterScores.ecoute_active + callCenterScores.pose_questions + 
           callCenterScores.presente_idees + callCenterScores.communique_jury) / 4
        : null

      return { verbalCommunication, voiceQuality }
    }
  }

  const calculatePhase2Averages = () => {
    // Calculs selon fiche Simulation
    const simulationSensNegociation = phase2Scores.ecoute_active_sim !== null && 
      phase2Scores.susciter_desir !== null && 
      phase2Scores.conclure_vente !== null
      ? (phase2Scores.ecoute_active_sim + phase2Scores.susciter_desir + phase2Scores.conclure_vente) / 3
      : null

    const simulationCapacitePersuasion = phase2Scores.connaissance_produit !== null && 
      phase2Scores.lead_confiance !== null && 
      phase2Scores.impact_decision !== null
      ? (phase2Scores.connaissance_produit + phase2Scores.lead_confiance + phase2Scores.impact_decision) / 3
      : null

    const simulationSensCombativite = phase2Scores.attitude_positive !== null && 
      phase2Scores.resilience_objections !== null && 
      phase2Scores.attitude_cooperative !== null
      ? (phase2Scores.attitude_positive + phase2Scores.resilience_objections + phase2Scores.attitude_cooperative) / 3
      : null

    return { simulationSensNegociation, simulationCapacitePersuasion, simulationSensCombativite }
  }

  /* ===========================
     Validation selon les règles Excel
     =========================== */
  const validatePhase1 = () => {
    const averages = calculatePhase1Averages()
    
    if (isAgenceOrTelevente) {
      // Règle AGENCES/TELEVENTE
      if (!averages.presentationVisuelle || !averages.verbalCommunication || !averages.voiceQuality) {
        return false
      }
      
      // Si une moyenne < 3 → "Faible"
      if (averages.presentationVisuelle < 3 || averages.verbalCommunication < 3 || averages.voiceQuality < 3) {
        return 'Faible'
      }
      
      // Sinon détermination selon Excel
      if (averages.presentationVisuelle < 4 || averages.verbalCommunication < 4 || averages.voiceQuality < 4) {
        return 'Assez Bien'
      } else if (averages.presentationVisuelle < 5 || averages.verbalCommunication < 5 || averages.voiceQuality < 5) {
        return 'Bien'
      } else {
        return 'Très Bien'
      }
    } else {
      // Règle CALL_CENTER
      if (!averages.verbalCommunication || !averages.voiceQuality) {
        return false
      }
      
      if (averages.verbalCommunication < 3 || averages.voiceQuality < 3) {
        return 'Faible'
      }
      
      if (averages.verbalCommunication < 4 || averages.voiceQuality < 4) {
        return 'Assez Bien'
      } else if (averages.verbalCommunication < 5 || averages.voiceQuality < 5) {
        return 'Bien'
      } else {
        return 'Très Bien'
      }
    }
  }

  const validatePhase2 = () => {
    const averages = calculatePhase2Averages()
    
    if (!averages.simulationSensNegociation || !averages.simulationCapacitePersuasion || !averages.simulationSensCombativite) {
      return false
    }
    
    const moyenneGlobale = (averages.simulationSensNegociation + averages.simulationCapacitePersuasion + averages.simulationSensCombativite) / 3
    
    if (moyenneGlobale < 3) return 'FAIBLE'
    if (moyenneGlobale === 3) return 'ASSEZ BIEN'
    if (moyenneGlobale < 4) return 'BIEN'
    return 'TRES BIEN'
  }

  /* ===========================
     Vérification complétude
     =========================== */
  const isPhase1Complete = () => {
    if (isAgenceOrTelevente) {
      // Pour AGENCES/TELEVENTE, vérifier tous les sous-critères
      return Object.values(agenceScores).every(value => value !== null)
    } else {
      // Pour CALL_CENTER, vérifier tous les sous-critères
      return Object.values(callCenterScores).every(value => value !== null)
    }
  }

  const isPhase2Complete = () => {
    return Object.values(phase2Scores).every(
      (val, idx) => idx === Object.values(phase2Scores).length - 1 ? true : val !== null
    )
  }

  /* ===========================
     Submit Phase 1
     =========================== */
  const handleSubmitPhase1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPhase1Complete()) return alert('Veuillez remplir toutes les notes')

    setLoading(true)

    const validationResult = validatePhase1()
    if (!validationResult) {
      alert('Erreur de validation des notes')
      setLoading(false)
      return
    }

    const decision = validationResult === 'Faible' ? 'DEFAVORABLE' : 'FAVORABLE'

    // Calculer les moyennes
    const averages = calculatePhase1Averages()

    // Calculer le score moyen pour la phase face à face
    const phase1Score = isAgenceOrTelevente
      ? (averages.presentationVisuelle! + averages.verbalCommunication! + averages.voiceQuality!) / 3
      : (averages.verbalCommunication! + averages.voiceQuality!) / 2

    // Payload conforme à la table FaceToFaceScore
    const payload: any = {
      candidate_id: candidate.id,
      jury_member_id: juryMember.id,
      phase: 1,
      decision: decision,
      comments: comments || null,
    }

    // Ajouter les moyennes selon le métier
    if (isAgenceOrTelevente) {
      payload.presentation_visuelle = averages.presentationVisuelle
      payload.verbal_communication = averages.verbalCommunication
      payload.voice_quality = averages.voiceQuality
      payload.score = phase1Score
    } else {
      payload.verbal_communication = averages.verbalCommunication
      payload.voice_quality = averages.voiceQuality
      payload.score = phase1Score
      // presentation_visuelle n'est pas requis pour CALL_CENTER, sera null par défaut
    }

    const res = await fetch('/api/jury/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) return alert('Erreur lors de la sauvegarde')

    alert(`Phase Face à Face enregistrée (${decision})`)
    router.refresh()

    if (needsSimulation && decision === 'FAVORABLE') {
      setActivePhase(2)
    }
  }

  /* ===========================
     Submit Phase simulation
     =========================== */
  const handleSubmitPhase2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canDoPhase2) return alert('Simulation non débloquée')
    if (!isPhase2Complete()) return alert('Veuillez remplir toutes les notes')

    setLoading(true)

    const validationResult = validatePhase2()
    if (!validationResult) {
      alert('Erreur de validation des notes')
      setLoading(false)
      return
    }

    const decision = validationResult === 'FAIBLE' ? 'DEFAVORABLE' : 'FAVORABLE'

    const averages = calculatePhase2Averages()
    
    // Calculer le score moyen pour la phase 2
    const phase2Score = (averages.simulationSensNegociation! + averages.simulationCapacitePersuasion! + averages.simulationSensCombativite!) / 3

    // Payload conforme à la table FaceToFaceScore
    const payload = {
      candidate_id: candidate.id,
      jury_member_id: juryMember.id,
      phase: 2,
      decision: decision,
      comments: phase2Scores.comments || null,
      score: phase2Score,
      // Moyennes pour la phase 2
      simulation_sens_negociation: averages.simulationSensNegociation,
      simulation_capacite_persuasion: averages.simulationCapacitePersuasion,
      simulation_sens_combativite: averages.simulationSensCombativite,
    }

    const res = await fetch('/api/jury/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) return alert('Erreur lors de la sauvegarde')

    alert(`Phase Simulation enregistrée (${decision})`)
    router.push('/jury/evaluations')
  }

  /* ===========================
     Affichage des moyennes calculées
     =========================== */
  const renderCalculatedAverages = () => {
    const averages = calculatePhase1Averages()
    
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
        <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
         
          Moyennes calculées
        </h4>
        
        {isAgenceOrTelevente ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Présentation Visuelle</p>
              <p className="text-3xl font-bold text-blue-900">
                {averages.presentationVisuelle?.toFixed(2) || 'N/A'}
                <span className="text-lg text-gray-500"> / 5</span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Communication Verbale</p>
              <p className="text-3xl font-bold text-blue-900">
                {averages.verbalCommunication?.toFixed(2) || 'N/A'}
                <span className="text-lg text-gray-500"> / 5</span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Qualité de la Voix</p>
              <p className="text-3xl font-bold text-blue-900">
                {averages.voiceQuality?.toFixed(2) || 'N/A'}
                <span className="text-lg text-gray-500"> / 5</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Communication Verbale</p>
              <p className="text-3xl font-bold text-blue-900">
                {averages.verbalCommunication?.toFixed(2) || 'N/A'}
                <span className="text-lg text-gray-500"> / 5</span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Qualité de la Voix</p>
              <p className="text-3xl font-bold text-blue-900">
                {averages.voiceQuality?.toFixed(2) || 'N/A'}
                <span className="text-lg text-gray-500"> / 5</span>
              </p>
            </div>
          </div>
        )}
        
        {isPhase1Complete() && (
          <div className="mt-4 pt-4 border-t-2 border-blue-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Niveau prévisionnel
                </p>
                <p className="text-xl font-bold text-blue-900">{validatePhase1() || 'Non calculé'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Décision
                </p>
                <p className={`text-xl font-bold ${validatePhase1() === 'Faible' ? 'text-red-600' : 'text-green-600'}`}>
                  {validatePhase1() === 'Faible' ? 'DÉFAVORABLE' : 'FAVORABLE'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ===========================
     RENDER - Phase face  pour AGENCES/TELEVENTE
     =========================== */
  const renderPhase1Agence = () => {
    return (
      <form onSubmit={handleSubmitPhase1} className="space-y-8">
        {/* Section Présentation Visuelle */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">Présentation Visuelle</h3>
              <p className="text-sm text-gray-600 mt-1">Moyenne calculée à partir des 2 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreInput
              label="Tenue Vestimentaire : Propreté - Élégance"
              value={agenceScores.tenue_vestimentaire}
              onChange={(v) => setAgenceScores(p => ({ ...p, tenue_vestimentaire: v }))}
            />
            <ScoreInput
              label="Tenue corporelle : Gestuelle - Aisance"
              value={agenceScores.tenue_corporelle}
              onChange={(v) => setAgenceScores(p => ({ ...p, tenue_corporelle: v }))}
            />
          </div>
        </div>

        {/* Section Communication Verbale */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">Communication Verbale (Expression Orale)</h3>
              <p className="text-sm text-gray-600 mt-1">Moyenne calculée à partir des 3 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreInput
              label="S'exprime de façon claire et avec aisance"
              value={agenceScores.expression_claire}
              onChange={(v) => setAgenceScores(p => ({ ...p, expression_claire: v }))}
            />
            <ScoreInput
              label="Assurance dans la voix, agréable à écouter, débit normal"
              value={agenceScores.assurance_voix}
              onChange={(v) => setAgenceScores(p => ({ ...p, assurance_voix: v }))}
            />
            <ScoreInput
              label="Se montre aimable, disponible"
              value={agenceScores.aimable_disponible}
              onChange={(v) => setAgenceScores(p => ({ ...p, aimable_disponible: v }))}
            />
          </div>
        </div>

        {/* Section Qualité de la Voix */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
          
            <div>
              <h3 className="text-xl font-bold text-gray-900">Qualité de la Voix</h3>
              <p className="text-sm text-gray-600 mt-1">Moyenne calculée à partir des 4 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreInput
              label="Écoute attentivement sans interrompre pour comprendre le besoin du client"
              value={agenceScores.ecoute_active}
              onChange={(v) => setAgenceScores(p => ({ ...p, ecoute_active: v }))}
            />
            <ScoreInput
              label="Pose des questions pour mieux comprendre le besoin du client"
              value={agenceScores.pose_questions}
              onChange={(v) => setAgenceScores(p => ({ ...p, pose_questions: v }))}
            />
            <ScoreInput
              label="Présente les idées et l'information avec assurance"
              value={agenceScores.presente_idees}
              onChange={(v) => setAgenceScores(p => ({ ...p, presente_idees: v }))}
            />
            <ScoreInput
              label="Communique efficacement avec les membres du jury"
              value={agenceScores.communique_jury}
              onChange={(v) => setAgenceScores(p => ({ ...p, communique_jury: v }))}
            />
          </div>
        </div>

        {/* Affichage des moyennes calculées */}
        {renderCalculatedAverages()}

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <CommentsInput
            label="Commentaires (Raisons justifiant les scores)"
            value={comments}
            onChange={setComments}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isPhase1Complete()}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enregistrement...
            </span>
          ) : (
            '✓ Sauvegarder Phase Face à Face'
          )}
        </button>
      </form>
    )
  }

  /* ===========================
     RENDER - Phase face à face pour CALL_CENTER
     =========================== */
  const renderPhase1CallCenter = () => {
    return (
      <form onSubmit={handleSubmitPhase1} className="space-y-8">
        {/* Section Communication Verbale */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">Communication Verbale (Expression Orale)</h3>
              <p className="text-sm text-gray-600 mt-1">Moyenne calculée à partir des 3 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreInput
              label="S'exprime de façon claire et avec aisance"
              value={callCenterScores.expression_claire}
              onChange={(v) => setCallCenterScores(p => ({ ...p, expression_claire: v }))}
            />
            <ScoreInput
              label="Assurance dans la voix, agréable à écouter, débit normal"
              value={callCenterScores.assurance_voix}
              onChange={(v) => setCallCenterScores(p => ({ ...p, assurance_voix: v }))}
            />
            <ScoreInput
              label="Se montre aimable, disponible"
              value={callCenterScores.aimable_disponible}
              onChange={(v) => setCallCenterScores(p => ({ ...p, aimable_disponible: v }))}
            />
          </div>
        </div>

        {/* Section Qualité de la Voix */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">Qualité de la Voix</h3>
              <p className="text-sm text-gray-600 mt-1">Moyenne calculée à partir des 4 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreInput
              label="Écoute attentivement sans interrompre pour comprendre le besoin du client"
              value={callCenterScores.ecoute_active}
              onChange={(v) => setCallCenterScores(p => ({ ...p, ecoute_active: v }))}
            />
            <ScoreInput
              label="Pose des questions pour mieux comprendre le besoin du client"
              value={callCenterScores.pose_questions}
              onChange={(v) => setCallCenterScores(p => ({ ...p, pose_questions: v }))}
            />
            <ScoreInput
              label="Présente les idées et l'information avec assurance"
              value={callCenterScores.presente_idees}
              onChange={(v) => setCallCenterScores(p => ({ ...p, presente_idees: v }))}
            />
            <ScoreInput
              label="Communique efficacement avec les membres du jury"
              value={callCenterScores.communique_jury}
              onChange={(v) => setCallCenterScores(p => ({ ...p, communique_jury: v }))}
            />
          </div>
        </div>

        {/* Affichage des moyennes calculées */}
        {renderCalculatedAverages()}

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <CommentsInput
            label="Commentaires (Raisons justifiant les scores)"
            value={comments}
            onChange={setComments}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isPhase1Complete()}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enregistrement...
            </span>
          ) : (
            '✓ Sauvegarder Phase Face à Face'
          )}
        </button>
      </form>
    )
  }

  /* ===========================
     RENDER - Phase  Simulation
     =========================== */
  const renderPhase2 = () => {
    if (!needsSimulation) return null

    const averages = calculatePhase2Averages()

    return (
      <form onSubmit={handleSubmitPhase2} className="space-y-8">
        {/* Section Sens de la Négociation */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-emerald-900">Sens de la Négociation</h3>
              <p className="text-sm text-emerald-700 mt-1">Moyenne calculée à partir des 3 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreInput
              label="Pratiquer l'écoute Active"
              value={phase2Scores.ecoute_active_sim}
              onChange={(v) => setPhase2Scores(p => ({ ...p, ecoute_active_sim: v }))}
            />
            <ScoreInput
              label="Susciter le désir d'Achat"
              value={phase2Scores.susciter_desir}
              onChange={(v) => setPhase2Scores(p => ({ ...p, susciter_desir: v }))}
            />
            <ScoreInput
              label="Conclure l'opportunité de Vente"
              value={phase2Scores.conclure_vente}
              onChange={(v) => setPhase2Scores(p => ({ ...p, conclure_vente: v }))}
            />
          </div>
          {averages.simulationSensNegociation !== null && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-800 text-center">
                Moyenne Sens de la Négociation : <span className="text-xl font-bold text-emerald-900">{averages.simulationSensNegociation.toFixed(1)} / 5</span>
              </p>
            </div>
          )}
        </div>

        {/* Section Capacité de Persuasion */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center gap-3 mb-6">
            
            <div>
              <h3 className="text-xl font-bold text-emerald-900">Capacité de Persuasion</h3>
              <p className="text-sm text-emerald-700 mt-1">Moyenne calculée à partir des 3 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreInput
              label="Connaissance démontrée du produit ou service"
              value={phase2Scores.connaissance_produit}
              onChange={(v) => setPhase2Scores(p => ({ ...p, connaissance_produit: v }))}
            />
            <ScoreInput
              label="Avoir le lead et imposer la confiance par son professionnalisme"
              value={phase2Scores.lead_confiance}
              onChange={(v) => setPhase2Scores(p => ({ ...p, lead_confiance: v }))}
            />
            <ScoreInput
              label="Avoir un impact fort sur la décision du client"
              value={phase2Scores.impact_decision}
              onChange={(v) => setPhase2Scores(p => ({ ...p, impact_decision: v }))}
            />
          </div>
          {averages.simulationCapacitePersuasion !== null && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-800 text-center">
                Moyenne Capacité de Persuasion : <span className="text-xl font-bold text-emerald-900">{averages.simulationCapacitePersuasion.toFixed(1)} / 5</span>
              </p>
            </div>
          )}
        </div>

        {/* Section Sens de la Combativité */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center gap-3 mb-6">
           
            <div>
              <h3 className="text-xl font-bold text-emerald-900">Sens de la Combativité</h3>
              <p className="text-sm text-emerald-700 mt-1">Moyenne calculée à partir des 3 sous-critères</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreInput
              label="Adopter une attitude positive à l'égard du client"
              value={phase2Scores.attitude_positive}
              onChange={(v) => setPhase2Scores(p => ({ ...p, attitude_positive: v }))}
            />
            <ScoreInput
              label="Avoir une attitude de résilience pour surmonter les objections du client"
              value={phase2Scores.resilience_objections}
              onChange={(v) => setPhase2Scores(p => ({ ...p, resilience_objections: v }))}
            />
            <ScoreInput
              label="Adopter une attitude coopérative concentrée sur l'essentiel pour réussir sa vente"
              value={phase2Scores.attitude_cooperative}
              onChange={(v) => setPhase2Scores(p => ({ ...p, attitude_cooperative: v }))}
            />
          </div>
          {averages.simulationSensCombativite !== null && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-800 text-center">
                Moyenne Sens de la Combativité : <span className="text-xl font-bold text-emerald-900">{averages.simulationSensCombativite.toFixed(1)} / 5</span>
              </p>
            </div>
          )}
        </div>

        {/* Affichage des moyennes calculées pour la phase 2 */}
        {isPhase2Complete() && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg">
            <h4 className="font-bold text-emerald-900 mb-4 text-lg flex items-center gap-2">
            
              Moyennes Phase Simulation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1 font-medium uppercase tracking-wide">Sens de la Négociation</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {averages.simulationSensNegociation?.toFixed(2) || 'N/A'}
                  <span className="text-lg text-gray-500"> / 5</span>
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1 font-medium uppercase tracking-wide">Capacité de Persuasion</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {averages.simulationCapacitePersuasion?.toFixed(2) || 'N/A'}
                  <span className="text-lg text-gray-500"> / 5</span>
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1 font-medium uppercase tracking-wide">Sens de la Combativité</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {averages.simulationSensCombativite?.toFixed(2) || 'N/A'}
                  <span className="text-lg text-gray-500"> / 5</span>
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-emerald-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Niveau prévisionnel
                  </p>
                  <p className="text-xl font-bold text-emerald-900">{validatePhase2() || 'Non calculé'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Décision
                  </p>
                  <p className={`text-xl font-bold ${validatePhase2() === 'FAIBLE' ? 'text-red-600' : 'text-green-600'}`}>
                    {validatePhase2() === 'FAIBLE' ? 'DÉFAVORABLE' : 'FAVORABLE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <CommentsInput
            label="Commentaires (Raisons justifiant les scores)"
            value={phase2Scores.comments}
            onChange={(v) => setPhase2Scores(p => ({ ...p, comments: v }))}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isPhase2Complete()}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enregistrement...
            </span>
          ) : (
            '✓ Sauvegarder Phase Simulation'
          )}
        </button>
      </form>
    )
  }

  /* ===========================
     RENDER Principal
     =========================== */
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Indicateur de phase avec design amélioré */}
      <div className="flex border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-white">
        <button
          onClick={() => setActivePhase(1)}
          className={`flex-1 py-4 font-bold text-center transition-all duration-300 ${
            activePhase === 1 
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-inner' 
              : 'bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            
            <span>Phase  Face à Face</span>
          </div>
        </button>
        {needsSimulation && (
          <button
            onClick={() => setActivePhase(2)}
            disabled={!canDoPhase2}
            className={`flex-1 py-4 font-bold text-center transition-all duration-300 ${
              activePhase === 2 
                ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-inner' 
                : 'bg-white hover:bg-gray-50 text-gray-700'
            } ${!canDoPhase2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              
              <span>Phase  Simulation</span>
            </div>
          </button>
        )}
      </div>

    

      {/* Avertissement si tentative Phase 2 sans déblocage */}
      {activePhase === 2 && !canDoPhase2 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-6 rounded-xl shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-bold text-yellow-900 text-lg mb-2">Phase Simulation non disponible</p>
              <p className="text-yellow-800">
                {!phase1Complete 
                  ? "Veuillez d'abord compléter la Phase Face à Face avec une décision favorable"
                  : "La simulation sera débloquée lorsque les moyennes des juges seront validées"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage de la phase active */}
      {activePhase === 1 && (
        isAgenceOrTelevente ? renderPhase1Agence() : renderPhase1CallCenter()
      )}
      {activePhase === 2 && canDoPhase2 && renderPhase2()}
    </div>
  )
}