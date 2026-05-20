export default function ConfirmacionPago() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago confirmado!</h1>
      <p className="text-gray-500 mb-6">Tu pedido ha sido registrado. Recibirás un correo de confirmación.</p>
      <a href="/cuenta/pedidos" className="btn-primary inline-flex">Ver mis pedidos</a>
    </div>
  )
}