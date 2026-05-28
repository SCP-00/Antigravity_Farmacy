-- CreateEnum
CREATE TYPE "RolEmpleado" AS ENUM ('ADMINISTRADOR', 'FARMACEUTA', 'AUXILIAR');

-- CreateTable
CREATE TABLE "sucursales" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255),
    "ciudad" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "horario_apertura" VARCHAR(5),
    "horario_cierre" VARCHAR(5),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" UUID NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "rol" "RolEmpleado" NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_actividad" (
    "id" UUID NOT NULL,
    "empleado_id" UUID,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50),
    "ip" VARCHAR(45),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "icono" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "cum" VARCHAR(50) NOT NULL,
    "registro_invima" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "principio_activo" VARCHAR(200) NOT NULL DEFAULT '',
    "atc" VARCHAR(20),
    "descripcion_atc" VARCHAR(255),
    "titular" VARCHAR(150),
    "expediente" VARCHAR(50),
    "forma_farmaceutica" VARCHAR(100),
    "via_administracion" VARCHAR(100),
    "slug" VARCHAR(180),
    "laboratorio" VARCHAR(120),
    "presentacion" TEXT,
    "concentracion" VARCHAR(80),
    "descripcion" TEXT,
    "requiere_rx" BOOLEAN NOT NULL DEFAULT false,
    "imagen_url" VARCHAR(500),
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_promedio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 10,
    "estado_cum" VARCHAR(50) NOT NULL DEFAULT 'Activo',
    "estado_registro" VARCHAR(20) DEFAULT 'Vigente',
    "fecha_expedicion" DATE,
    "fecha_vencimiento_registro" DATE,
    "fecha_activo_cum" DATE,
    "fecha_inactivo_cum" DATE,
    "es_muestra_medica" BOOLEAN NOT NULL DEFAULT false,
    "alergenos" TEXT,
    "advertencias" TEXT,
    "indicaciones" TEXT,
    "contraindicaciones" TEXT,
    "reacciones_adversas" TEXT,
    "interacciones" TEXT,
    "modo_uso" TEXT,
    "unidad_referencia" VARCHAR(100),
    "cantidad" VARCHAR(50),
    "unidad_medida" VARCHAR(50),
    "modalidad" VARCHAR(50),
    "ium" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "nit" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "nombre_contacto" VARCHAR(150),
    "email" VARCHAR(150),
    "telefono" VARCHAR(20),
    "ciudad" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "proveedor_id" UUID,
    "orden_compra_id" UUID,
    "codigo_lote" VARCHAR(50) NOT NULL,
    "fecha_fabricacion" DATE,
    "fecha_vencimiento" DATE NOT NULL,
    "cantidad_inicial" INTEGER NOT NULL,
    "cantidad_actual" INTEGER NOT NULL,
    "precio_compra" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "empleado_id" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_inventario" (
    "id" UUID NOT NULL,
    "lote_id" UUID,
    "tipo" VARCHAR(30) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "empleado_id" UUID NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "fecha_entrega_est" TIMESTAMP(3),
    "recibida_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_orden_compra" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad_pedida" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalles_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255),
    "tipo_doc" VARCHAR(10),
    "documento" VARCHAR(20),
    "telefono" VARCHAR(20),
    "ciudad" VARCHAR(100),
    "puntos_acumulados" INTEGER NOT NULL DEFAULT 0,
    "puntos_expiran_en" DATE,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "token_verificacion" VARCHAR(100),
    "token_reset_pass" VARCHAR(100),
    "token_reset_expira" TIMESTAMP(3),
    "autorizacion_datos" BOOLEAN NOT NULL DEFAULT false,
    "proveedor_auth" VARCHAR(20),
    "proveedor_auth_id" VARCHAR(100),
    "alergenos" TEXT,
    "condiciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "empleado_id" UUID NOT NULL,
    "monto_apertura" DECIMAL(12,2) NOT NULL,
    "monto_cierre" DECIMAL(12,2),
    "total_efectivo" DECIMAL(12,2),
    "total_tarjeta" DECIMAL(12,2),
    "total_online" DECIMAL(12,2),
    "total_ventas" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "observaciones" TEXT,
    "abierta_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "caja_id" UUID,
    "sucursal_id" INTEGER NOT NULL,
    "empleado_id" UUID NOT NULL,
    "cliente_id" UUID,
    "metodo_pago" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PAGADO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_venta" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "lote_id" UUID,
    "texto_ejemplo" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalles_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "total_devuelto" DECIMAL(12,2) NOT NULL,
    "reintegra_stock" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_online" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "cliente_id" UUID NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_transacciones" (
    "id" UUID NOT NULL,
    "pedido_online_id" UUID,
    "venta_id" UUID,
    "pasarela" VARCHAR(20) NOT NULL,
    "referencia_externa" VARCHAR(100),
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(5) NOT NULL DEFAULT 'COP',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "respuesta_pasarela" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_sesiones" (
    "id" UUID NOT NULL,
    "session_token" VARCHAR(100) NOT NULL,
    "mensajes" JSONB NOT NULL DEFAULT '[]',
    "escala_humano" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_descuento" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "usos_maximos" INTEGER,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_descuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "empleado_id" UUID NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "p256dh" VARCHAR(200) NOT NULL,
    "auth" VARCHAR(100) NOT NULL,
    "user_agent" VARCHAR(255),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cambios" (
    "id" UUID NOT NULL,
    "empleado_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "campo" VARCHAR(50) NOT NULL,
    "valor_anterior" TEXT NOT NULL,
    "valor_nuevo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_cambios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_codigo_key" ON "sucursales"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "productos_cum_key" ON "productos"("cum");

-- CreateIndex
CREATE UNIQUE INDEX "productos_slug_key" ON "productos"("slug");

-- CreateIndex
CREATE INDEX "productos_principio_activo_idx" ON "productos"("principio_activo");

-- CreateIndex
CREATE INDEX "productos_atc_idx" ON "productos"("atc");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nit_key" ON "proveedores"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_cliente_id_producto_id_key" ON "favoritos"("cliente_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_venta_id_key" ON "devoluciones"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_transacciones_pedido_online_id_key" ON "pagos_transacciones"("pedido_online_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_sesiones_session_token_key" ON "chatbot_sesiones"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "codigos_descuento_codigo_key" ON "codigos_descuento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_empleado_id_endpoint_key" ON "push_subscriptions"("empleado_id", "endpoint");

-- CreateIndex
CREATE INDEX "historial_cambios_producto_id_creado_en_idx" ON "historial_cambios"("producto_id", "creado_en");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_actividad" ADD CONSTRAINT "logs_actividad_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_inventario" ADD CONSTRAINT "alertas_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_online_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_transacciones" ADD CONSTRAINT "pagos_transacciones_pedido_online_id_fkey" FOREIGN KEY ("pedido_online_id") REFERENCES "pedidos_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_transacciones" ADD CONSTRAINT "pagos_transacciones_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

