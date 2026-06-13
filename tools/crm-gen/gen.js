// Genera docs/ventas/CRM-ManualCore.xlsx — CRM ligero para el pipeline de Tania
const XLSX = require("xlsx");
const path = require("path");

const wb = XLSX.utils.book_new();

// ---------- Hoja 1: Guía ----------
const guia = XLSX.utils.aoa_to_sheet([
  ["CRM ManualCore — Guía de uso"],
  [],
  ["ETAPAS DEL PIPELINE (columna Etapa de la hoja Pipeline):"],
  ["1. Prospecto", "Identificado, sin contactar"],
  ["2. Contactado", "Primer mensaje/llamada enviado"],
  ["3. Reunión/Demo", "Demo agendada o realizada"],
  ["4. Piloto (7 días)", "Usando el producto con acompañamiento"],
  ["5. Carta firmada", "Comprometido a $49/mes al cierre del piloto"],
  ["6. Cliente $", "Pagando"],
  ["7. Perdido", "Anotar SIEMPRE la razón en Notas"],
  [],
  ["REGLAS:"],
  ["• Una fila por empresa/consultor en Pipeline; sus personas van en Contactos"],
  ["• Cada interacción se anota en Actividades (fecha + qué pasó + próximo paso)"],
  ["• Revisar cada lunes: toda fila debe tener 'Próximo paso' con fecha"],
  ["• Tipo: Consultor = canal (trae clientes) | Empresa = cliente final | Organismo = puerta"],
  [],
  ["Creado: 11 jun 2026 · Los prospectos precargados vienen de investigación verificada (docs/analysis/wf_rd.json)"],
]);
guia["!cols"] = [{ wch: 22 }, { wch: 70 }];
XLSX.utils.book_append_sheet(wb, guia, "Guía");

