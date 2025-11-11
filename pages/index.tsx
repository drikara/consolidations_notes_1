import type { NextPage } from 'next'
import DBTest from '../components/DBTest'

const Home: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mon Application Next.js + Neon</h1>
      <DBTest />
    </div>
  )
}

export default Home