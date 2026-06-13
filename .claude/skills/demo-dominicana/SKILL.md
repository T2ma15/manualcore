---
name: demo-dominicana
description: Fábrica de datos de demostración para ManualCore. Usar cuando se necesite poblar un tenant de demo con empresas dominicanas ficticias realistas (para demos de venta, pruebas E2E o screenshots). Genera tenants, usuarios, sesiones, documentos y audit trail creíbles.
---

# Demo Dominicana — datos de demostración

## Objetivo
Cuando se demuestre ManualCore a un piloto o consultor, NUNCA mostrar pantallas vacías.
Mostrar una empresa como la suya, ya funcionando.

## Empresas ficticias estándar

### 1. Industrias Quisqueya SRL (manufactura)
- Planta de envases plásticos en zona franca de Haina, ~45 empleados
- `industry_profile: manufacturing`, locale es
- Usuarios: Gerente de Planta (admin), Supervisor de Producción (process_owner),
  Jefa de Calidad (approver + qa), 2 operadores
- Procesos típicos: extrusión de preformas, soplado de botellas, inspección visual,
  empaque y paletizado — con specs reales (temperaturas, presiones, torques),
  EPP, parámetros críticos
- Documentos: 2 SOP Mfg aprobados, 1 en borrador, 1 flujograma, 1 análisis de riesgos,
  varios print_events y entradas de audit_log

### 2. Servicios Caribe Consulting (administrativo)
- Firma de servicios contables/administrativos en Santo Domingo, ~12 empleados
- `industry_profile: admin_services`, locale es
- Usuarios: Socia Directora (admin), Gerente de Operaciones (process_owner),
  Contadora Senior (approver)
- Procesos típicos: aprobación de compras, onboarding de empleado, facturación
  a clientes, cierre contable mensual
- Documentos: 2 SOP Admin (1 aprobado, 1 under_review), 1 análisis de riesgos

## Reglas de los datos
- Nombres dominicanos creíbles (mezcla de apellidos comunes: Rodríguez, Peña,
  Mateo, Féliz, Tavárez...) — NUNCA personas reales
- Specs técnicas plausibles (ej: torque 450N ±20, temperatura 165°C ±5)
- Fechas coherentes: documentos creados en las últimas 8 semanas, review_due a 12 meses
- audit_log poblado con la secuencia real: extracciones → confirmaciones →
  transiciones de estado → prints
- Numeración correcta: PRD-MFG0001, ADM-FIN0001, etc.
- Los datos se insertan vía SQL respetando RLS (usar service_role en seeds) o
  vía la API de la app cuando exista

## Uso típico
1. "Pobla el tenant demo" → genera el SQL/script de seed completo de ambas empresas
2. "Demo para [tipo de cliente]" → elige la empresa que se parezca al prospecto
3. Antes de cada demo: verificar que los documentos abren y el dashboard tiene números