// ---------- Hoja 2: Pipeline ----------
const pipelineHeader = [
  "Nombre", "Tipo", "Etapa", "Prioridad", "Por qué encaja",
  "Próximo paso", "Fecha próx. paso", "Fuente/Web", "Notas",
];
const pipelineRows = [
  ["CompetISO / ANEIH", "Consultor-Canal", "1. Prospecto", "ALTA",
   "Concentra el 62% de las PyMEs certificadas ISO 9001 en RD; proyectos de ~7 meses donde la documentación es el cuello de botella",
   "EMAIL HOY: capacitacion@aneih.org.do (tel 809-560-2160 ext. 3) — Guion 6", "2026-06-12",
   "https://aneih.org.do/competiso/", ""],
  ["LEAN CONSULTING RD (Ing. Fausto Ramírez)", "Consultor-Canal", "1. Prospecto", "ALTA",
   "4 consultores, 140+ clientes, venden retainer mensual (Básico/Premium/Platino) — ManualCore se integra al plan; venderles MARGEN",
   "EMAIL HOY: info@leanconsultingrd.com — 'más clientes de su plan Platino con el mismo equipo'", "2026-06-12",
   "http://leanconsultingrd.com/", ""],
  ["SMG Consulting", "Consultor-Canal", "1. Prospecto", "ALTA",
   "Consultora ISO/OEA — expedientes de comercio exterior intensivos en procedimientos, a menudo bilingües",
   "Email gerencia@smgconsultingrd.com o WhatsApp +1-829-741-7372", "2026-06-13",
   "https://www.smgconsultingrd.com/", ""],
  ["Centros MIPYMES (PUCMM/INTEC/UASD)", "Organismo", "1. Prospecto", "ALTA",
   "Asesores generalistas SIN expertise documental acompañando ~250 mipymes del programa MICM-UE",
   "Llamar a Víctor Rodríguez, MICM (809) 567-7192 ext. 1041; escribir a Centro MIPYMES PUCMM o INTEC", "2026-06-14",
   "https://micm.gob.do/", ""],
  ["ClusterSoft", "Organismo", "1. Prospecto", "ALTA",
   "Asociación TIC beneficiaria del programa MICM-UE — 1 demo colectiva llega a decenas de empresas documentando para ISO 27001",
   "Formulario clustersoft.org.do + LinkedIn — proponer demo colectiva 30 min", "2026-06-14",
   "https://clustersoft.org.do/", ""],
  ["Major Logistics SRL", "Empresa-PILOTO", "1. Prospecto", "ALTA",
   "Logística recién certificada BASC (vence CADA AÑO) — dolor fresco y recurrente, fit $49/mes",
   "LinkedIn a gerencia: 'renueva tu BASC sin rehacer tus documentos'", "2026-06-16",
   "https://basc.org.do/9104/entrega-certificados-cnb25", ""],
  ["Global Pack (Grupo Multiquímica)", "Empresa-PILOTO", "1. Prospecto", "ALTA",
   "Manufactura de empaques con ISO 9001 vivo, re-auditorías anuales, expandible al grupo",
   "LinkedIn a calidad/operaciones: piloto 7 días", "2026-06-16",
   "https://globalpack.com.do/", ""],
  ["NAPCO DR (San Gregorio de Nigua)", "Empresa-PILOTO", "1. Prospecto", "MEDIA",
   "Zona franca electrónica, casa matriz USA exige docs bilingües ES/EN — tier $99-149",
   "LinkedIn al plant/quality manager LOCAL, pitch bilingüe", "2026-06-17",
   "https://revista.aenor.com/375/apuesta-por-la-calidad-en-napco.html", ""],
  ["Ravi Caribe", "Empresa-PILOTO", "1. Prospecto", "MEDIA",
   "Triple norma ISO 9001+14001+45001 = triple carga documental con auditorías cruzadas",
   "LinkedIn al responsable del Sistema Integrado de Gestión", "2026-06-17",
   "https://revista.aenor.com/384/posicion-de-referencia-en-republica-dominicana.html", ""],
  ["iterativo (Progressa Group)", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Odoo Silver, 85 referencias, localización dominicana oficial de Odoo — co-selling con 25 retail + 10 manufactura",
   "Formulario odoo.iterativo.io: 'docs listos antes del kickoff' (24 jun)", "2026-06-24",
   "https://www.odoo.com/partners/iterativo-1099255", ""],
  ["Grow IT", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Único Odoo GOLD de RD, 113 referencias — acuerdo de referidos = acceso a 113+ empresas digitalizándose",
   "Formulario growit.com.do tras validar pitch con iterativo", "2026-06-24",
   "https://www.odoo.com/partners/grow-it-123604", ""],
  ["FBrugal Consultores (Frank Brugal)", "Consultor-Canal", "1. Prospecto", "MEDIA",
   "38+ años, 500+ empresas en compliance/procesos — su práctica produce manuales que ManualCore genera",
   "Email fb.brugal@gmail.com o +1-829-342-4652", "2026-06-13",
   "https://fbrugalconsultores.com/", ""],
  ["Ymaya Lean Academy", "Consultor-Canal", "1. Prospecto", "MEDIA",
   "Academia de mejora continua — ManualCore como herramienta del currículo: canal que se renueva por cohorte",
   "Email Info@ymayaleanacademy.org · 809-807-6347 — proponer alianza academia-herramienta", "",
   "https://www.ymayaleanacademy.org/", ""],
  ["Consultores de Productividad (Santiago)", "Consultor-Canal", "1. Prospecto", "MEDIA",
   "Reingeniería en zona norte — abre el beachhead Santiago/zonas francas",
   "LinkedIn o formulario consultoresdeproductividad.com", "",
   "https://consultoresdeproductividad.com/", ""],
  ["datos.gob.do — XLSX mipymes certificadas", "Fuente de prospectos", "1. Prospecto", "MEDIA",
   "Dataset público de mipymes certificadas 2019-2025 — filtrar por actividad = lista de 50 empresas para la 2da ola",
   "Descargar y filtrar (1 hora máx, 15 jun)", "2026-06-15",
   "https://datos.gob.do/", ""],
  ["Programa MICM-UE (Fortalecimiento de la Calidad)", "Organismo", "1. Prospecto", "ALTA",
   "€11MM para certificar ~250 mipymes con consultores acreditados pagados por el programa — el estado financia la adopción",
   "Llamar (809) 567-7192 ext. 1041 — preguntar cómo se acreditan los consultores", "",
   "https://micm.gob.do/viceministerios/fomento-a-las-pymes/", ""],
  ["Qualitypoint Management School", "Consultor-Canal", "1. Prospecto", "ALTA",
   "Consultora/escuela de calidad con 15+ años en RD; forma a los quality managers del país",
   "Conectar en LinkedIn con dirección + proponer demo 20 min", "",
   "https://qualitypoint.com.do/", ""],
  ["Ecco Qualitá", "Consultor-Canal", "1. Prospecto", "MEDIA",
   "Consultora de calidad activa en RD",
   "LinkedIn + demo", "", "(buscar web/LinkedIn)", ""],
  ["Soluciones QES", "Consultor-Canal", "1. Prospecto", "MEDIA",
   "Consultora de calidad activa en RD",
   "LinkedIn + demo", "", "(buscar web/LinkedIn)", ""],
  ["ADOZONA", "Organismo", "1. Prospecto", "MEDIA",
   "Gremio de zonas francas (843 empresas); foco 2025-26 en dispositivos médicos con presión regulatoria de documentación",
   "Proponer charla/webinar para socios: 'Documenta tu planta antes de que te lo pida el comprador'", "",
   "https://adozona.org/", "Presidencia: Claudia Pellerano (desde ene 2025)"],
  ["EQA Dominicana", "Organismo", "1. Prospecto", "MEDIA",
   "Certificadora — no compra, pero refiere y valida; saber qué documentación ven fallar en auditorías",
   "Relación: pedir 30 min de conversación técnica", "",
   "https://eqa.com.do/", ""],
  ["AENOR Dominicana", "Organismo", "1. Prospecto", "BAJA",
   "Primera certificadora acreditada por ODAC en RD — misma jugada que EQA",
   "Relación institucional", "",
   "https://revista.aenor.com/381/odac-acredita-a-aenor-en-republica-dominicana.html", ""],
  ["INDOCAL", "Organismo", "1. Prospecto", "BAJA",
   "Normalizador + certificador estatal; certifica sector público (EGEHID, ITLA, Senado) → encaja con SOP Administrativo",
   "Relación institucional post-pilotos", "",
   "https://indocal.gob.do/", ""],
  ["CEO Consultoría", "Consultor-Canal (ERP)", "1. Prospecto", "ALTA",
   "Partner SAP Business One, se declara #1 en implementaciones RD/Caribe (oficinas en Naco). Cada implementación de ERP exige documentar procesos as-is/to-be — ManualCore se la acelera",
   "LinkedIn a dirección/consultores + guion ERP de GUIONES-CONTACTO.md", "",
   "https://ceo.do/sap-business-one/", ""],
  ["SITCORP", "Consultor-Canal (ERP)", "1. Prospecto", "ALTA",
   "Expertos en Dynamics 365, GP, AX y Odoo en RD — múltiples plataformas = múltiples clientes documentando procesos",
   "LinkedIn + guion ERP", "",
   "https://www.sitcorp.com/", ""],
  ["Grupo Inforum", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Implementa SAP Business One en RD/Centroamérica, acompaña de evaluación a operación",
   "LinkedIn + guion ERP", "",
   "https://grupoinforum.com/sap-business-one-republica-dominicana/", ""],
  ["DTS", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Partner SAP Business One, Ens. Paraíso, Santo Domingo",
   "LinkedIn + guion ERP", "",
   "https://dts.com.do/sap-business-one/", ""],
  ["SYCA", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Partner Odoo/Zoho con red en RD — analizan procesos del cliente para configurar el sistema",
   "LinkedIn + guion ERP", "",
   "https://syca.lat/partner-odoo/republica-dominicana/", ""],
  ["KCP Dynamics", "Consultor-Canal (ERP)", "1. Prospecto", "MEDIA",
   "Partner Microsoft Dynamics LATAM con cobertura RD",
   "LinkedIn + guion ERP", "",
   "https://kcpdynamics.com/erp-en-dominicana/", ""],
  ["Directorio partners Odoo RD", "Fuente de prospectos", "1. Prospecto", "MEDIA",
   "Lista oficial de partners Odoo en República Dominicana — mina de implementadores adicionales",
   "Revisar el directorio y agregar 3-5 al pipeline", "",
   "https://www.odoo.com/partners/country/dominican-republic-60", ""],
  ["(Piloto manufactura — por identificar)", "Empresa", "1. Prospecto", "ALTA",
   "Ideal: PyME de manufactura local o zona franca pequeña, en proceso de certificación",
   "Pedir referido a los consultores del pipeline", "", "", ""],
  ["(Piloto servicios/admin — por identificar)", "Empresa", "1. Prospecto", "ALTA",
   "Ideal: empresa de servicios formalizándose — valida el SOP Administrativo",
   "Pedir referido / red personal de Tania", "", "", ""],
  ["(Piloto vía consultor — por identificar)", "Empresa", "1. Prospecto", "ALTA",
   "Cliente activo de un consultor aliado — valida el canal B2B2B",
   "Sale de la primera demo a consultor que funcione", "", "", ""],
];
const pipeline = XLSX.utils.aoa_to_sheet([pipelineHeader, ...pipelineRows]);
pipeline["!cols"] = [
  { wch: 38 }, { wch: 16 }, { wch: 15 }, { wch: 10 }, { wch: 60 },
  { wch: 50 }, { wch: 14 }, { wch: 45 }, { wch: 40 },
];
XLSX.utils.book_append_sheet(wb, pipeline, "Pipeline");

