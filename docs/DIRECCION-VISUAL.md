# ManualCore — Dirección Visual (aprobada 14 jun 2026)

**Impresión:** premium, formal, íntegro, profesional. Editorial-corporativo (consultora + papelería de lujo). NO app web flashy. La autoridad nace de RESTAR. Regla rectora: si un elemento no reduce la carga cognitiva del usuario intimidado por la documentación, sobra.

## Tipografía
- **Display (títulos, nombres de documento, encabezados):** Fraunces (Google Fonts, variable opsz). Alt "Garamond puro": EB Garamond.
- **Cuerpo / UI / botones / tablas:** Hanken Grotesk (Google Fonts). Alt: IBM Plex Sans.
- **Datos/números/versiones/fechas:** cifras tabulares o IBM Plex Mono.
- Nunca Inter/Roboto/Arial/system como tipografía de marca (firma del look "LLM glorificado"). Arial solo para documentos impresos (DOCX).
- Escala modular 1.25: 13/16/20/25/31/39/49/61px. Line-height 1.55–1.65 en SOPs; 1.15–1.25 en títulos serif. Tracking −1 a −2% en títulos; +4 a +8% en labels MAYÚSCULAS pequeñas.

## Paleta (regla 70/22/6/2)
| Rol | HEX | Uso |
|---|---|---|
| Papel (fondo, ~70%) | `#FAF8F4` | Fondo principal. Crema cálido — antídoto al blanco frío/IA |
| Superficie de documento | `#FFFFFF` | Solo el documento generado (el héroe), flota sobre el papel |
| Tinta navy (marca, ~22%) | `#0F2238` | Títulos serif, header/footer, estructura |
| Texto principal | `#1F2933` | Carbón cálido (no negro puro, no gris frío) |
| Texto secundario | `#5B6573` | Metadatos, ayudas, labels |
| Hairlines/bordes | `#E7E2D9` | Líneas 1px (separar con líneas, NO sombras) |
| Acción / acento (~6%) | `#0F5C4E` | Verde pino patrimonial — REEMPLAZA el teal brillante #1ABC9C |
| Sello oficial (~2%) | `#B08D57` | Latón, solo sellos "aprobado"/oficial, como joya |
| Crítico/error | `#B3261E` | Seguridad/CCP. El color SIEMPRE significa |
| Advertencia | `#946200` | Ámbar discreto |

## Layout / presentación
- Rejilla 8px estricta. Radios 4–6px (nunca píldoras por todos lados).
- Separar con hairlines de 1px, NO con sombras (sombras grandes = plantilla).
- Mucho aire vía interlineado y márgenes, no añadiendo gris.
- Divulgación progresiva: solo lo necesario para el paso actual; las funciones de poder aparecen cuando se necesitan (clave para el usuario intimidado).
- El documento es el héroe: limpio, jerarquizado, navegable, con trazabilidad visible (versión, fecha, responsables, criterios, criticidades). La autoridad se muestra, no se promete ("ISO-ready" prohibido).
- Iconos: monolineales finos monocromos en la UI. Nunca emojis como iconos.
- La jerarquía la hace la tipografía, no el color ni los iconos.

## Evitar (señales de "hecho por IA")
Inter/Roboto/Arial · morado/violeta/gradientes morado-azul · teal brillante #1ABC9C dominante · borde de color 3-4px en un lado de tarjetas · glassmorphism · 3 feature-cards idénticas con icono arriba · sombras/glow pesados · gris frío #6B7280 dominante · blanco puro frío de fondo · emojis como iconos · sellos "ISO-ready" decorativos · shadcn sin modificar.

Fuente: investigación 14 jun 2026 (`docs/analysis/direccion_visual.json`).
