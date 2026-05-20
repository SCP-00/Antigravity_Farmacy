import React from 'react'

export default function InvoicePreview({ venta }: any) {
  // venta: { numero, fecha, cliente, items: [{nombre, cantidad, precio}], subtotal, descuento, iva, total }
  const v = venta ?? {
    numero: '0001', fecha: new Date().toLocaleString(), cliente: { nombre: 'Consumidor final' },
    items: [ { nombre: 'Acetaminofén 500mg', cantidad: 1, precio: 6800 } ], subtotal: 6800, descuento: 0, iva: 0, total: 6800
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Farmacy</h2>
          <p className="text-sm text-gray-500">Sede principal</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Factura</p>
          <p className="font-mono font-bold">F-{String(v.numero).padStart(4, '0')}</p>
          <p className="text-xs text-gray-400">{v.fecha}</p>
        </div>
      </header>

      <section className="mb-4">
        <p className="text-sm">Cliente: <strong>{v.cliente?.nombre}</strong></p>
        <p className="text-sm text-gray-500">Documento: {v.cliente?.documento ?? 'N/A'}</p>
      </section>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th>Producto</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Precio</th>
          </tr>
        </thead>
        <tbody>
          {v.items.map((it: any, idx: number) => (
            <tr key={idx} className="border-t">
              <td className="py-2">{it.nombre}</td>
              <td className="py-2 text-right">{it.cantidad}</td>
              <td className="py-2 text-right">${it.precio.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>${(v.subtotal).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Descuento</span><span>-${(v.descuento).toLocaleString()}</span></div>
        <div className="flex justify-between"><span>IVA</span><span>${(v.iva).toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>${(v.total).toLocaleString()}</span></div>
      </div>

      <footer className="mt-6 text-xs text-gray-500">
        <p>Factura digital disponible en PDF y enviada por correo electrónico.</p>
        <p>Para impresora térmica, use el modo "Imprimir" del navegador.</p>
      </footer>
    </div>
  )
}
