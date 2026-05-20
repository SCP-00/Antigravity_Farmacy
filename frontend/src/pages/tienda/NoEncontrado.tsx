import { Link } from 'react-router-dom'

export default function NoEncontrado() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-2">Página no encontrada</p>
      <p className="text-gray-400 mb-8">La página que buscas no existe o fue movida.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">Ir al inicio</Link>
        <Link to="/productos" className="btn-outline">Ver productos</Link>
      </div>
    </div>
  )
}