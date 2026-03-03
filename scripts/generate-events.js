const fs = require("fs");
const https = require("https");
const ical = require("node-ical");

// ============================================================================
// CONFIGURACIÓN DE FUENTES ICS
// ============================================================================
const SOURCES = [
  {
    name: "Feriados Argentina",
    url: "https://www.officeholidays.com/ics-clean/argentina",
    type: "holiday"
  },
  {
    name: "Feriados Globales",
    url: "https://www.officeholidays.com/ics-clean/world",
    type: "holiday"
  }
];

// ============================================================================
// DICCIONARIO DE TRADUCCIONES (Inglés → Español)
// Agrega más entradas según necesites
// ============================================================================
const EVENT_TRANSLATIONS = {
  // Festivos generales
  "New Year's Day": "Año Nuevo",
  "New Year": "Año Nuevo",
  "Christmas Day": "Navidad",
  "Christmas Eve": "Nochebuena",
  "Epiphany": "Epifanía",
  "Good Friday": "Viernes Santo",
  "Easter Sunday": "Domingo de Pascua",
  "Easter Monday": "Lunes de Pascua",
  "Labour Day": "Día del Trabajador",
  "Labor Day": "Día del Trabajador",
  "Independence Day": "Día de la Independencia",
  "Carnival": "Carnaval",
  "Memorial Day": "Día de los Caídos",
  "Thanksgiving Day": "Día de Acción de Gracias",
  "Halloween": "Halloween",
  "All Saints' Day": "Día de Todos los Santos",
  "All Souls' Day": "Día de los Fieles Difuntos",
  "Immaculate Conception": "Inmaculada Concepción",
  "Assumption of Mary": "Asunción de la Virgen",
  "Corpus Christi": "Corpus Christi",
  
  // Días internacionales
  "International Women's Day": "Día Internacional de la Mujer",
  "World Health Day": "Día Mundial de la Salud",
  "Earth Day": "Día de la Tierra",
  "World Environment Day": "Día Mundial del Medio Ambiente",
  "Human Rights Day": "Día de los Derechos Humanos",
  "World AIDS Day": "Día Mundial del SIDA",
  "International Children's Day": "Día Internacional del Niño",
  "World Teacher's Day": "Día Mundial del Docente",
  
  // Eventos deportivos y culturales
  "Olympic Games Opening Ceremony": "Apertura Juegos Olímpicos",
  "Olympic Games Closing Ceremony": "Clausura Juegos Olímpicos",
  "FIFA World Cup": "Copa Mundial de Fútbol",
  "Super Bowl": "Super Bowl",
  "Champions League Final": "Final de la Champions League",
  
  // Otros comunes
  "Valentine's Day": "Día de San Valentín",
  "Mother's Day": "Día de la Madre",
  "Father's Day": "Día del Padre",
  "Black Friday": "Viernes Negro",
  "Cyber Monday": "Cyber Monday"
};

// ============================================================================
// EVENTOS FIJOS PERSONALIZADOS
// Incluye ambas versiones de nombre (es/en) para consistencia
// ============================================================================
const FIXED_EVENTS = [
  { 
    name: "Navidad", 
    name_es: "Navidad", 
    name_en: "Christmas Day", 
    date: "2026-12-25", 
    type: "holiday" 
  },
  { 
    name: "Año Nuevo", 
    name_es: "Año Nuevo", 
    name_en: "New Year's Day", 
    date: "2027-01-01", 
    type: "holiday" 
  },
  { 
    name: "Mundial de Fútbol 2026", 
    name_es: "Mundial de Fútbol 2026", 
    name_en: "FIFA World Cup 2026", 
    date: "2026-06-11", 
    type: "sports" 
  }
];

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Normaliza un nombre de evento: elimina espacios extra, trim, etc.
 */
function normalizeEventName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')           // múltiple espacio → uno solo
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // eliminar caracteres zero-width
    .replace(/'/g, "'");            // normalizar comillas tipográficas
}

/**
 * Traduce un nombre de evento si existe traducción disponible
 * @param {string} name - Nombre original del evento
 * @param {string} targetLang - Idioma destino ('es' o 'en')
 * @returns {string} Nombre traducido o original si no hay traducción
 */
