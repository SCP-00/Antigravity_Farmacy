import { PrismaClient, RolEmpleado } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeds de Farmacy con estándar INVIMA/CUM...\n')

  // ── 1. Sucursales ────────────────────────────────────────
  console.log('📍 Creando sucursales...')
  const sucursal1 = await prisma.sucursal.upsert({
    where: { codigo: 'SC-001' },
    update: {},
    create: {
      codigo: 'SC-001',
      nombre: 'Sede Centro',
      direccion: 'Carrera 8 #22-45',
      ciudad: 'Pereira',
      telefono: '+57 606 335 0001',
      email: 'centro@farmacy.co',
      latitud: 4.8133,
      longitud: -75.6961,
      horarioApertura: '07:00',
      horarioCierre: '21:00',
    },
  })

  const sucursal2 = await prisma.sucursal.upsert({
    where: { codigo: 'SC-002' },
    update: {},
    create: {
      codigo: 'SC-002',
      nombre: 'Sede El Lago',
      direccion: 'Calle 15 #11-20',
      ciudad: 'Pereira',
      telefono: '+57 606 335 0002',
      email: 'ellago@farmacy.co',
      latitud: 4.8185,
      longitud: -75.7002,
      horarioApertura: '08:00',
      horarioCierre: '20:00',
    },
  })
  console.log('  ✅ 2 sucursales creadas')

  // ── 2. Empleados ─────────────────────────────────────────
  console.log('👥 Creando empleados...')
  const saltRounds = 10
  const adminPass = await bcrypt.hash('Admin@1234', saltRounds)
  const farmPass  = await bcrypt.hash('Farm@1234', saltRounds)
  const auxPass   = await bcrypt.hash('Aux@1234', saltRounds)

  await prisma.empleado.upsert({
    where: { email: 'admin@farmacy.co' },
    update: {},
    create: {
      nombre: 'Super',
      apellido: 'Administrador',
      email: 'admin@farmacy.co',
      password: adminPass,
      rol: RolEmpleado.ADMINISTRADOR,
      sucursalId: sucursal1.id,
    },
  })

  await prisma.empleado.upsert({
    where: { email: 'farmaceuta@farmacy.co' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'farmaceuta@farmacy.co',
      password: farmPass,
      rol: RolEmpleado.FARMACEUTA,
      sucursalId: sucursal1.id,
    },
  })

  await prisma.empleado.upsert({
    where: { email: 'auxiliar@farmacy.co' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'García',
      email: 'auxiliar@farmacy.co',
      password: auxPass,
      rol: RolEmpleado.AUXILIAR,
      sucursalId: sucursal1.id,
    },
  })
  console.log('  ✅ 3 empleados creados')

  // ── 3. Categorías ────────────────────────────────────────
  console.log('📂 Creando categorías...')
  const categorias = [
    { nombre: 'Analgésicos',       slug: 'analgesicos',        icono: '💊', orden: 1 },
    { nombre: 'Antibióticos',      slug: 'antibioticos',       icono: '🦠', orden: 2 },
    { nombre: 'Cardiovascular',    slug: 'cardiovascular',     icono: '❤️', orden: 3 },
    { nombre: 'Vitaminas',         slug: 'vitaminas',          icono: '🌿', orden: 4 },
    { nombre: 'Dermatología',      slug: 'dermatologia',       icono: '🧴', orden: 5 },
    { nombre: 'Gastrointestinal',  slug: 'gastrointestinal',   icono: '🫃', orden: 6 },
    { nombre: 'Respiratorio',      slug: 'respiratorio',       icono: '🫁', orden: 7 },
    { nombre: 'Antialérgicos',     slug: 'antialergicos',      icono: '🤧', orden: 8 },
  ]

  const catMap: Record<string, number> = {}
  for (const cat of categorias) {
    const c = await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    catMap[cat.slug] = c.id
  }
  console.log(`  ✅ ${categorias.length} categorías creadas`)

  // ── 4. Proveedores ───────────────────────────────────────
  console.log('🏭 Creando proveedores...')
  const prov1 = await prisma.proveedor.upsert({
    where: { nit: '800195019-0' },
    update: {},
    create: {
      nit: '800195019-0',
      nombre: 'Genfar S.A.',
      nombreContacto: 'Pedro Salazar',
      telefono: '+57 1 308 4000',
      email: 'ventas@genfar.com.co',
      ciudad: 'Bogotá',
    },
  })

  const prov2 = await prisma.proveedor.upsert({
    where: { nit: '860002517-1' },
    update: {},
    create: {
      nit: '860002517-1',
      nombre: 'PROCAPS S.A.',
      nombreContacto: 'María López',
      telefono: '+57 5 371 9000',
      email: 'comercial@procaps.com.co',
      ciudad: 'Barranquilla',
    },
  })
  console.log('  ✅ 2 proveedores creados')

  // ── 5. Productos (Con Estructura CUM/INVIMA/Alercet Real) ──
  console.log('💊 Creando productos basados en INVIMA...')
  
  const datasetProductos = [
    // ALERCET COMERCIAL ACTIVO (30 ML)
    {
      cum: '3521-3',
      registroInvima: 'INVIMA 2021M-002103-R3',
      nombre: 'ALERCET ® JARABE (30 ML)',
      principioActivo: 'CETIRIZINA DICLORHIDRATO',
      atc: 'R06AE07',
      titular: 'PROCAPS S.A.',
      formaFarmaceutica: 'JARABE',
      viaAdministracion: 'ORAL',
      concentracion: '100 ML',
      presentacion: 'CAJA CON UN FRASCO DE VIDRIO ÁMBAR TIPO III POR 30 ML CON TAPA BLANCA DE ALUMINIO Y CUCHARA DOSIFICADORA.',
      slug: 'alercet-jarabe-30ml',
      laboratorio: 'PROCAPS S.A.',
      requiereRx: false,
      categoriaId: catMap['antialergicos'],
      precioVenta: 18500,
      estadoCum: 'Activo',
      esMuestraMedica: false,
      alergenos: 'Sorbitol, Metilparabeno, Propilparabeno',
      advertencias: 'Puede producir somnolencia. No consuma alcohol ni maneje maquinaria pesada. Mantener fuera del alcance de niños.'
    },
    // ALERCET COMERCIAL ACTIVO (60 ML)
    {
      cum: '3521-4',
      registroInvima: 'INVIMA 2021M-002103-R3',
      nombre: 'ALERCET ® JARABE (60 ML)',
      principioActivo: 'CETIRIZINA DICLORHIDRATO',
      atc: 'R06AE07',
      titular: 'PROCAPS S.A.',
      formaFarmaceutica: 'JARABE',
      viaAdministracion: 'ORAL',
      concentracion: '100 ML',
      presentacion: 'CAJA CON UN FRASCO DE VIDRIO ÁMBAR TIPO III POR 60 ML CON TAPA BLANCA DE ALUMINIO Y CUCHARA DOSIFICADORA.',
      slug: 'alercet-jarabe-60ml',
      laboratorio: 'PROCAPS S.A.',
      requiereRx: false,
      categoriaId: catMap['antialergicos'],
      precioVenta: 29800,
      estadoCum: 'Activo',
      esMuestraMedica: false,
      alergenos: 'Sorbitol, Metilparabeno',
      advertencias: 'Contiene sorbitol. Puede causar molestias estomacales leves. No exceda la dosis recomendada.'
    },
    // ALERCET MUESTRA MÉDICA (10 ML) — BLOQUEADA PARA LA VENTA
    {
      cum: '3521-7',
      registroInvima: 'INVIMA 2021M-002103-R3',
      nombre: 'MUESTRA MÉDICA: ALERCET ® JARABE (10 ML)',
      principioActivo: 'CETIRIZINA DICLORHIDRATO',
      atc: 'R06AE07',
      titular: 'PROCAPS S.A.',
      formaFarmaceutica: 'JARABE',
      viaAdministracion: 'ORAL',
      concentracion: '100 ML',
      presentacion: 'MUESTRA MÉDICA: CAJA CON UN FRASCO DE VIDRIO AMBAR TIPO III POR 10ML CON TAPA BLANCA Y CUCHARA DOSIFICADORA.',
      slug: 'muestra-alercet-jarabe-10ml',
      laboratorio: 'PROCAPS S.A.',
      requiereRx: false,
      categoriaId: catMap['antialergicos'],
      precioVenta: 0,
      estadoCum: 'Activo',
      esMuestraMedica: true, // ⚠️ Bloqueado en Frontend B2C
      alergenos: 'Sorbitol',
      advertencias: 'PROHIBIDA SU VENTA. Exclusivo para prescripción médica.'
    },
    // OTRO REGISTRO DE REFERENCIA (Ibuprofeno estándar)
    {
      cum: '199200-1',
      registroInvima: 'INVIMA 2020M-123456',
      nombre: 'IBUPROFENO 400mg MK',
      principioActivo: 'IBUPROFENO',
      atc: 'M01AE01',
      titular: 'MK Pharma',
      formaFarmaceutica: 'TABLETA',
      viaAdministracion: 'ORAL',
      concentracion: '400mg',
      presentacion: 'Caja x 20 tabletas',
      slug: 'ibuprofeno-400mg-mk',
      laboratorio: 'MK Pharma',
      requiereRx: false,
      categoriaId: catMap['analgesicos'],
      precioVenta: 8500,
      estadoCum: 'Activo',
      esMuestraMedica: false,
      alergenos: 'Lactosa (en excipientes)',
      advertencias: 'No tomar si sufre de úlcera gástrica o alergia a los AINEs. Tomar con alimentos.'
    }
  ]

  const prodMap: Record<string, string> = {}
  for (const p of datasetProductos) {
    const prod = await prisma.producto.upsert({
      where: { cum: p.cum },
      update: {},
      create: p,
    })
    prodMap[p.cum] = prod.id
  }
  console.log(`  ✅ ${datasetProductos.length} productos ingresados correctamente`)

  // ── 6. Lotes de ejemplo ──────────────────────────────────
  console.log('📦 Creando lotes de inventario...')
  const hoy = new Date()
  const en6meses = new Date(hoy); en6meses.setMonth(hoy.getMonth() + 6)
  const en2anos  = new Date(hoy); en2anos.setFullYear(hoy.getFullYear() + 2)

  const lotes = [
    { codigoLote: 'L-ALER-30', productoId: prodMap['3521-3'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en2anos, cantidadInicial: 150, cantidadActual: 150, precioCompra: 9000 },
    { codigoLote: 'L-ALER-60', productoId: prodMap['3521-4'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 100, cantidadActual: 100, precioCompra: 14500 },
    { codigoLote: 'L-ALER-M7', productoId: prodMap['3521-7'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 50,  cantidadActual: 50,  precioCompra: 0 },
    { codigoLote: 'L-IBU-199', productoId: prodMap['199200-1'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 300, cantidadActual: 300, precioCompra: 3500 },
  ]

  for (const lote of lotes) {
    await prisma.lote.create({ data: lote as any })
  }
  console.log(`  ✅ Lotes asociados creados correctamente`)

  // ── 7. Cliente de ejemplo ────────────────────────────────
  console.log('👤 Creando cliente de ejemplo...')
  const clientePass = await bcrypt.hash('Cliente@1234', saltRounds)
  await prisma.cliente.upsert({
    where: { email: 'cliente@ejemplo.co' },
    update: {},
    create: {
      nombre: 'Laura',
      apellido: 'Martínez',
      email: 'cliente@ejemplo.co',
      password: clientePass,
      tipoDoc: 'CC',
      documento: '1234567890',
      telefono: '+57 310 000 0000',
      ciudad: 'Pereira',
      autorizacionDatos: true,
      emailVerificado: true,
      puntosAcumulados: 150,
    },
  })
  console.log('  ✅ Cliente demo listo')

  console.log('\n✨ Seeds cargados exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })