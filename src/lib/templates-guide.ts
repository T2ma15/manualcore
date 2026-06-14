// Guía explicativa por tipo de documento, para un usuario SIN experiencia
// en documentación. Resuelve: "no sé qué es esto, qué darte, ni qué obtendré".
// (Puntos 5 y 6 de la retroalimentación de Tania.)

// Nombres correctos por código (fuente de verdad para mostrar, evita el
// mojibake de la BD y sirve para el cambio de idioma ES/EN).
export const TEMPLATE_NAMES: Record<string, { es: string; en: string }> = {
  sop_mfg: { es: "SOP — Manufactura", en: "SOP — Manufacturing" },
  sop_admin: { es: "SOP — Administrativo", en: "SOP — Administrative" },
  flowchart: { es: "Flujograma de Proceso", en: "Process Flowchart" },
  risk_analysis: { es: "Análisis de Riesgos", en: "Risk Analysis" },
  quality_policy: { es: "Política de Calidad", en: "Quality Policy" },
  quality_objectives: { es: "Objetivos de Calidad", en: "Quality Objectives" },
  qms_scope: { es: "Alcance del SGC", en: "QMS Scope" },
  master_list: { es: "Lista Maestra de Documentos", en: "Master Document List" },
};

export type TemplateGuide = {
  que_es: string;
  objetivo: string;
  datos_clave: string[];
  resultado: string;
  ejemplo: string;
  diferencia?: string;
};

