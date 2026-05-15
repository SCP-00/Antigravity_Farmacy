import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock3, Landmark, ReceiptText, WalletCards } from 'lucide-react'
import { cajaService } from '@/services'
import { useFormateo } from '@/hooks'

type CajaHistorialItem = {
	id: string
	abiertaEn: string
	cerradaEn?: string | null
	montoApertura?: number | string | null
	montoCierre?: number | string | null
	totalVentas?: number | string | null
	diferencia?: number | string | null
	observaciones?: string | null
	empleado?: { nombre: string; apellido: string }
	sucursal?: { nombre: string }
	_count?: { ventas?: number }
}

export default function HistorialCaja() {
	const { cop, fechaCorta } = useFormateo()

	const { data, isLoading, isError } = useQuery({
		queryKey: ['caja', 'historial'],
		queryFn: cajaService.historial,
		staleTime: 1000 * 60 * 2,
	})

	const cajas = useMemo(() => (data ?? []) as CajaHistorialItem[], [data])
	const totalCajas = cajas.length
	const totalVentas = cajas.reduce((acc, caja) => acc + Number(caja.totalVentas ?? 0), 0)
	const totalDiferencia = cajas.reduce((acc, caja) => acc + Number(caja.diferencia ?? 0), 0)

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-700 text-white p-6 md:p-8 shadow-lg overflow-hidden relative">
				<div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_white,_transparent_30%)]" />
				<div className="relative max-w-4xl">
					<span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
						Caja
					</span>
					<h1 className="mt-4 text-3xl md:text-5xl font-serif leading-tight">
						Historial de caja
					</h1>
					<p className="mt-3 max-w-2xl text-sm md:text-base text-white/80">
						Consulta aperturas, cierres y cuadre por usuario y sede desde la base de datos real.
					</p>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<div className="surface p-5">
					<div className="flex items-center gap-3 text-teal-700">
						<Landmark className="w-5 h-5" />
						<span className="text-sm font-semibold">Cajas registradas</span>
					</div>
					<p className="mt-3 text-3xl font-bold text-slate-900">{totalCajas}</p>
				</div>
				<div className="surface p-5">
					<div className="flex items-center gap-3 text-teal-700">
						<ReceiptText className="w-5 h-5" />
						<span className="text-sm font-semibold">Ventas en historial</span>
					</div>
					<p className="mt-3 text-3xl font-bold text-slate-900">{cop(totalVentas)}</p>
				</div>
				<div className="surface p-5">
					<div className="flex items-center gap-3 text-teal-700">
						<WalletCards className="w-5 h-5" />
						<span className="text-sm font-semibold">Diferencia acumulada</span>
					</div>
					<p className="mt-3 text-3xl font-bold text-slate-900">{cop(totalDiferencia)}</p>
				</div>
			</section>

			<section className="surface overflow-hidden">
				<div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">Movimientos de caja</h2>
						<p className="text-sm text-slate-500">Ordenado por apertura más reciente</p>
					</div>
					<Clock3 className="w-5 h-5 text-teal-700" />
				</div>

				{isLoading ? (
					<div className="p-6 text-sm text-slate-500">Cargando historial...</div>
				) : isError ? (
					<div className="p-6 text-sm text-red-600">No fue posible cargar el historial de caja.</div>
				) : cajas.length === 0 ? (
					<div className="p-6 text-sm text-slate-500">Aún no hay registros de caja.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200 text-sm">
							<thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.18em]">
								<tr>
									<th className="px-5 py-3 text-left">Fecha</th>
									<th className="px-5 py-3 text-left">Empleado / Sede</th>
									<th className="px-5 py-3 text-left">Apertura</th>
									<th className="px-5 py-3 text-left">Cierre</th>
									<th className="px-5 py-3 text-left">Ventas</th>
									<th className="px-5 py-3 text-left">Diferencia</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{cajas.map((caja) => (
									<tr key={caja.id} className="hover:bg-slate-50/70">
										<td className="px-5 py-4 text-slate-700">{fechaCorta(caja.abiertaEn)}</td>
										<td className="px-5 py-4 text-slate-700">
											<div className="font-medium text-slate-900">
												{caja.empleado ? `${caja.empleado.nombre} ${caja.empleado.apellido}` : 'Sin empleado'}
											</div>
											<div className="text-xs text-slate-500">{caja.sucursal?.nombre ?? 'Sin sede'}</div>
										</td>
										<td className="px-5 py-4 text-slate-700">{cop(Number(caja.montoApertura ?? 0))}</td>
										<td className="px-5 py-4 text-slate-700">
											{caja.cerradaEn ? fechaCorta(caja.cerradaEn) : 'Abierta'}
										</td>
										<td className="px-5 py-4 text-slate-700">{cop(Number(caja.totalVentas ?? 0))}</td>
										<td className={`px-5 py-4 font-semibold ${Number(caja.diferencia ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
											{cop(Number(caja.diferencia ?? 0))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	)
}
