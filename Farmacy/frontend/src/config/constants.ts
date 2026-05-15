// constants.ts
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  FARMACEUTA:    'FARMACEUTA',
  AUXILIAR:      'AUXILIAR',
} as const

export type RolEmpleado = keyof typeof ROLES

// Permisos por módulo
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

// Ruta de inicio por rol
export const RUTA_POR_ROL: Record<RolEmpleado, string> = {
  ADMINISTRADOR: '/admin',
  FARMACEUTA:    '/admin/caja/pos',
  AUXILIAR:      '/admin/inventario/productos',
}

export const ESTADO_VENTA_LABEL: Record<string, string> = {
  PAGADO:    'Pagado',
  DEVUELTO:  'Devuelto',
  PENDIENTE: 'Pendiente',
  CANCELADO: 'Cancelado',
}

export const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO:    'Efectivo',
  WOMPI:       'Wompi (PSE / Nequi)',
  STRIPE:      'Stripe (Tarjeta)',
  MERCADOPAGO: 'MercadoPago',
  TRANSFERENCIA: 'Transferencia',
}

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

export const PUNTOS_POR_PESO = 0.001   // 1 punto por cada $1,000 COP gastados
export const DIAS_VENCIMIENTO_ALERTA = 30