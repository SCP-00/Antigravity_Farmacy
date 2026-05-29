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

  // ── 5. Productos (Con Estructura CUM/INVIMA — 30+ productos balanceados) ──
  console.log('💊 Creando productos basados en INVIMA...')

  const datasetProductos = [
    // ── Analgésicos ──
    { cum: '199200-1', registroInvima: 'INVIMA 2020M-123456', nombre: 'IBUPROFENO 400mg MK', principioActivo: 'IBUPROFENO', atc: 'M01AE01', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '400mg', presentacion: 'Caja x 20 tabletas', slug: 'ibuprofeno-400mg-mk', laboratorio: 'MK Pharma', requiereRx: false, categoriaId: catMap['analgesicos'], precioVenta: 8500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: 'Lactosa', advertencias: 'No tomar si sufre de úlcera gástrica. Tomar con alimentos.' },
    { cum: '199201-0', registroInvima: 'INVIMA 2020M-123457', nombre: 'ACETAMINOFÉN 500mg Genfar', principioActivo: 'ACETAMINOFÉN', atc: 'N02BE01', titular: 'Genfar S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '500mg', presentacion: 'Caja x 30 tabletas', slug: 'acetaminofen-500mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['analgesicos'], precioVenta: 3200, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No exceder 4g al día. Evitar en caso de enfermedad hepática.' },
    { cum: 'NAPROX-01', registroInvima: 'INVIMA 2021M-003001', nombre: 'NAPROXENO SÓDICO 550mg', principioActivo: 'NAPROXENO SÓDICO', atc: 'M01AE02', titular: 'Procaps S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '550mg', presentacion: 'Caja x 20 tabletas', slug: 'naproxeno-550mg', laboratorio: 'Procaps S.A.', requiereRx: true, categoriaId: catMap['analgesicos'], precioVenta: 15200, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Contraindicado en pacientes con asma sensible a AINEs.' },
    { cum: 'DICLOF-01', registroInvima: 'INVIMA 2021M-003002', nombre: 'DICLOFENACO 75mg MK', principioActivo: 'DICLOFENACO SÓDICO', atc: 'M01AB05', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '75mg', presentacion: 'Caja x 24 tabletas', slug: 'diclofenaco-75mg-mk', laboratorio: 'MK Pharma', requiereRx: true, categoriaId: catMap['analgesicos'], precioVenta: 9800, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Riesgo cardiovascular en tratamientos prolongados.' },

    // ── Antibióticos ──
    { cum: 'AMOXI-01', registroInvima: 'INVIMA 2022M-004001', nombre: 'AMOXICILINA 500mg Genfar', principioActivo: 'AMOXICILINA TRIHIDRATO', atc: 'J01CA04', titular: 'Genfar S.A.', formaFarmaceutica: 'CÁPSULA', viaAdministracion: 'ORAL', concentracion: '500mg', presentacion: 'Caja x 30 cápsulas', slug: 'amoxicilina-500mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: true, categoriaId: catMap['antibioticos'], precioVenta: 12500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: 'Penicilina', advertencias: 'Completar el ciclo de tratamiento aunque haya mejoría.' },
    { cum: 'AZITRO-01', registroInvima: 'INVIMA 2022M-004002', nombre: 'AZITROMICINA 500mg MK', principioActivo: 'AZITROMICINA', atc: 'J01FA10', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '500mg', presentacion: 'Caja x 3 tabletas', slug: 'azitromicina-500mg-mk', laboratorio: 'MK Pharma', requiereRx: true, categoriaId: catMap['antibioticos'], precioVenta: 18500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Tomar 1 hora antes o 2 horas después de alimentos.' },
    { cum: 'CIPRO-01', registroInvima: 'INVIMA 2022M-004003', nombre: 'CIPROFLOXACINO 500mg', principioActivo: 'CIPROFLOXACINO', atc: 'J01MA02', titular: 'Procaps S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '500mg', presentacion: 'Caja x 14 tabletas', slug: 'ciprofloxacino-500mg', laboratorio: 'Procaps S.A.', requiereRx: true, categoriaId: catMap['antibioticos'], precioVenta: 22300, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Evitar exposición solar durante el tratamiento.' },

    // ── Cardiovascular ──
    { cum: 'LOSAR-01', registroInvima: 'INVIMA 2021M-005001', nombre: 'LOSARTÁN 50mg Genfar', principioActivo: 'LOSARTÁN POTÁSICO', atc: 'C09CA01', titular: 'Genfar S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '50mg', presentacion: 'Caja x 30 tabletas', slug: 'losartan-50mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: true, categoriaId: catMap['cardiovascular'], precioVenta: 14600, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No usar durante el embarazo. Monitorear función renal.' },
    { cum: 'ENALA-01', registroInvima: 'INVIMA 2021M-005002', nombre: 'ENALAPRIL 10mg Genfar', principioActivo: 'ENALAPRIL MALEATO', atc: 'C09AA02', titular: 'Genfar S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '10mg', presentacion: 'Caja x 30 tabletas', slug: 'enalapril-10mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: true, categoriaId: catMap['cardiovascular'], precioVenta: 12300, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Puede causar mareos al inicio del tratamiento.' },
    { cum: 'ATENO-01', registroInvima: 'INVIMA 2021M-005003', nombre: 'ATENOLOL 50mg MK', principioActivo: 'ATENOLOL', atc: 'C07AB03', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '50mg', presentacion: 'Caja x 30 tabletas', slug: 'atenolol-50mg-mk', laboratorio: 'MK Pharma', requiereRx: true, categoriaId: catMap['cardiovascular'], precioVenta: 10900, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No suspender bruscamente. Reducir dosis gradual.' },

    // ── Vitaminas ──
    { cum: 'VIT-C-01', registroInvima: 'INVIMA 2023M-006001', nombre: 'VITAMINA C 1000mg Efervescente', principioActivo: 'ÁCIDO ASCÓRBICO', atc: 'A11GA01', titular: 'Procaps S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '1000mg', presentacion: 'Caja x 30 tabletas efervescentes', slug: 'vitamina-c-1000mg-eferv', laboratorio: 'Procaps S.A.', requiereRx: false, categoriaId: catMap['vitaminas'], precioVenta: 22500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No exceder la dosis diaria recomendada.' },
    { cum: 'VIT-B-01', registroInvima: 'INVIMA 2023M-006002', nombre: 'COMPLEJO B MK 50 cápsulas', principioActivo: 'VITAMINAS B COMPLEJO', atc: 'A11EA', titular: 'MK Pharma', formaFarmaceutica: 'CÁPSULA', viaAdministracion: 'ORAL', concentracion: '50 cápsulas', presentacion: 'Frasco x 50 cápsulas blandas', slug: 'complejo-b-mk-50', laboratorio: 'MK Pharma', requiereRx: false, categoriaId: catMap['vitaminas'], precioVenta: 28700, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Puede causar orina amarilla — efecto normal.' },
    { cum: 'VIT-D-01', registroInvima: 'INVIMA 2023M-006003', nombre: 'VITAMINA D3 2000UI Genfar', principioActivo: 'COLECALCIFEROL', atc: 'A11CC05', titular: 'Genfar S.A.', formaFarmaceutica: 'CÁPSULA', viaAdministracion: 'ORAL', concentracion: '2000 UI', presentacion: 'Caja x 30 cápsulas', slug: 'vitamina-d3-2000ui-genfar', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['vitaminas'], precioVenta: 19500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Consulte a su médico antes de tomar suplementos de vitamina D.' },
    { cum: 'VIT-MULTI', registroInvima: 'INVIMA 2023M-006004', nombre: 'MULTIVITAMÍNICO Centrum', principioActivo: 'MULTIVITAMÍNICO', atc: 'A11AA01', titular: 'Procaps S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '30 tabletas', presentacion: 'Caja x 30 tabletas recubiertas', slug: 'multivitaminico-centrum', laboratorio: 'Procaps S.A.', requiereRx: false, categoriaId: catMap['vitaminas'], precioVenta: 41500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Complemento alimenticio — no reemplaza una dieta balanceada.' },

    // ── Dermatología ──
    { cum: 'CLOTR-01', registroInvima: 'INVIMA 2022M-007001', nombre: 'CLOTRIMAZOL 1% Crema 30g', principioActivo: 'CLOTRIMAZOL', atc: 'D01AC01', titular: 'Genfar S.A.', formaFarmaceutica: 'CREMA', viaAdministracion: 'TÓPICA', concentracion: '1%', presentacion: 'Tubo x 30g', slug: 'clotrimazol-1-crema-30g', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['dermatologia'], precioVenta: 9800, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Uso externo. No aplicar en ojos o mucosas.' },
    { cum: 'HIDRO-01', registroInvima: 'INVIMA 2022M-007002', nombre: 'HIDROCORTISONA 1% Crema', principioActivo: 'HIDROCORTISONA', atc: 'D07AA02', titular: 'MK Pharma', formaFarmaceutica: 'CREMA', viaAdministracion: 'TÓPICA', concentracion: '1%', presentacion: 'Tubo x 20g', slug: 'hidrocortisona-1-crema', laboratorio: 'MK Pharma', requiereRx: false, categoriaId: catMap['dermatologia'], precioVenta: 11500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No usar por más de 7 días sin supervisión médica.' },
    { cum: 'BETAM-01', registroInvima: 'INVIMA 2022M-007003', nombre: 'BETAMETASONA 0.05% Crema', principioActivo: 'BETAMETASONA DIPROPIONATO', atc: 'D07AC01', titular: 'Procaps S.A.', formaFarmaceutica: 'CREMA', viaAdministracion: 'TÓPICA', concentracion: '0.05%', presentacion: 'Tubo x 30g', slug: 'betametasona-005-crema', laboratorio: 'Procaps S.A.', requiereRx: true, categoriaId: catMap['dermatologia'], precioVenta: 16800, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Uso exclusivo bajo prescripción. No aplicar en rostro.' },

    // ── Gastrointestinal ──
    { cum: 'OMEPR-01', registroInvima: 'INVIMA 2021M-008001', nombre: 'OMEPRAZOL 20mg Genfar', principioActivo: 'OMEPRAZOL', atc: 'A02BC01', titular: 'Genfar S.A.', formaFarmaceutica: 'CÁPSULA', viaAdministracion: 'ORAL', concentracion: '20mg', presentacion: 'Caja x 28 cápsulas', slug: 'omeprazol-20mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['gastrointestinal'], precioVenta: 15600, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Tomar en ayunas 30-60 min antes del desayuno.' },
    { cum: 'RANI-01', registroInvima: 'INVIMA 2021M-008002', nombre: 'RANITIDINA 150mg MK', principioActivo: 'RANITIDINA CLORHIDRATO', atc: 'A02BA02', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '150mg', presentacion: 'Caja x 30 tabletas', slug: 'ranitidina-150mg-mk', laboratorio: 'MK Pharma', requiereRx: false, categoriaId: catMap['gastrointestinal'], precioVenta: 11400, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No usar por más de 14 días sin indicación médica.' },
    { cum: 'LOPER-01', registroInvima: 'INVIMA 2021M-008003', nombre: 'LOPERAMIDA 2mg Genfar', principioActivo: 'LOPERAMIDA CLORHIDRATO', atc: 'A07DA03', titular: 'Genfar S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '2mg', presentacion: 'Caja x 12 tabletas', slug: 'loperamida-2mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['gastrointestinal'], precioVenta: 5600, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No usar si hay fiebre o sangre en heces.' },

    // ── Respiratorio ──
    { cum: 'SALBU-01', registroInvima: 'INVIMA 2022M-009001', nombre: 'SALBUTAMOL 100mcg Inhalador', principioActivo: 'SALBUTAMOL SULFATO', atc: 'R03AC02', titular: 'Genfar S.A.', formaFarmaceutica: 'AEROSOL', viaAdministracion: 'INHALACIÓN', concentracion: '100 mcg/inh', presentacion: 'Inhalador x 200 dosis', slug: 'salbutamol-100mcg-inhalador', laboratorio: 'Genfar S.A.', requiereRx: true, categoriaId: catMap['respiratorio'], precioVenta: 32800, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No exceder la dosis prescrita. Buscar ayuda si el alivio dura menos de 3h.' },
    { cum: 'LORAT-01', registroInvima: 'INVIMA 2022M-009002', nombre: 'LORATADINA 10mg MK', principioActivo: 'LORATADINA', atc: 'R06AX13', titular: 'MK Pharma', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '10mg', presentacion: 'Caja x 30 tabletas', slug: 'loratadina-10mg-mk', laboratorio: 'MK Pharma', requiereRx: false, categoriaId: catMap['respiratorio'], precioVenta: 8900, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Puede causar sequedad bucal. Tomar una vez al día.' },
    { cum: 'BECLA-01', registroInvima: 'INVIMA 2022M-009003', nombre: 'BECLOMETASONA 50mcg Inhalador', principioActivo: 'BECLOMETASONA DIPROPIONATO', atc: 'R03BA01', titular: 'Procaps S.A.', formaFarmaceutica: 'AEROSOL', viaAdministracion: 'INHALACIÓN', concentracion: '50 mcg/inh', presentacion: 'Inhalador x 200 dosis', slug: 'beclometasona-50mcg-inhalador', laboratorio: 'Procaps S.A.', requiereRx: true, categoriaId: catMap['respiratorio'], precioVenta: 45200, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'Enjuagar la boca después de cada uso para prevenir candidiasis oral.' },

    // ── Antialérgicos (3 existentes + 1 nuevo) ──
    { cum: '3521-3', registroInvima: 'INVIMA 2021M-002103-R3', nombre: 'ALERCET ® JARABE (30 ML)', principioActivo: 'CETIRIZINA DICLORHIDRATO', atc: 'R06AE07', titular: 'PROCAPS S.A.', formaFarmaceutica: 'JARABE', viaAdministracion: 'ORAL', concentracion: '100 ML', presentacion: 'CAJA CON UN FRASCO DE VIDRIO ÁMBAR TIPO III POR 30 ML CON TAPA BLANCA DE ALUMINIO Y CUCHARA DOSIFICADORA.', slug: 'alercet-jarabe-30ml', laboratorio: 'PROCAPS S.A.', requiereRx: false, categoriaId: catMap['antialergicos'], precioVenta: 18500, estadoCum: 'Activo', esMuestraMedica: false, alergenos: 'Sorbitol, Metilparabeno, Propilparabeno', advertencias: 'Puede producir somnolencia. No maneje maquinaria pesada.' },
    { cum: '3521-4', registroInvima: 'INVIMA 2021M-002103-R3', nombre: 'ALERCET ® JARABE (60 ML)', principioActivo: 'CETIRIZINA DICLORHIDRATO', atc: 'R06AE07', titular: 'PROCAPS S.A.', formaFarmaceutica: 'JARABE', viaAdministracion: 'ORAL', concentracion: '100 ML', presentacion: 'CAJA CON UN FRASCO DE VIDRIO ÁMBAR TIPO III POR 60 ML.', slug: 'alercet-jarabe-60ml', laboratorio: 'PROCAPS S.A.', requiereRx: false, categoriaId: catMap['antialergicos'], precioVenta: 29800, estadoCum: 'Activo', esMuestraMedica: false, alergenos: 'Sorbitol, Metilparabeno', advertencias: 'Contiene sorbitol. No exceda la dosis recomendada.' },
    { cum: '3521-7', registroInvima: 'INVIMA 2021M-002103-R3', nombre: 'MUESTRA MÉDICA: ALERCET ® JARABE (10 ML)', principioActivo: 'CETIRIZINA DICLORHIDRATO', atc: 'R06AE07', titular: 'PROCAPS S.A.', formaFarmaceutica: 'JARABE', viaAdministracion: 'ORAL', concentracion: '100 ML', presentacion: 'MUESTRA MÉDICA: FRASCO VIDRIO AMBAR 10ML.', slug: 'muestra-alercet-jarabe-10ml', laboratorio: 'PROCAPS S.A.', requiereRx: false, categoriaId: catMap['antialergicos'], precioVenta: 0, estadoCum: 'Activo', esMuestraMedica: true, alergenos: 'Sorbitol', advertencias: 'PROHIBIDA SU VENTA. Exclusivo para prescripción médica.' },
    { cum: 'DESLO-01', registroInvima: 'INVIMA 2023M-010001', nombre: 'DESLORATADINA 5mg Genfar', principioActivo: 'DESLORATADINA', atc: 'R06AX27', titular: 'Genfar S.A.', formaFarmaceutica: 'TABLETA', viaAdministracion: 'ORAL', concentracion: '5mg', presentacion: 'Caja x 30 tabletas', slug: 'desloratadina-5mg-genfar', laboratorio: 'Genfar S.A.', requiereRx: false, categoriaId: catMap['antialergicos'], precioVenta: 18700, estadoCum: 'Activo', esMuestraMedica: false, alergenos: '', advertencias: 'No causa somnolencia. Tomar a la misma hora cada día.' },
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
  console.log(`  ✅ ${datasetProductos.length} productos ingresados correctamente (balanceados por categoría)`)

  // ── 6. Lotes de ejemplo ──────────────────────────────────
  console.log('📦 Creando lotes de inventario...')
  const hoy = new Date()
  const en6meses = new Date(hoy); en6meses.setMonth(hoy.getMonth() + 6)
  const en30dias = new Date(hoy); en30dias.setDate(hoy.getDate() + 15)
  const en2anos  = new Date(hoy); en2anos.setFullYear(hoy.getFullYear() + 2)
  const en90dias = new Date(hoy); en90dias.setDate(hoy.getDate() + 90)

  const lotes = [
    // Antialérgicos
    { codigoLote: 'L-ALER-30', productoId: prodMap['3521-3'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en2anos, cantidadInicial: 150, cantidadActual: 150, precioCompra: 9000 },
    { codigoLote: 'L-ALER-60', productoId: prodMap['3521-4'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 100, cantidadActual: 100, precioCompra: 14500 },
    { codigoLote: 'L-ALER-M7', productoId: prodMap['3521-7'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 50, cantidadActual: 50, precioCompra: 0 },
    { codigoLote: 'L-DESLO', productoId: prodMap['DESLO-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 80, cantidadActual: 80, precioCompra: 8500 },
    // Analgésicos
    { codigoLote: 'L-IBU-199', productoId: prodMap['199200-1'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 300, cantidadActual: 300, precioCompra: 3500 },
    { codigoLote: 'L-ACETA', productoId: prodMap['199201-0'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en90dias, cantidadInicial: 500, cantidadActual: 500, precioCompra: 1200 },
    { codigoLote: 'L-NAPROX', productoId: prodMap['NAPROX-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 80, cantidadActual: 80, precioCompra: 7000 },
    { codigoLote: 'L-DICLO', productoId: prodMap['DICLOF-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en6meses, cantidadInicial: 120, cantidadActual: 120, precioCompra: 4500 },
    // Antibióticos
    { codigoLote: 'L-AMOXI', productoId: prodMap['AMOXI-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 200, cantidadActual: 200, precioCompra: 6000 },
    { codigoLote: 'L-AZITRO', productoId: prodMap['AZITRO-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en6meses, cantidadInicial: 150, cantidadActual: 150, precioCompra: 9500 },
    { codigoLote: 'L-CIPRO', productoId: prodMap['CIPRO-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 100, cantidadActual: 100, precioCompra: 11500 },
    // Cardiovascular
    { codigoLote: 'L-LOSAR', productoId: prodMap['LOSAR-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 250, cantidadActual: 250, precioCompra: 6500 },
    { codigoLote: 'L-ENALA', productoId: prodMap['ENALA-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 200, cantidadActual: 200, precioCompra: 5500 },
    { codigoLote: 'L-ATENO', productoId: prodMap['ATENO-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en30dias, cantidadActual: 45, cantidadInicial: 200, precioCompra: 5000 },
    // Vitaminas
    { codigoLote: 'L-VIT-C', productoId: prodMap['VIT-C-01'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 180, cantidadActual: 180, precioCompra: 11000 },
    { codigoLote: 'L-VIT-B', productoId: prodMap['VIT-B-01'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en2anos, cantidadInicial: 120, cantidadActual: 120, precioCompra: 14000 },
    { codigoLote: 'L-VIT-D', productoId: prodMap['VIT-D-01'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en2anos, cantidadInicial: 90, cantidadActual: 90, precioCompra: 9500 },
    { codigoLote: 'L-MULTI', productoId: prodMap['VIT-MULTI'], sucursalId: sucursal1.id, proveedorId: prov2.id, fechaVencimiento: en6meses, cantidadInicial: 60, cantidadActual: 60, precioCompra: 21000 },
    // Dermatología
    { codigoLote: 'L-CLOTR', productoId: prodMap['CLOTR-01'], sucursalId: sucursal2.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 100, cantidadActual: 100, precioCompra: 4000 },
    { codigoLote: 'L-HIDRO', productoId: prodMap['HIDRO-01'], sucursalId: sucursal2.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 80, cantidadActual: 80, precioCompra: 5200 },
    { codigoLote: 'L-BETAM', productoId: prodMap['BETAM-01'], sucursalId: sucursal2.id, proveedorId: prov1.id, fechaVencimiento: en6meses, cantidadInicial: 60, cantidadActual: 60, precioCompra: 7500 },
    // Gastrointestinal
    { codigoLote: 'L-OMEPR', productoId: prodMap['OMEPR-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 350, cantidadActual: 350, precioCompra: 7500 },
    { codigoLote: 'L-RANI', productoId: prodMap['RANI-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 200, cantidadActual: 200, precioCompra: 5000 },
    { codigoLote: 'L-LOPER', productoId: prodMap['LOPER-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en90dias, cantidadActual: 160, cantidadInicial: 200, precioCompra: 2500 },
    // Respiratorio
    { codigoLote: 'L-SALBU', productoId: prodMap['SALBU-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en90dias, cantidadInicial: 70, cantidadActual: 70, precioCompra: 16000 },
    { codigoLote: 'L-LORAT', productoId: prodMap['LORAT-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en30dias, cantidadInicial: 150, cantidadActual: 150, precioCompra: 3500 },
    { codigoLote: 'L-BECLA', productoId: prodMap['BECLA-01'], sucursalId: sucursal1.id, proveedorId: prov1.id, fechaVencimiento: en2anos, cantidadInicial: 40, cantidadActual: 40, precioCompra: 22000 },
  ]

  for (const lote of lotes) {
    await prisma.lote.create({ data: lote as any })
  }
  console.log(`  ✅ ${lotes.length} lotes asociados creados correctamente`)

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