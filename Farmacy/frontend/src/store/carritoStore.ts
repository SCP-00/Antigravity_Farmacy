import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CarritoProducto, ProductoCatalogo } from '@/types/producto.types'

interface CarritoState {
	items: CarritoProducto[]
	agregar: (producto: Omit<CarritoProducto, 'cantidad'> & { cantidad?: number }) => void
	quitar: (productoId: string) => void
	cambiarCantidad: (productoId: string, cantidad: number) => void
	sincronizarStock: (productos: ProductoCatalogo[]) => void
	limpiar: () => void
	totalItems: () => number
	subtotal: () => number
	total: () => number
	tieneRx: () => boolean
}

const clamp = (valor: number, minimo: number, maximo: number) => Math.min(Math.max(valor, minimo), maximo)

export const useCarritoStore = create<CarritoState>()(
	persist(
		(set, get) => ({
			items: [],

			agregar: (producto) => set((state) => {
				const cantidadSolicitada = Math.max(1, producto.cantidad ?? 1)
				const index = state.items.findIndex((item) => item.productoId === producto.productoId)

				if (index >= 0) {
					const actual = state.items[index]
					const cantidad = clamp(actual.cantidad + cantidadSolicitada, 1, actual.stockMaximo)
					const items = [...state.items]
					items[index] = { ...actual, cantidad }
					return { items }
				}

				return {
					items: [
						...state.items,
						{
							...producto,
							cantidad: clamp(cantidadSolicitada, 1, Math.max(1, producto.stockMaximo)),
						},
					],
				}
			}),

			quitar: (productoId) => set((state) => ({
				items: state.items.filter((item) => item.productoId !== productoId),
			})),

			cambiarCantidad: (productoId, cantidad) => set((state) => ({
				items: state.items.flatMap((item) => {
					if (item.productoId !== productoId) return [item]
					if (cantidad <= 0) return []
					return [{ ...item, cantidad: clamp(cantidad, 1, item.stockMaximo) }]
				}),
			})),

			sincronizarStock: (productos) => set((state) => ({
				items: state.items
					.map((item) => {
						const producto = productos.find((p) => p.id === item.productoId)
						if (!producto) return item
						return { ...item, stockMaximo: producto.stockTotal, cantidad: clamp(item.cantidad, 1, Math.max(1, producto.stockTotal)) }
					})
					.filter((item) => item.stockMaximo > 0),
			})),

			limpiar: () => set({ items: [] }),

			totalItems: () => get().items.reduce((suma, item) => suma + item.cantidad, 0),
			subtotal: () => get().items.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0),
			total: () => get().subtotal(),
			tieneRx: () => get().items.some((item) => item.requiereRx),
		}),
		{
			name: 'farmacy-carrito',
			storage: createJSONStorage(() => localStorage),
		}
	)
)
