# Checklist de Reestructuración y Optimización — Farmacy

- [x] Ejecutar la reestructuración física de archivos (eliminación de stubs y directorios vacíos)
    - [x] Eliminar directorios redundantes de backend (`clientes`, `compras`, `empleado`, `empleados`, `lotes`, `proveedores`, `reportes`, `sucursales`)
    - [x] Eliminar archivos `0 B` de backend (configs, jobs, middlewares, utils, controllers, services, schemas vacíos)
    - [x] Eliminar archivos `0 B` de frontend (`components/admin`, `components/ui`, `components/shared`, `components/tienda` vacíos)
- [x] Implementar ejecutables de automatización universal en la raíz (verificados)
    - [x] Crear `setup.bat` (instalación limpia de dependencias, prisma generate, push, seeds)
    - [x] Crear `run.bat` (arranque docker dev, espera de DB, inicio de servidores y apertura de navegador)
    - [x] Eliminar archivo obsoleto `start-all.bat`
- [ ] Realizar pruebas de verificación e integridad
    - [x] Ejecutar compilación de backend (`npm run build` o verificar compilación ts)
    - [x] Ejecutar compilación de frontend (`npm run build`)
    - [x] Probar arranque local básico
- [ ] Generar el informe final en `walkthrough.md`
