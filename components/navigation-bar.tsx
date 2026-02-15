'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, List, User } from 'lucide-react'
import Link from 'next/link'

interface NavigationBarProps {
  previousCandidateId: number | null
  nextCandidateId: number | null
  currentPosition: number | null
  totalCandidates: number | null
}

export function NavigationBar({
  previousCandidateId,
  nextCandidateId,
  currentPosition,
  totalCandidates
}: NavigationBarProps) {
  const router = useRouter()

  return (
    <div className="bg-gradient-to-r from-orange-500 to-cyan-500 rounded-2xl p-1 shadow-xl">
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          
          {/* Progression */}
          <div className="flex items-center gap-4">
            <Link href="/jury/evaluations">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-all duration-200 shadow-sm rounded-xl"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Liste</span>
              </Button>
            </Link>
            
            {currentPosition && totalCandidates && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Évaluation</p>
                    <p className="font-bold text-gray-800">
                      {currentPosition} / {totalCandidates}
                    </p>
                  </div>
                </div>
                
                {/* Barre de progression animée */}
                <div className="hidden md:block w-48 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentPosition / totalCandidates) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (previousCandidateId) {
                  router.push(`/jury/evaluations/${previousCandidateId}`)
                }
              }}
              disabled={!previousCandidateId}
              variant="outline"
              className="flex items-center gap-2 border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>

            <Button
              onClick={() => {
                if (nextCandidateId) {
                  router.push(`/jury/evaluations/${nextCandidateId}`)
                }
              }}
              disabled={!nextCandidateId}
              variant="outline"
              className="flex items-center gap-2 border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm rounded-xl"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}