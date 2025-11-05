// components/stats-cards.tsx
type StatsCardsProps = {
  stats: {
    total: number
    admis: number
    elimine: number
    enCours: number
    callCenter: number
    agences: number
    boReclam: number
    televente: number
    reseauxSociaux: number
    supervision: number
    botCognitiveTrainer: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Candidats",
      value: stats.total,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      bgColor: "bg-gradient-to-r from-orange-50 to-amber-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
      textColor: "text-orange-600"
    },
    {
      title: "Recrutés",
      value: stats.admis,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-gradient-to-r from-emerald-50 to-green-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-600"
    },
    {
      title: "Non Recrutés",
      value: stats.elimine,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-gradient-to-r from-red-50 to-pink-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      textColor: "text-red-600"
    },
    {
      title: "En Cours",
      value: stats.enCours,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      textColor: "text-amber-600"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`${card.bgColor} rounded-2xl p-6 border-2 ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{card.title}</p>
              <p className={`text-3xl font-bold ${card.textColor} mt-2`}>{card.value}</p>
            </div>
            <div className={`${card.iconColor} p-3 rounded-xl bg-white border-2 ${card.borderColor} shadow-sm`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}