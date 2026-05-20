# Checklist de Reestructuración y Optimización — Farmacy

- [/] Ejecutar la reestructuración física de archivos (eliminación de stubs y directorios vacíos)
    - [ ] Eliminar directorios redundantes de backend (`clientes`, `compras`, `empleado`, `empleados`, `lotes`, `proveedores`, `reportes`, `sucursales`)
    - [ ] Eliminar archivos `0 B` de backend (configs, jobs, middlewares, utils, controllers, services, schemas vacíos)
    - [ ] Eliminar archivos `0 B` de frontend (`components/admin`, `components/ui`, `components/shared`, `components/tienda` vacíos)
- [ ] Implementar ejecutables de automatización universal en la raíz
    - [ ] Crear `setup.bat` (instalación limpia de dependencias, prisma generate, push, seeds)
    - [ ] Crear `run.bat` (arranque docker dev, espera de DB, inicio de servidores y apertura de navegador)
    - [ ] Eliminar archivo obsoleto `start-all.bat`
- [ ] Realizar pruebas de verificación e integridad
    - [ ] Ejecutar compilación de backend (`npm run build` o verificar compilación ts)
    - [ ] Ejecutar compilación de frontend (`npm run build`)
    - [ ] Probar arranque local básico
- [ ] Generar el informe final en `walkthrough.md`
