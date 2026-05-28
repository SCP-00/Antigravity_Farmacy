/**
 * Categoría de producto en el catálogo (ej: Analgésicos, Vitaminas).
 * Incluye margen de ganancia configurable por categoría.
 */
export interface CategoriaCatalogo {
	id: string
	nombre: string
	slug: string
	margen_ganancia_porcentaje: number
}

/**
 * Sucursal física de Farmacy.
 * Incluye código de habilitación INVIMA para farmacias colombianas.
 */
export interface SedeCatalogo {
	id: string
	nombre: string
	direccion: string
	codigo_habilitacion: string
	telefono?: string
}

/**
 * Producto completo del catálogo con todos los campos INVIMA.
 * Incluye datos regulatorios colombianos (CUM, Registro INVIMA,
 * principio activo, ATC, forma farmacéutica, etc.).
 *
 * Los campos marcados con `?` pueden ser null para medicamentos
 * sin registro completo o productos OTC.
 */
export interface ProductoCatalogo {
	id: string
	cum: string
	registroInvima: string
	slug: string
	nombre: string
	principioActivo: string
	atc?: string
	descripcionAtc?: string
	titular?: string
	expediente?: string
	formaFarmaceutica?: string
	viaAdministracion?: string
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
	estadoCum?: string
	estadoRegistro?: string
	fechaExpedicion?: string
	fechaVencimientoRegistro?: string
	fechaActivoCum?: string
	fechaInactivoCum?: string
	esMuestraMedica: boolean
	alergenos?: string | null
	advertencias?: string | null
	indicaciones?: string | null
	contraindicaciones?: string | null
	reaccionesAdversas?: string | null
	interacciones?: string | null
	modoUso?: string | null
	unidadReferencia?: string | null
	cantidad?: string | null
	unidadMedida?: string | null
	modalidad?: string | null
	ium?: string | null
}

/**
 * Producto dentro del carrito de compras.
 * Extiende los datos necesarios para checkout sin depender del servidor.
 */
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