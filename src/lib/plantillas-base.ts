import type { ContenidoAuditoria, ItemAuditoria } from "./utils";
import type { Database } from "./supabase/database.types";

type Area = Database["public"]["Enums"]["area_auditoria"];
export type PlantillaBase = { nombre: string; area: Area; descripcion: string; contenido: ContenidoAuditoria };

// Atajos para escribir los puntos
const e = (id: string, texto: string, ayuda?: string): ItemAuditoria => ({ id, texto, tipo: "escala", ayuda });
const s = (id: string, texto: string, ayuda?: string): ItemAuditoria => ({ id, texto, tipo: "sino", ayuda });
const t = (id: string, texto: string, ayuda?: string): ItemAuditoria => ({ id, texto, tipo: "texto", ayuda });
const m = (id: string, texto: string, unidad: string, min: number | null, max: number | null, ayuda?: string): ItemAuditoria =>
  ({ id, texto, tipo: "medida", unidad, min, max, ayuda });

/** Biblioteca de partida de la consultora. Se instala desde Biblioteca y luego es editable. */
export const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    nombre: "Primera visita · radiografía del negocio",
    area: "equipo",
    descripcion: "La primera hora en el local: cifras básicas, lo que cuenta la propiedad, herramientas que usan y necesidades detectadas. Solo puntúan las herramientas de control.",
    contenido: { secciones: [
      { titulo: "El negocio en cifras", items: [
        m("pv1", "Plazas (aforo de sala y terraza)", "plazas", null, null, "Cuenta mesas y sillas; separa terraza si la hay."),
        m("pv2", "Comensales al día (media)", "comensales", null, null, "Pregunta un día flojo y uno fuerte, y anota la media."),
        m("pv3", "Ticket medio", "€", null, null, "Ventas sin IVA ÷ tickets. Si no lo saben, dato del TPV de la última semana."),
        m("pv4", "Días de apertura a la semana", "días", null, null),
        m("pv5", "Personas en plantilla", "personas", null, null, "Sala, cocina y extras de fin de semana."),
        t("pv6", "Horarios, turnos y servicios", "Comidas, cenas, desayunos, para llevar, delivery."),
      ] },
      { titulo: "Lo que cuenta la propiedad", items: [
        t("pv7", "¿Qué le quita el sueño?", "Anota sus palabras, sin interpretar."),
        t("pv8", "¿Qué ha intentado ya que no ha funcionado?"),
        t("pv9", "Objetivo en los próximos 6 meses", "Que lo concrete: margen, ventas, horas de trabajo, vender el negocio…"),
        t("pv10", "Tiempo y presupuesto que puede dedicar a los cambios"),
      ] },
      { titulo: "Herramientas y datos disponibles", items: [
        s("pv11", "Tiene TPV con informe de ventas por artículo", "Anota marca y modelo en la nota."),
        s("pv12", "Tiene escandallos de los platos"),
        s("pv13", "Hace inventario al menos una vez al mes"),
        s("pv14", "Conoce su food cost real"),
        s("pv15", "Guarda las facturas de proveedores ordenadas o digitalizadas"),
        t("pv16", "Proveedores principales y cómo pide", "Quién, qué, cada cuánto, por qué canal."),
      ] },
      { titulo: "Primera impresión y necesidades", items: [
        t("pv17", "Fachada, entrada y sala al llegar"),
        t("pv18", "Cocina en el primer vistazo"),
        t("pv19", "Necesidades detectadas: lo que hay que hacer", "Lista corta y priorizada. Será la base de la propuesta."),
      ] },
    ] },
  },
  {
    nombre: "Cocina · producción y servicio",
    area: "cocina",
    descripcion: "Organización de partidas, producción, tiempos de pase y control de mermas. Mejor durante un servicio.",
    contenido: { secciones: [
      { titulo: "Organización y producción", items: [
        e("co1", "Partidas definidas con un responsable por puesto", "¿Saben todos qué hacen y dónde? ¿Hay solapes en hora punta?"),
        e("co2", "Mise en place lista antes del servicio", "Llega 30 minutos antes de abrir y mira qué falta."),
        e("co3", "La producción diaria se calcula con previsión, no a ojo", "Pregunta cuánto se prepara y cómo lo deciden."),
        e("co4", "Fichas técnicas disponibles y usadas en la partida"),
        e("co5", "Gramajes medidos: báscula en la partida y raciones homogéneas", "Pesa 3 raciones del mismo plato y compara."),
      ] },
      { titulo: "Servicio y pase", items: [
        e("co6", "Comandas claras y comunicación fluida con sala"),
        m("co7", "Tiempo de salida de plato en hora punta", "min", null, 15, "Cronometra 3 mesas desde que entra la comanda hasta que sale el plato."),
        e("co8", "Emplatado homogéneo, con foto de referencia"),
        e("co9", "Orden y limpieza durante el servicio"),
      ] },
      { titulo: "Control y mermas", items: [
        e("co10", "Mermas registradas a diario con motivo"),
        s("co11", "El aceite de fritura se mide con medidor de compuestos polares"),
        m("co12", "Compuestos polares de la freidora", "%", null, 24, "Por encima del 24-25 % el aceite debe cambiarse."),
        e("co13", "Elaboraciones etiquetadas: nombre, fecha y caducidad"),
        e("co14", "Equipos en buen estado y con mantenimiento"),
      ] },
    ] },
  },
  {
    nombre: "Cámaras, almacén y stock",
    area: "almacen",
    descripcion: "Temperaturas, orden, rotación y nivel de stock. Lleva un termómetro sonda.",
    contenido: { secciones: [
      { titulo: "Temperaturas", items: [
        m("ca1", "Cámara de refrigeración", "°C", 0, 4, "Mide con tu termómetro, no con el display."),
        m("ca2", "Cámara o vitrina de pescado", "°C", 0, 2),
        m("ca3", "Congelador", "°C", -30, -18),
        s("ca4", "Registro diario de temperaturas al día y firmado"),
      ] },
      { titulo: "Orden y rotación", items: [
        e("ca5", "Cada producto tiene ubicación fija y rotulada"),
        s("ca6", "FIFO/FEFO visible: lo que caduca antes, delante"),
        s("ca7", "Nada en el suelo: estanterías o palets a 15 cm"),
        s("ca8", "Sin productos caducados", "Revisa 10 productos al azar."),
        s("ca9", "Producto abierto tapado y etiquetado"),
        s("ca10", "Separación de crudo y cocinado, y de alérgenos"),
      ] },
      { titulo: "Nivel de stock", items: [
        e("ca11", "Stock mínimo y máximo definido para los productos clave"),
        m("ca12", "Días de cobertura de pescado y marisco fresco", "días", null, 2),
        e("ca13", "Inventario mensual valorado"),
        t("ca14", "Productos sobrestockados o sin rotación", "Dinero parado: anota qué y cuánto."),
      ] },
    ] },
  },
  {
    nombre: "Recepción de mercancía y compras",
    area: "compras",
    descripcion: "Cómo se pide, cómo se recibe y cómo se controla el precio de compra.",
    contenido: { secciones: [
      { titulo: "Recepción", items: [
        s("re1", "Hay responsable y horario de recepción"),
        s("re2", "Se comprueban peso y unidades contra el albarán"),
        m("re3", "Temperatura de llegada de refrigerados", "°C", null, 4, "Mide un producto de la última entrega."),
        s("re4", "Se revisan aspecto, calibre y caducidad"),
        s("re5", "Las incidencias se anotan en el albarán y se reclaman"),
      ] },
      { titulo: "Compras y precios", items: [
        s("re6", "Los pedidos se hacen por escrito, con hoja de pedido"),
        e("re7", "Se pide según stock mínimo, no a ojo"),
        s("re8", "Precios pactados por escrito con los proveedores principales"),
        e("re9", "Se comparan precios al menos cada trimestre"),
        s("re10", "Las facturas se cotejan con los albaranes"),
        m("re11", "Proveedores activos", "proveedores", null, null),
        t("re12", "Proveedores o productos a renegociar"),
      ] },
    ] },
  },
  {
    nombre: "Sala y servicio",
    area: "sala",
    descripcion: "El servicio de sala de principio a fin. Observa sin intervenir durante al menos una hora punta.",
    contenido: { secciones: [
      { titulo: "Antes del servicio", items: [
        s("sa1", "Briefing con el equipo: platos del día, agotados, reservas"),
        s("sa2", "Checklist de apertura hecha"),
        e("sa3", "Mesas montadas de forma homogénea"),
        s("sa4", "Plano de mesas y rangos asignados"),
      ] },
      { titulo: "Durante el servicio", items: [
        m("sa5", "Tiempo hasta tomar nota", "min", null, 5, "Desde que el cliente se sienta."),
        e("sa6", "Conocen la carta, el producto y los alérgenos", "Pregunta por un plato y un alérgeno."),
        e("sa7", "Venta sugerida: bebida, entrante, postre y café"),
        e("sa8", "Atienden las mesas sin que haya que llamarles"),
        s("sa9", "Comandas sin errores", "Revisa 5 tickets contra lo servido."),
        e("sa10", "Coordinación de tiempos con cocina"),
      ] },
      { titulo: "Cierre", items: [
        m("sa11", "Tiempo para cobrar desde que se pide la cuenta", "min", null, 5),
        e("sa12", "Despedida e invitación a volver"),
        s("sa13", "Cierre de caja cuadrado"),
      ] },
    ] },
  },
  {
    nombre: "Barra y bebidas",
    area: "sala",
    descripcion: "Barra, cerveza, vino y café: margen alto y muchas fugas pequeñas.",
    contenido: { secciones: [
      { titulo: "Barra", items: [
        e("ba1", "Orden y limpieza de la barra"),
        e("ba2", "Stock de barra repuesto antes del servicio"),
        s("ba3", "Invitaciones y consumo del personal anotados"),
        s("ba4", "Roturas y botellas abiertas controladas"),
      ] },
      { titulo: "Cerveza y café", items: [
        s("ba5", "Tirador de cerveza limpio, con limpieza semanal registrada"),
        e("ba6", "Caña bien servida: vaso frío, dos dedos de espuma"),
        e("ba7", "Café: molienda ajustada, cafetera limpia, taza caliente"),
      ] },
      { titulo: "Vino", items: [
        s("ba8", "Carta de vinos actualizada y con precios"),
        m("ba9", "Referencias de vino en carta", "referencias", null, null),
        e("ba10", "Vino por copa: botellas abiertas fechadas y con rotación"),
        e("ba11", "Recomendación de vino al cliente"),
      ] },
    ] },
  },
  {
    nombre: "Carta y oferta",
    area: "carta",
    descripcion: "Tamaño, estructura, precios y rentabilidad de la carta. Pide la carta y las ventas por plato.",
    contenido: { secciones: [
      { titulo: "Estructura", items: [
        m("cr1", "Platos en carta (sin bebidas)", "platos", null, 30, "Más de 30 referencias suele desbordar a una cocina pequeña."),
        e("cr2", "Tamaño de carta adecuado a la cocina y al aforo"),
        e("cr3", "Precios equilibrados dentro de cada sección"),
        e("cr4", "Platos rentables destacados en la zona de más lectura"),
        e("cr5", "Descripciones que venden: producto, origen y elaboración"),
      ] },
      { titulo: "Rentabilidad", items: [
        s("cr6", "Todos los platos están escandallados"),
        m("cr7", "Food cost medio de la carta", "%", null, 32),
        s("cr8", "Se analizan las ventas por plato cada trimestre"),
        e("cr9", "Precios coherentes con el ticket medio objetivo"),
      ] },
      { titulo: "Información al cliente", items: [
        s("cr10", "Alérgenos indicados y carta de alérgenos firmada"),
        s("cr11", "Precios con IVA incluido"),
        e("cr12", "Estado físico de la carta: limpia, sin tachones"),
      ] },
    ] },
  },
  {
    nombre: "Equipo y organización",
    area: "equipo",
    descripcion: "Organización del personal, coste laboral, formación y clima.",
    contenido: { secciones: [
      { titulo: "Organización", items: [
        s("eq1", "Organigrama y funciones de cada puesto por escrito"),
        e("eq2", "Cuadrante ajustado a la previsión de ventas"),
        m("eq3", "Coste de personal sobre ventas (labour cost)", "%", null, 35),
        s("eq4", "Registro de jornada al día", "Es obligatorio."),
        e("eq5", "Briefing o reunión breve antes de cada servicio"),
      ] },
      { titulo: "Personas", items: [
        s("eq6", "Manual de bienvenida para quien se incorpora"),
        e("eq7", "Formación en el último año"),
        m("eq8", "Bajas voluntarias en los últimos 12 meses", "personas", null, null),
        e("eq9", "Clima del equipo", "Observación y conversación con dos personas del equipo, por separado."),
        t("eq10", "Necesidades de formación detectadas"),
      ] },
    ] },
  },
  {
    nombre: "Cliente misterioso",
    area: "experiencia_cliente",
    descripcion: "La visita como un cliente más, de la puerta a la cuenta. Se rellena al salir.",
    contenido: { secciones: [
      { titulo: "Llegada", items: [
        e("cm1", "Fachada, iluminación y limpieza de la entrada"),
        m("cm2", "Espera hasta ser atendido", "min", null, 2),
        e("cm3", "Bienvenida: saludo, sonrisa y acomodo"),
      ] },
      { titulo: "En la mesa", items: [
        e("cm4", "Mesa, menaje y carta limpios y en buen estado"),
        e("cm5", "Recomendación del camarero"),
        m("cm6", "Llegada de las bebidas", "min", null, 5),
        m("cm7", "Llegada del primer plato", "min", null, 15),
        e("cm8", "Temperatura y presentación de los platos"),
        e("cm9", "Sabor y punto"),
        e("cm10", "Retirada de platos y ofrecimiento de postre y café"),
      ] },
      { titulo: "Salida", items: [
        m("cm11", "Tiempo para cobrar", "min", null, 5),
        e("cm12", "Cuenta correcta y clara"),
        e("cm13", "Baños limpios y repuestos"),
        e("cm14", "Despedida"),
        t("cm15", "El mejor y el peor momento de la visita"),
      ] },
    ] },
  },
  {
    nombre: "APPCC y seguridad alimentaria",
    area: "appcc",
    descripcion: "Documentación obligatoria y prácticas higiénicas en cocina. Lo que miraría una inspección.",
    contenido: { secciones: [
      { titulo: "Documentación", items: [
        s("ap1", "Plan APPCC actualizado"),
        s("ap2", "Registro de temperaturas al día"),
        s("ap3", "Plan de limpieza y desinfección firmado"),
        s("ap4", "Control de plagas con empresa autorizada y certificados"),
        s("ap5", "Trazabilidad: albaranes y etiquetas de lote guardados"),
        s("ap6", "Carta de alérgenos firmada y a disposición del cliente"),
        s("ap7", "Formación de manipuladores acreditada"),
      ] },
      { titulo: "En cocina", items: [
        s("ap8", "Lavamanos con agua caliente, jabón y papel"),
        s("ap9", "Termómetro sonda disponible y usado"),
        m("ap10", "Mantenimiento en caliente", "°C", 65, null),
        s("ap11", "Tablas y cuchillos separados por colores"),
        s("ap12", "Descongelación en cámara, nunca a temperatura ambiente"),
        s("ap13", "Cubos de basura con tapa y pedal"),
        s("ap14", "Uniforme limpio, pelo recogido y sin joyas"),
      ] },
    ] },
  },
  {
    nombre: "Control de gestión y costes",
    area: "compras",
    descripcion: "Qué números controla la propiedad y con qué frecuencia. Pide la cuenta de resultados y el último inventario.",
    contenido: { secciones: [
      { titulo: "Control diario y mensual", items: [
        s("cg1", "Cierre de caja diario cuadrado y archivado"),
        s("cg2", "Ventas diarias registradas por canal (sala, barra, para llevar)"),
        s("cg3", "Cuenta de resultados mensual"),
        s("cg4", "Inventario mensual valorado"),
        s("cg5", "Escandallos actualizados en los últimos 3 meses"),
        e("cg6", "Control de horas y horas extra"),
        s("cg7", "Presupuesto anual de ventas y gastos"),
      ] },
      { titulo: "Indicadores", items: [
        m("cg8", "Food cost del último mes", "%", null, 32),
        m("cg9", "Prime cost (materia prima + personal)", "%", null, 65),
        m("cg10", "EBITDA sobre ventas", "%", 12, null),
        t("cg11", "Indicadores que la propiedad mira cada semana"),
      ] },
    ] },
  },
];
