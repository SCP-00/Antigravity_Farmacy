-- ═══════════════════════════════════════════════════════════════
--  Actualizar precios de medicamentos — Precios Colombia 2025-2026
--  Basado en investigación web de Cruz Verde, Farmatodo, Colsubsidio
-- ═══════════════════════════════════════════════════════════════

-- ANALGÉSICOS
UPDATE productos SET precio_venta = 5500  WHERE UPPER(nombre) LIKE '%ACETAMINOFEN%' AND precio_venta < 4500;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%ACETAMINOFEN%' AND precio_venta > 50000;
UPDATE productos SET precio_venta = 8500  WHERE UPPER(nombre) LIKE '%IBUPROFENO 400%';
UPDATE productos SET precio_venta = 6500  WHERE UPPER(nombre) LIKE '%DICLOFENACO%' AND precio_venta < 5000;
UPDATE productos SET precio_venta = 8000  WHERE UPPER(nombre) LIKE '%NAPROXENO%' AND precio_venta < 5000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%FLUOXETINA%' AND precio_venta < 4000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%METOCARBAMOL%' AND precio_venta < 4000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%HIDROCLOROTIAZIDA%' AND precio_venta < 4000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%HALOPERIDOL%' AND precio_venta < 4000;

-- ANTIBIÓTICOS
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%AZITROMICINA 500MG%';
UPDATE productos SET precio_venta = 25000 WHERE UPPER(nombre) LIKE 'AZITROMICINA MK%';
UPDATE productos SET precio_venta = 7000  WHERE UPPER(nombre) LIKE '%CLINDAMICINA%' AND precio_venta < 5000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%METRONIDAZOL ECAR%';
UPDATE productos SET precio_venta = 7000  WHERE UPPER(nombre) LIKE '%METROZIN%';
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%ENDOXAN 50 MG%';
UPDATE productos SET precio_venta = 10000 WHERE UPPER(nombre) LIKE '%AMOXICILINA%' AND precio_venta < 5000;

-- CARDIOVASCULAR
UPDATE productos SET precio_venta = 30000 WHERE UPPER(nombre) LIKE '%ATORVASTATINA%';
UPDATE productos SET precio_venta = 12000 WHERE UPPER(nombre) LIKE '%METFORMINA%' AND precio_venta < 5000;
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%ENDOXAN 500 MG%';

-- GASTROINTESTINAL
UPDATE productos SET precio_venta = 10000 WHERE UPPER(nombre) LIKE '%OMEPRAZOL%';

-- DERMATOLOGÍA
UPDATE productos SET precio_venta = 17060 WHERE UPPER(nombre) LIKE '%BIODERM%';
UPDATE productos SET precio_venta = 16960 WHERE UPPER(nombre) LIKE '%FENILSONE%';
UPDATE productos SET precio_venta = 12000 WHERE UPPER(nombre) LIKE '%KETOPROFENO GEL%';
UPDATE productos SET precio_venta = 9552  WHERE UPPER(nombre) LIKE '%GAMADERM%';
UPDATE productos SET precio_venta = 16766 WHERE UPPER(nombre) LIKE '%PROCICAR%';
UPDATE productos SET precio_venta = 9091  WHERE UPPER(nombre) LIKE '%MERTHIOLATE%';

-- VITAMINAS
UPDATE productos SET precio_venta = 5000  WHERE UPPER(nombre) LIKE '%CEBION%';

-- RESPIRATORIO
UPDATE productos SET precio_venta = 10000 WHERE UPPER(nombre) LIKE '%PREDNISOLONA%' AND precio_venta < 5000;

-- OTROS PRODUCTOS CON PRECIOS BAJOS (INVIMA genéricos)
UPDATE productos SET precio_venta = 5000  WHERE precio_venta < 3000 AND UPPER(nombre) NOT LIKE '%MUESTRA%';

select 'Actualización completada' as mensaje, count(*) as productos_actualizados from productos where precio_venta > 1000;
