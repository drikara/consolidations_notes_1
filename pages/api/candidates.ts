import { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '../../lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      try {
        const candidates = await sql`
          SELECT * FROM candidates ORDER BY created_at DESC
        `
        res.status(200).json({ candidates })
      } catch (error: any) {
        res.status(500).json({ error: error.message })
      }
      break

    case 'POST':
      try {
        const {
          full_name,
          phone,
          birth_date,
          age,
          diploma,
          institution,
          email,
          location,
          availability,
          metier
        } = req.body

        const [newCandidate] = await sql`
          INSERT INTO candidates 
            (full_name, phone, birth_date, age, diploma, institution, email, location, availability, metier)
          VALUES 
            (${full_name}, ${phone}, ${birth_date}, ${age}, ${diploma}, ${institution}, ${email}, ${location}, ${availability}, ${metier})
          RETURNING *
        `

        res.status(201).json({ candidate: newCandidate })
      } catch (error: any) {
        res.status(500).json({ error: error.message })
      }
      break

    default:
      res.status(405).json({ error: 'Méthode non autorisée' })
  }
}