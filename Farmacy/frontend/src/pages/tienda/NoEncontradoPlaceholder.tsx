import { Link } from 'react-router-dom'

export function NoEncontrado() {
  return (
    <div className="bg-white min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NoEncontrado