function translateEventName(name, targetLang = 'es') {
  if (!name) return '';
  
  // Si el idioma destino es inglés, retornar el nombre original
  if (targetLang === 'en') {
    return name;
  }
  
  // Buscar traducción directa
  if (EVENT_TRANSLATIONS[name]) {
    return EVENT_TRANSLATIONS[name];
  }
  
  // Búsqueda case-insensitive como fallback
  const lowerName = name.toLowerCase();
  for (const [enName, esName] of Object.entries(EVENT_TRANSLATIONS)) {
    if (enName.toLowerCase() === lowerName) {
      return esName;
    }
  }
  
  // Si no hay traducción, retornar el nombre original
  return name;
}

/**
 * Formatea una fecha a string YYYY-MM-DD de forma segura
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split("T")[0];
}

/**
 * Fetch de contenido ICS desde URL usando HTTPS
 */
function fetchICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CuantoFaltaBot/1.0)' },
      timeout: 15000 
    }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    })
    .on("error", reject)
    .on("timeout", () => {
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/**
 * Procesa un evento ICS y lo convierte al formato estandarizado
 */
function processICSEvent(e, sourceType, targetLang = 'es') {
  if (!e || e.type !== "VEVENT" || !e.start) {
    return null;
  }
  
  const startDate = new Date(e.start);
  
  // Validar que sea una fecha válida
  if (isNaN(startDate.getTime())) {
    return null;
  }
  
  const originalName = normalizeEventName(e.summary);
  
  if (!originalName) {
    return null;
  }
  
  return {
    name: originalName,                           // Nombre original (fallback)
    name_es: translateEventName(originalName, 'es'),
    name_en: originalName,                        // Inglés = nombre original
    date: formatDate(startDate),
    type: sourceType,
    source: "ics"
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
(async () => {
  console.log("🚀 Iniciando generación de events.json...");
  
  const events = [...FIXED_EVENTS];
  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(now.getFullYear() + 2); // Limitar a eventos de los próximos 2 años
  
  console.log(`📅 Rango de fechas: ${formatDate(now)} a ${formatDate(maxDate)}`);
  
  for (const source of SOURCES) {
    try {
      console.log(`📥 Descargando: ${source.name} (${source.url})`);
      
      const icsData = await fetchICS(source.url);
      const parsed = ical.parseICS(icsData);
      
      let addedCount = 0;
      
      Object.values(parsed).forEach(e => {
        const event = processICSEvent(e, source.type);
        
        if (event && event.date) {
          const eventDate = new Date(event.date);
          
          // Filtrar por rango de fechas y evitar duplicados básicos
          if (eventDate >= now && eventDate <= maxDate) {
            events.push(event);
            addedCount++;
          }
        }
      });
      
      console.log(`✅ ${source.name}: +${addedCount} eventos agregados`);
      
    } catch (err) {
      console.warn(`⚠️ Error procesando ${source.url}: ${err.message}`);
      // Continuar con la siguiente fuente en lugar de fallar todo el script
    }
  }
  
  // ========================================================================
  // POST-PROCESAMIENTO: Deduplicación y ordenamiento
  // ========================================================================
  
  console.log("🔄 Eliminando duplicados y ordenando...");
  
  // Clave única: combinación de fecha + nombre normalizado (case-insensitive)
  const unique = Array.from(
    new Map(
      events.map(e => {
        const key = `${e.date}-${e.name.toLowerCase().trim()}`;
        return [key, e];
      })
    ).values()
  );
  
  // Ordenar por fecha ascendente, luego por nombre
  unique.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.name.localeCompare(b.name);
  });
  
  // ========================================================================
  // ESCRITURA DEL ARCHIVO JSON
  // ========================================================================
  
  const outputPath = "events.json";
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2), "utf-8");
    
    console.log("\n" + "=".repeat(50));
    console.log(`✨ events.json generado exitosamente`);
    console.log(`📊 Total de eventos únicos: ${unique.length}`);
    console.log(`📁 Archivo guardado en: ${outputPath}`);
    console.log("=".repeat(50));
    
    // Mostrar preview de los primeros eventos
    console.log("\n🔍 Preview de los primeros 5 eventos:");
    unique.slice(0, 5).forEach((e, i) => {
      console.log(`  ${i+1}. [${e.date}] ${e.name_es} (${e.type})`);
    });
    
  } catch (writeErr) {
    console.error(`❌ Error escribiendo ${outputPath}: ${writeErr.message}`);
    process.exit(1);
  }
  
})();