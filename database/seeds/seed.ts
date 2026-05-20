// database/seeds/seed.ts
// Ejecutar: npx ts-node database/seeds/seed.ts
// O con el script del package.json: npm run db:seed

import { PrismaClient, RolEmpleado } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeds de Farmacy...\n')

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

  const adminPass     = await bcrypt.hash('Admin@1234', saltRounds)
  const farmPass      = await bcrypt.hash('Farm@1234', saltRounds)
  const auxPass       = await bcrypt.hash('Aux@1234', saltRounds)

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
  console.log('     admin@farmacy.co        / Admin@1234  (Administrador)')
  console.log('     farmaceuta@farmacy.co   / Farm@1234   (Farmacéuta)')
  console.log('     auxiliar@farmacy.co     / Aux@1234    (Auxiliar)')

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
    { nombre: 'Diabetes',          slug: 'diabetes',           icono: '💉', orden: 8 },
    { nombre: 'Antiparasitarios',  slug: 'antiparasitarios',   icono: '🔬', orden: 9 },
    { nombre: 'Cuidado Personal',  slug: 'cuidado-personal',   icono: '🪥', orden: 10 },
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

  // ── 4. Proveedor de ejemplo ───────────────────────────────
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
      nombre: 'Tecnoquímicas S.A.',
      nombreContacto: 'María López',
      telefono: '+57 2 524 3030',
      email: 'comercial@tq.com.co',
      ciudad: 'Cali',
    },
  })
  console.log('  ✅ 2 proveedores creados')

  // ── 5. Productos ─────────────────────────────────────────
  console.log('💊 Creando productos...')
  const productos = [
    {
      registroInvima: 'INVIMA2021M-0001', nombre: 'Ibuprofeno',
      slug: 'ibuprofeno-400mg-mk',
      presentacion: 'Tableta x 20', concentracion: '400mg',
      laboratorio: 'MK Pharma', requiereRx: false,
      categoriaId: catMap['analgesicos'],
      precioVenta: 8500, precioPromedio: 4200, stockMinimo: 30,
    },
    {
      registroInvima: 'INVIMA2019M-0002', nombre: 'Amoxicilina',
      slug: 'amoxicilina-500mg-genfar',
      presentacion: 'Cápsula x 10', concentracion: '500mg',
      laboratorio: 'Genfar', requiereRx: true,
      categoriaId: catMap['antibioticos'],
      precioVenta: 24900, precioPromedio: 12000, stockMinimo: 20,
    },
    {
      registroInvima: 'INVIMA2020M-0003', nombre: 'Omeprazol',
      slug: 'omeprazol-20mg-lafrancol',
      presentacion: 'Cápsula x 14', concentracion: '20mg',
      laboratorio: 'Lafrancol', requiereRx: false,
      categoriaId: catMap['gastrointestinal'],
      precioVenta: 12200, precioPromedio: 6000, stockMinimo: 15,
    },
    {
      registroInvima: 'INVIMA2018M-0004', nombre: 'Metformina',
      slug: 'metformina-850mg-tq',
      presentacion: 'Tableta x 30', concentracion: '850mg',
      laboratorio: 'Tecnoquímicas', requiereRx: true,
      categoriaId: catMap['diabetes'],
      precioVenta: 18600, precioPromedio: 9000, stockMinimo: 20,
    },
    {
      registroInvima: 'INVIMA2021M-0005', nombre: 'Vitamina C',
      slug: 'vitamina-c-500mg-bayer',
      presentacion: 'Tableta x 30', concentracion: '500mg',
      laboratorio: 'Bayer', requiereRx: false,
      categoriaId: catMap['vitaminas'],
      precioVenta: 9800, precioPromedio: 4800, stockMinimo: 20,
    },
    {
      registroInvima: 'INVIMA2019M-0006', nombre: 'Atorvastatina',
      slug: 'atorvastatina-20mg-pfizer',
      presentacion: 'Tableta x 30', concentracion: '20mg',
      laboratorio: 'Pfizer', requiereRx: true,
      categoriaId: catMap['cardiovascular'],
      precioVenta: 31000, precioPromedio: 15000, stockMinimo: 10,
    },
    {
      registroInvima: 'INVIMA2022M-0007', nombre: 'Loratadina',
      slug: 'loratadina-10mg-genfar',
      presentacion: 'Tableta x 10', concentracion: '10mg',
      laboratorio: 'Genfar', requiereRx: false,
      categoriaId: catMap['respiratorio'],
      precioVenta: 6500, precioPromedio: 3200, stockMinimo: 25,
    },
    {
      registroInvima: 'INVIMA2020M-0008', nombre: 'Acetaminofén',
      slug: 'acetaminofen-500mg-mk',
      presentacion: 'Tableta x 20', concentracion: '500mg',
      laboratorio: 'MK Pharma', requiereRx: false,
      categoriaId: catMap['analgesicos'],
      precioVenta: 5200, precioPromedio: 2500, stockMinimo: 40,
    },
    {
      registroInvima: 'INVIMA2021M-0009', nombre: 'Diclofenaco',
      slug: 'diclofenaco-50mg-genfar',
      presentacion: 'Tableta x 10', concentracion: '50mg',
      laboratorio: 'Genfar', requiereRx: false,
      categoriaId: catMap['analgesicos'],
      precioVenta: 7800, precioPromedio: 3800, stockMinimo: 20,
    },
    {
      registroInvima: 'INVIMA2020M-0010', nombre: 'Azitromicina',
      slug: 'azitromicina-500mg-tq',
      presentacion: 'Tableta x 3', concentracion: '500mg',
      laboratorio: 'Tecnoquímicas', requiereRx: true,
      categoriaId: catMap['antibioticos'],
      precioVenta: 19500, precioPromedio: 9500, stockMinimo: 15,
    },
  ]

  const prodMap: Record<string, string> = {}
  for (const p of productos) {
    const prod = await prisma.producto.upsert({
      where: { registroInvima: p.registroInvima },
      update: {},
      create: {
        ...p,
        precioVenta: p.precioVenta,
        precioPromedio: p.precioPromedio,
      },
    })
    prodMap[p.registroInvima] = prod.id
  }
  console.log(`  ✅ ${productos.length} productos creados`)

  // ── 6. Lotes de ejemplo ──────────────────────────────────
  console.log('📦 Creando lotes de inventario...')
  const hoy = new Date()
  const en6meses = new Date(hoy); en6meses.setMonth(hoy.getMonth() + 6)
  const en1mes   = new Date(hoy); en1mes.setMonth(hoy.getMonth() + 1)
  const en2anos  = new Date(hoy); en2anos.setFullYear(hoy.getFullYear() + 2)

  const lotes = [
    { codigoLote: 'L-IBU-001', productoId: prodMap['INVIMA2021M-0001'],
      sucursalId: sucursal1.id, proveedorId: prov2.id,
      fechaVencimiento: en2anos, cantidadInicial: 200, cantidadActual: 200,
      precioCompra: 4200 },
    { codigoLote: 'L-AMO-001', productoId: prodMap['INVIMA2019M-0002'],
      sucursalId: sucursal1.id, proveedorId: prov1.id,
      fechaVencimiento: en6meses, cantidadInicial: 100, cantidadActual: 45,
      precioCompra: 12000 },
    { codigoLote: 'L-OME-001', productoId: prodMap['INVIMA2020M-0003'],
      sucursalId: sucursal1.id, proveedorId: prov1.id,
      fechaVencimiento: en1mes, cantidadInicial: 50, cantidadActual: 8,
      precioCompra: 6000 },   // ← Próximo a vencer y stock bajo
    { codigoLote: 'L-VIT-001', productoId: prodMap['INVIMA2021M-0005'],
      sucursalId: sucursal1.id, proveedorId: prov2.id,
      fechaVencimiento: en2anos, cantidadInicial: 120, cantidadActual: 6,
      precioCompra: 4800 },   // ← Stock crítico
    { codigoLote: 'L-ACE-001', productoId: prodMap['INVIMA2020M-0008'],
      sucursalId: sucursal1.id, proveedorId: prov2.id,
      fechaVencimiento: en2anos, cantidadInicial: 300, cantidadActual: 280,
      precioCompra: 2500 },
    { codigoLote: 'L-LOR-001', productoId: prodMap['INVIMA2022M-0007'],
      sucursalId: sucursal2.id, proveedorId: prov1.id,
      fechaVencimiento: en6meses, cantidadInicial: 80, cantidadActual: 60,
      precioCompra: 3200 },
  ]

  for (const lote of lotes) {
    await prisma.lote.create({ data: lote as any })
  }
  console.log(`  ✅ ${lotes.length} lotes creados`)

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
  console.log('  ✅ 1 cliente creado: cliente@ejemplo.co / Cliente@1234')

  console.log('\n✨ Seeds completados exitosamente!')
  console.log('─────────────────────────────────────────')
  console.log('Panel admin:  http://localhost:5173/admin/login')
  console.log('Tienda web:   http://localhost:5173')
  console.log('pgAdmin:      http://localhost:5050')
  console.log('─────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })