// Constantes de producto compartidas (bilingüe-ready: por ahora ES).

export type Locale = "es" | "en";

export const INDUSTRIES = [
  {
    code: "manufacturing",
    label: "Manufactura",
    description: "Planta, producción, operaciones físicas",
    icon: "🏭",
  },
  {
    code: "admin_services",
    label: "Administrativo / Servicios",
    description: "Oficina, procesos administrativos, servicios",
    icon: "🏢",
  },
] as const;

export type IndustryCode = (typeof INDUSTRIES)[number]["code"];

// Qué templates aplican a cada industria en el card flow.
// (Los templates viven en la tabla document_templates; esto es solo el filtro de UI.)
export const TEMPLATES_BY_INDUSTRY: Record<IndustryCode, string[]> = {
  manufacturing: [
    "sop_mfg",
    "flowchart",
    "risk_analysis",
    "quality_policy",
    "quality_objectives",
    "qms_scope",
    "master_list",
  ],
  admin_services: [
    "sop_admin",
    "flowchart",
    "risk_analysis",
    "quality_policy",
    "quality_objectives",
    "qms_scope",
    "master_list",
  ],
};
