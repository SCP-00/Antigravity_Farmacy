import { useQuery, useMutation } from '@tanstack/react-query'
import { clientesService } from '@/services'
import toast from 'react-hot-toast'

export default function MisPedidos() {
	const { data: pedidos = [], isLoading } = useQuery({ queryKey: ['cliente','pedidos'], queryFn: clientesService.misPedidos })
	const mutation = useMutation({
		mutationFn: ({ id, motivo }: any) => clientesService.solicitarDevolucion(id, motivo),
		onSuccess: () => {
			toast.success('Solicitud de devolución enviada')
		},
		onError: () => toast.error('Error al solicitar devolución'),
	})

	if (isLoading) return <div className="p-6">Cargando pedidos...</div>

	return (
		<div className="section-shell py-6">
			<h1 className="text-2xl font-bold mb-4">Mis pedidos</h1>
			<div className="space-y-4">
				{pedidos.map((p: any) => (
					<div key={p.id} className="surface p-4">
						<div className="flex items-center justify-between">
							<div>
								<div className="font-semibold">Pedido #{p.numero} · {new Date(p.creadoEn).toLocaleString()}</div>
								<div className="text-sm text-gray-600">Total: {p.total}</div>
							</div>
							<div className="flex items-center gap-2">
								<button className="btn-secondary" onClick={() => mutation.mutate({ id: p.id, motivo: 'Solicito devolución' })}>Solicitar devolución</button>
								<a className="text-sm text-teal-700" href={`/pago/confirmacion?ventaId=${p.id}`}>Ver detalle</a>
							</div>
						</div>
						<div className="mt-3 text-sm">
							<strong>Productos:</strong>
							<ul className="list-disc ml-5">
								{p.detalles?.map((d: any) => (
									<li key={d.id}>{d.producto?.nombre} × {d.cantidad}</li>
								))}
							</ul>
						</div>
					</div>
				))}
				{!pedidos.length && (
					<div className="p-6 text-gray-500">No has realizado compras aún.</div>
				)}
			</div>
		</div>
	)
}
