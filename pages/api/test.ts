import { NextApiRequest, NextApiResponse } from 'next'
import { testConnection } from '../../lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const result = await testConnection()
      
      if (result.success) {
        res.status(200).json({ 
          message: 'Connexion à Neon réussie! 🎉',
          time: result.time
        })
      } else {
        res.status(500).json({ 
          error: 'Erreur de connexion à la base de données',
          details: result.error 
        })
      }
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: error.message 
      })
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' })
  }
}