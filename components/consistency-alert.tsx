"use client"

interface Inconsistency {
  criterion: string
  wfmScore: number
  juryAverage: number
  difference: string
}

interface ConsistencyAlertProps {
  inconsistencies: Inconsistency[]
  onUseJuryAverage: (criterion: string, average: number) => void
}

export function ConsistencyAlert({ inconsistencies, onUseJuryAverage }: ConsistencyAlertProps) {
  if (inconsistencies.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-amber-800 text-lg">Incohérences détectées</h3>
          <p className="text-amber-600 text-sm">
            Différences significatives entre vos notes et les moyennes du jury
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {inconsistencies.map((inc, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200">
            <div className="flex-1">
              <div className="font-semibold text-amber-800">{inc.criterion}</div>
              <div className="text-sm text-amber-600">
                Votre note: <span className="font-bold">{inc.wfmScore}/5</span> • 
                Moyenne jury: <span className="font-bold">{inc.juryAverage}/5</span> • 
                Différence: <span className="font-bold text-amber-700">{inc.difference}</span>
              </div>
            </div>
            <button
              onClick={() => onUseJuryAverage(inc.criterion.toLowerCase().replace(' ', '_'), inc.juryAverage)}
              className="text-xs border border-amber-300 text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors"
            >
              Utiliser moyenne jury
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-700">
          <strong>Conseil :</strong> Vérifiez si ces différences sont intentionnelles. 
          Les incohérences seront enregistrées dans les commentaires.
        </p>
      </div>
    </div>
  )
}