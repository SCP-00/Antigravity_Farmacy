export interface CategoriaCatalogo {
	id: string
	nombre: string
	slug: string
	margen_ganancia_porcentaje: number
}

export interface SedeCatalogo {
	id: string
	nombre: string
	direccion: string
	codigo_habilitacion: string
	telefono?: string
}

export interface ProductoCatalogo {
	id: string
	slug: string
	nombre: string
	marca: string
	categoriaSlug: string
	categoriaNombre: string
	presentacion: string
	concentracion: string
	precioVenta: number
	stockTotal: number
	stockMinimo: number
	disponibleEnvio: boolean
	disponibleTienda: boolean
	requiereRx: boolean
	laboratorio: string
	imagenUrl?: string
}

export interface CarritoProducto {
	productoId: string
	nombre: string
	marca: string
	presentacion: string
	concentracion: string
	precioUnitario: number
	cantidad: number
	stockMaximo: number
	requiereRx: boolean
	disponibleEnvio: boolean
	disponibleTienda: boolean
	imagenUrl?: string
}
