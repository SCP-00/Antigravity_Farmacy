import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClienteService } from '@/services'
import toast from 'react-hot-toast'

export default function MiCuenta() {
	const qc = useQueryClient()
	const { data: cliente, isLoading } = useQuery({ queryKey: ['cliente','me'], queryFn: authClienteService.me })
	const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', ciudad: '' })

	const mutation = useMutation({
		mutationFn: (payload: any) => authClienteService.actualizarMe(payload),
		onSuccess: (data) => {
			toast.success('Perfil actualizado')
			qc.invalidateQueries({ queryKey: ['cliente','me'] })
		},
		onError: () => toast.error('Error actualizando perfil'),
	})

	if (isLoading) return <div className="p-6">Cargando perfil...</div>

	const handleSubmit = (e: any) => {
		e.preventDefault()
		mutation.mutate(form)
	}

	return (
		<div className="section-shell py-6">
			<h1 className="text-2xl font-bold mb-4">Mi cuenta</h1>
			<div className="grid md:grid-cols-2 gap-6">
				<div className="surface p-6">
					<h2 className="font-semibold">Perfil</h2>
					<p className="text-sm text-gray-600 mt-2">Datos básicos y contacto</p>
					<form onSubmit={handleSubmit} className="mt-4 space-y-3">
						<div>
							<label className="block text-xs text-gray-700">Nombre</label>
							<input className="input" defaultValue={cliente?.nombre} onChange={e => setForm(s => ({ ...s, nombre: e.target.value }))} />
						</div>
						<div>
							<label className="block text-xs text-gray-700">Apellido</label>
							<input className="input" defaultValue={cliente?.apellido} onChange={e => setForm(s => ({ ...s, apellido: e.target.value }))} />
						</div>
						<div>
							<label className="block text-xs text-gray-700">Teléfono</label>
							<input className="input" defaultValue={cliente?.telefono ?? ''} onChange={e => setForm(s => ({ ...s, telefono: e.target.value }))} />
						</div>
						<div>
							<label className="block text-xs text-gray-700">Ciudad</label>
							<input className="input" defaultValue={cliente?.ciudad ?? ''} onChange={e => setForm(s => ({ ...s, ciudad: e.target.value }))} />
						</div>
						<div className="flex items-center gap-3">
							<button type="submit" className="btn-primary" disabled={mutation.isPending}>Guardar cambios</button>
							<button type="button" className="btn-secondary" onClick={() => { setForm({ nombre: cliente?.nombre ?? '', apellido: cliente?.apellido ?? '', telefono: cliente?.telefono ?? '', ciudad: cliente?.ciudad ?? '' }) }}>Restaurar</button>
						</div>
					</form>
				</div>

				<div className="surface p-6">
					<h2 className="font-semibold">Programa de puntos</h2>
					<p className="text-sm text-gray-600 mt-2">Acumula puntos por tus compras. 1 punto cada $1.000</p>
					<div className="mt-4 text-center">
						<div className="text-4xl font-bold text-teal-700">{cliente?.puntosAcumulados ?? 0}</div>
						{cliente?.puntosExpiranEn && (
							<div className="text-sm text-gray-500 mt-2">Expiran: {new Date(cliente.puntosExpiranEn).toLocaleDateString()}</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
