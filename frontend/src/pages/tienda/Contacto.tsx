import { useEffect, useState } from 'react'
import { sucursalesService } from '@/services'

export default function Contacto() {
	const [sedes, setSedes] = useState<any[]>([])

	useEffect(() => {
		sucursalesService.listar().then((s) => setSedes(s)).catch(() => setSedes([]))
	}, [])

	return (
		<div className="section-shell py-10">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold">Contacto</h1>
				<p className="mt-4 text-gray-700">¿Tienes preguntas o necesitas ayuda con un pedido? Contáctanos por teléfono, email o visita una de nuestras sedes.</p>

				<div className="mt-6 space-y-4">
					{sedes.map((s) => (
						<div key={s.id} className="surface p-4">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-semibold">{s.nombre}</div>
									<div className="text-sm text-gray-600">{s.direccion}</div>
								</div>
								<div className="text-sm text-gray-700">{s.telefono ?? '—'}</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-8">
					<h2 className="font-semibold">Soporte</h2>
					<p className="text-sm text-gray-700 mt-2">Email: <a className="text-teal-700" href="mailto:soporte@farmacy.co">soporte@farmacy.co</a></p>
					<p className="text-sm text-gray-700 mt-1">Teléfono general: <strong className="text-teal-700">+57 311 000 0000</strong></p>
				</div>
			</div>
		</div>
	)
}