// ---------- Hoja 3: Contactos ----------
const contactos = XLSX.utils.aoa_to_sheet([
  ["Nombre", "Empresa/Org", "Cargo", "LinkedIn", "Email", "Teléfono", "Cómo lo conocí", "Notas"],
  ["(ejemplo) María Pérez", "Consultora X", "Directora", "linkedin.com/in/...", "", "", "Referido de...", "Borrar esta fila"],
]);
contactos["!cols"] = [
  { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 30 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 40 },
];
XLSX.utils.book_append_sheet(wb, contactos, "Contactos");

// ---------- Hoja 4: Actividades ----------
const actividades = XLSX.utils.aoa_to_sheet([
  ["Fecha", "Empresa/Org", "Tipo (llamada/email/LinkedIn/demo/reunión)", "Qué pasó", "Próximo paso", "Fecha próx. paso"],
  ["2026-06-11", "(ejemplo)", "nota", "CRM creado con prospectos de la investigación de mercado", "Llamar al MICM ext. 1041", "2026-06-12"],
]);
actividades["!cols"] = [
  { wch: 12 }, { wch: 30 }, { wch: 32 }, { wch: 55 }, { wch: 40 }, { wch: 14 },
];
XLSX.utils.book_append_sheet(wb, actividades, "Actividades");

const out = path.join(__dirname, "..", "..", "docs", "ventas", "CRM-ManualCore.xlsx");
XLSX.writeFile(wb, out);
console.log("OK:", out);
