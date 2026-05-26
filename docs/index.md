# Documentation module

This folder is the living documentation hub for Farmacy (SGF).

## How to use
- Update these docs whenever a module moves from planned to delivered.
- Keep decisions in ADRs so future changes are traceable.
- Reference real files and scripts, not aspirational behavior.

## Map
- Architecture overview: [docs/architecture.md](architecture.md)
- Decisions (ADRs): [docs/adr/](adr/)
  - [ADR-0001](adr/0001-env-source-of-truth-and-ports.md): Standardized ports and environmental variables.
  - [ADR-0002](adr/0001-env-source-of-truth-and-ports.md#adr-0002-colombian-regulatory-invima-cum-data-model): Colombian INVIMA/CUM regulatory compliance.
  - [ADR-0003](adr/0001-env-source-of-truth-and-ports.md#adr-0003-payment-gateways-wompi-stripe-mercadopago): Payment gateways (Wompi, Stripe, MercadoPago).
- Phase tracking: [docs/phase-0-checklist.md](phase-0-checklist.md)
- Work log: [docs/worklog.md](worklog.md)

## Estado del proyecto (2026-05-26)

| Métrica | Valor |
|---|---|
| Backend TypeScript 6.0 | ✅ 0 errores |
| Frontend TypeScript 6.0 | ✅ 0 errores |
| Tests | ✅ 462/462 pasan (27 archivos) |
| Cobertura | 83.7% statements |
| Módulos backend | 18 activos |
| Páginas frontend | 40+ (tienda + admin + auth) |
| Pasarelas de pago | Wompi, Stripe, MercadoPago, Efectivo |
| Docker services | PostgreSQL 15, Redis 7, pgAdmin |
| Vite | 6.4.2 |
