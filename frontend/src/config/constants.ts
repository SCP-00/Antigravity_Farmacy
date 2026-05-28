// constants.ts

/** Roles de empleados del sistema. */
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  FARMACEUTA:    'FARMACEUTA',
  AUXILIAR:      'AUXILIAR',
} as const

export type RolEmpleado = keyof typeof ROLES

/**
 * Matriz de permisos: qué roles pueden acceder a cada módulo.
 * Usado por el hook `usePermisos` y guards de rutas.
 */
export const PERMISOS = {
  caja:        [ROLES.ADMINISTRADOR, ROLES.FARMACEUTA],
  inventario:  [ROLES.ADMINISTRADOR, ROLES.AUXILIAR],
  compras:     [ROLES.ADMINISTRADOR, ROLES.AUXILIAR],
  proveedores: [ROLES.ADMINISTRADOR, ROLES.AUXILIAR],
  clientes:    [ROLES.ADMINISTRADOR, ROLES.FARMACEUTA],
  empleados:   [ROLES.ADMINISTRADOR],
  reportes:    [ROLES.ADMINISTRADOR],
  config:      [ROLES.ADMINISTRADOR],
} as const

/** Ruta de inicio por defecto después del login según el rol del empleado. */
export const RUTA_POR_ROL: Record<RolEmpleado, string> = {
  ADMINISTRADOR: '/admin',
  FARMACEUTA:    '/admin/caja/pos',
  AUXILIAR:      '/admin/inventario/productos',
}

/** Etiquetas en español para los estados de una venta. */
export const ESTADO_VENTA_LABEL: Record<string, string> = {
  PAGADO:    'Pagado',
  DEVUELTO:  'Devuelto',
  PENDIENTE: 'Pendiente',
  CANCELADO: 'Cancelado',
}

/** Etiquetas en español para los métodos de pago disponibles. */
export const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO:    'Efectivo',
  WOMPI:       'Wompi (PSE / Nequi)',
  STRIPE:      'Stripe (Tarjeta)',
  MERCADOPAGO: 'MercadoPago',
  TRANSFERENCIA: 'Transferencia',
}

/** Emojis/iconos asociados a cada categoría de producto. */
export const CATEGORIAS_ICONOS: Record<string, string> = {
  'Analgésicos':     '💊',
  'Antibióticos':    '🦠',
  'Cardiovascular':  '❤️',
  'Vitaminas':       '🌿',
  'Dermatología':    '🧴',
  'Gastrointestinal':'🫃',
  'Respiratorio':    '🫁',
  'Diabetes':        '💉',
  'Antiparasitarios':'🔬',
  'Cuidado Personal':'🪥',
}

/** Tasa de conversión: 1 punto por cada $100 COP gastados. */
export const PUNTOS_POR_PESO = 0.01

/** Días antes del vencimiento para disparar alertas de lotes próximos a vencer. */
export const DIAS_VENCIMIENTO_ALERTA = 30