export const TEMPLATE_GUIDE: Record<string, TemplateGuide> = {
  sop_mfg: {
    que_es: "El instructivo formal de cómo se hace un proceso de producción, paso a paso.",
    objetivo:
      "Que cualquier operador haga el proceso igual, seguro y con la calidad correcta — y que el conocimiento no se pierda cuando alguien se va.",
    datos_clave: [
      "Las operaciones en orden",
      "Materiales e insumos con cantidades",
      "Parámetros críticos y sus límites (ej: torque, temperatura, fuerza)",
      "Seguridad y equipo de protección (EPP)",
      "Quién es el responsable del proceso",
    ],
    resultado:
      "Un documento Word formal con el membrete de tu empresa, numeración automática y bloque de aprobación, listo para usar en planta.",
    ejemplo:
      "En el ensamble de tapa usamos una riveteadora neumática. El operador coloca la tapa, alinea los dos agujeros y aplica el remache con fuerza de 450 N. Usamos remaches de aluminio. Después se inspecciona que no haya rebaba. Lo hace Juan en la línea 3 y la pieza pasa a empaque.",
  },
  sop_admin: {
    que_es: "El instructivo formal de un proceso de oficina o servicio, paso a paso.",
    objetivo:
      "Que el proceso administrativo se haga igual siempre, con los controles correctos, sin depender de una sola persona.",
    datos_clave: [
      "Las actividades en orden",
      "Quién hace cada actividad (roles)",
      "Documentos de entrada y de salida",
      "Controles y puntos de verificación",
      "Quién es el responsable del proceso",
    ],
    resultado:
      "Un documento Word formal con membrete, numeración y bloque de aprobación.",
    ejemplo:
      "Para aprobar una compra, el solicitante llena el formulario de requisición. El jefe de área lo revisa y aprueba si es menor a RD$50,000. Compras cotiza con 3 proveedores y emite la orden. Contabilidad registra la factura.",
  },
  flowchart: {
    que_es: "Un diagrama visual con cajas y flechas que muestra el flujo del proceso.",
    objetivo:
      "Ver de un vistazo cómo fluye el proceso, dónde hay decisiones y qué pasa si algo sale mal.",
    datos_clave: [
      "Los pasos en orden",
      "Dónde hay decisiones (sí / no)",
      "Qué pasa al final (sigue otro proceso o termina)",
    ],
    resultado: "Un diagrama listo para abrir en cualquier navegador.",
    ejemplo:
      "Recibe la pieza, la inspecciona. ¿Pasa la inspección? Si sí, la empaca. Si no, la envía a retrabajo. Al final pasa al almacén.",
  },
  risk_analysis: {
    que_es: "Una tabla que identifica qué puede salir mal en un proceso y cómo se controla.",
    objetivo:
      "Anticipar los riesgos del proceso, evaluar qué tan probables y graves son, y definir cómo reducirlos — algo que la norma ISO 9001 espera.",
    datos_clave: [
      "Qué riesgos tiene el proceso",
      "La causa de cada riesgo",
      "La consecuencia si ocurre",
      "Qué controles existen hoy",
      "Qué tan probable y qué tan grave es (del 1 al 5)",
    ],
    resultado:
      "Una tabla Excel con cada riesgo, su puntuación y las acciones para reducirlo.",
    ejemplo:
      "En el ensamble, si la fuerza del remache sale baja, la tapa se suelta (consecuencia: producto defectuoso que llega al cliente). Hoy lo controlamos con el sensor de la máquina. Es poco probable pero muy grave.",
  },
  quality_policy: {
    que_es:
      "Una declaración corta y oficial del compromiso de tu empresa con la calidad, firmada por la dirección.",
    objetivo:
      "Decir, en pocas frases, qué le promete tu empresa a sus clientes en cuanto a calidad. Es la 'sombrilla' de todo el sistema.",
    datos_clave: [
      "A qué se dedica tu empresa",
      "Qué le prometes al cliente (calidad, tiempo, seguridad)",
      "Compromiso de mejorar y cumplir los requisitos",
    ],
    resultado: "Un documento Word de una página, listo para firmar por la dirección.",
    diferencia:
      "La POLÍTICA es la promesa general (\"nos comprometemos a entregar productos seguros y a tiempo\"). Los OBJETIVOS son las metas concretas y medibles para cumplir esa promesa (\"reducir defectos a menos de 2% este año\"). Política = qué prometemos · Objetivos = las metas que lo miden.",
    ejemplo:
      "Somos una empresa de empaques plásticos comprometida con entregar productos seguros, a tiempo y conforme a los requisitos de nuestros clientes, mejorando continuamente nuestros procesos.",
  },
  quality_objectives: {
    que_es: "Las metas concretas y medibles de calidad para un período.",
    objetivo:
      "Convertir la promesa de la política en metas que se puedan medir y revisar.",
    datos_clave: [
      "Qué quieres mejorar",
      "La meta medible (un número)",
      "El plazo",
      "El responsable",
    ],
    resultado: "Un documento con tus objetivos, metas, plazos y responsables.",
    diferencia:
      "Los OBJETIVOS son las metas medibles (\"reducir devoluciones a 2%\"). La POLÍTICA es la promesa general que estos objetivos ayudan a cumplir. Si la política es el destino, los objetivos son los kilómetros que mides en el camino.",
    ejemplo:
      "Reducir las devoluciones de cliente de 5% a 2% antes de diciembre (responsable: jefe de calidad). Entregar el 95% de los pedidos a tiempo.",
  },
  qms_scope: {
    que_es: "La definición de qué partes de tu empresa cubre el sistema de calidad.",
    objetivo:
      "Dejar claro qué procesos, productos y sitios entran en el sistema de gestión de calidad — y qué queda fuera, con su justificación.",
    datos_clave: [
      "A qué se dedica tu empresa",
      "Qué procesos y productos incluyes",
      "Qué excluyes y por qué",
      "Las ubicaciones (plantas, oficinas)",
    ],
    resultado: "Un documento corto que define el alcance del sistema.",
    ejemplo:
      "El sistema de gestión de calidad aplica a la fabricación y empaque de envases plásticos en nuestra planta de Haina. No incluye la distribución, que es tercerizada.",
  },
  master_list: {
    que_es:
      "El índice de todos tus documentos: cuáles existen, su versión vigente y cuándo se revisan.",
    objetivo:
      "Tener en un solo lugar el control de todos los documentos — es lo PRIMERO que pide un auditor.",
    datos_clave: ["Se arma automáticamente con los documentos que vas creando"],
    resultado:
      "Una tabla Excel con todos tus documentos: código, versión, estado y próxima revisión.",
    ejemplo:
      "No necesitas escribir nada aquí — esta lista se genera sola a partir de los documentos que ya creaste.",
  },
};
