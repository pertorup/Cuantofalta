// ============================================================================
// CONFIGURACIÓN GLOBAL Y DETECCIÓN DE IDIOMA
// ============================================================================

let lastDays = null;
let lastDate = null;
let lastEventName = null;

// Detectar idioma preferido del navegador
const userLang = navigator.language || navigator.userLanguage || 'es';
const preferredLang = userLang.startsWith('es') ? 'es' : 'en';

// ============================================================================
// DICCIONARIO DE TRADUCCIONES DE LA UI
// ============================================================================
const UI_TEXT = {
  es: {
    title: "¿Cuánto falta?",
    subtitle: "Elegí una fecha y mirá el tiempo restante.",
    selectDate: "Seleccionar fecha",
    selectDateLabel: "Seleccionar fecha objetivo",
    calculate: "Calcular",
    share: "Compartir",
    generateImage: "📸 Generar imagen",
    upcomingEvents: "🔜 Próximos eventos",
    daysRemaining: "días restantes",
    daysRemainingSingular: "día restante",
    loadingEvents: "Cargando eventos...",
    noEvents: "No hay eventos próximos",
    alertNoDate: "⚠️ Por favor, elegí una fecha",
    alertDatePassed: "⚠️ Esa fecha ya pasó",
    alertCalculateFirst: "⚠️ Primero calculá una fecha",
    shareTitle: "¿Cuánto falta?",
    shareText: (days, date, name) => {
      const eventName = name ? ` para ${name}` : '';
      return `⏳ Faltan ${days} ${days === 1 ? 'día' : 'días'}${eventName} (${date}). Miralo acá 👇`;
    },
    copied: "✅ Texto copiado para compartir 📋",
    imageGenerated: "✅ Imagen generada y descargada 📸",
    footerText: "Gratis • Sin registros • Funciona offline",
    viewSource: "Ver código en GitHub"
  },
  en: {
    title: "How long until?",
    subtitle: "Pick a date and see the countdown.",
    selectDate: "Select date",
    selectDateLabel: "Select target date",
    calculate: "Calculate",
    share: "Share",
    generateImage: "📸 Generate image",
    upcomingEvents: "🔜 Upcoming events",
    daysRemaining: "days remaining",
    daysRemainingSingular: "day remaining",
    loadingEvents: "Loading events...",
    noEvents: "No upcoming events",
    alertNoDate: "⚠️ Please select a date",
    alertDatePassed: "⚠️ That date has already passed",
    alertCalculateFirst: "⚠️ Calculate a date first",
    shareTitle: "How long until?",
    shareText: (days, date, name) => {
      const eventName = name ? ` for ${name}` : '';
      return `⏳ ${days} ${days === 1 ? 'day' : 'days'}${eventName} (${date}). Check it out 👇`;
    },
    copied: "✅ Text copied to clipboard 📋",
    imageGenerated: "✅ Image generated and downloaded 📸",
    footerText: "Free • No sign-up • Works offline",
    viewSource: "View code on GitHub"
  }
};

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Obtiene texto traducido según el idioma preferido
 * @param {string} key - Clave del texto en UI_TEXT
 * @param  {...any} args - Argumentos para funciones de traducción
 * @returns {string} Texto traducido
 */
function t(key, ...args) {
  const text = UI_TEXT[preferredLang][key];
  return typeof text === 'function' ? text(...args) : (text || key);
}

/**
 * Obtiene el nombre del evento traducido según el idioma
 * @param {object} event - Objeto de evento con name_es y name_en
 * @returns {string} Nombre traducido
 */
function getEventName(event) {
  if (!event) return '';
  return event[`name_${preferredLang}`] || event.name || '';
}

/**
 * Muestra un toast notification en lugar de alert()
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en ms (default: 3000)
 */
function showToast(message, duration = 3000) {
  let toast = document.getElementById('toast');
  
  // Crear el toast si no existe
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg text-sm opacity-0 transition-opacity duration-300 pointer-events-none z-50';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    document.body.appendChild(toast);
  }
  
  toast.innerText = message;
  toast.classList.remove('opacity-0');
  toast.style.pointerEvents = 'auto';
  
  // Ocultar después de la duración especificada
  setTimeout(() => {
    toast.classList.add('opacity-0');
    toast.style.pointerEvents = 'none';
  }, duration);
}

/**
 * Aplica todas las traducciones al DOM
 */
function applyTranslations() {
  // Actualizar título de la página
  document.title = `${t('title')} | Countdown para fechas importantes`;
  
  // Traducir elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = t(key);
    
    // Preservar iconos/spans si existen
    const icons = el.querySelectorAll('span');
    if (icons.length > 0 && key === 'upcomingEvents') {
      el.innerHTML = `<span>🔜</span><span>${translation}</span>`;
    } else if (key === 'generateImage') {
      el.innerHTML = `<span>📸</span><span>${translation.replace('📸', '').trim()}</span>`;
    } else {
      el.innerText = translation;
    }
  });
  
  // Traducir placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
  
  // Actualizar atributo lang del documento para SEO y accesibilidad
  document.documentElement.lang = preferredLang;
  
  // Actualizar meta descripción
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', 
      preferredLang === 'es' 
        ? 'Calculá cuánto falta para una fecha importante. Gratis, rápido y sin registros.'
        : 'Calculate how long until an important date. Free, fast, no sign-up required.'
    );
  }
  
  // Actualizar Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogTitle) ogTitle.setAttribute('content', t('title'));
  if (ogDesc) {
    ogDesc.setAttribute('content',
      preferredLang === 'es'
        ? 'Calculá cuánto falta para una fecha importante. Gratis y sin registros.'
        : 'Calculate how long until an important date. Free and no sign-up.'
    );
  }
}

/**
 * Formatea un número con separador de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
function formatNumber(num) {
  return num.toLocaleString(preferredLang === 'es' ? 'es-AR' : 'en-US');
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Carga datos desde la URL (parámetros event y date)
 */
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("event");
  const date = params.get("date");

  if (name && date) {
    document.getElementById("targetDate").value = date;
    lastEventName = name;
    calculate();
    document.title = `${t('title')} - ${name}`;
  }
}

/**
 * Calcula los días restantes hasta la fecha objetivo
 */
function calculate() {
  const input = document.getElementById("targetDate").value;
  
  if (!input) {
    showToast(t('alertNoDate'));
    return;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const target = new Date(input);
  target.setHours(0, 0, 0, 0);
  
  const diff = target - now;

  if (diff < 0) {
    showToast(t('alertDatePassed'));
    return;
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  // Actualizar UI
  const daysElement = document.getElementById("days");
  daysElement.innerText = formatNumber(days);
  
  // Actualizar texto de "días restantes" con plural correcto
  const daysRemainingEl = document.querySelector("#result .text-gray-600");
  if (daysRemainingEl) {
    daysRemainingEl.innerText = days === 1 
      ? t('daysRemainingSingular') 
      : t('daysRemaining');
  }
  
  document.getElementById("result").classList.remove("hidden");
  
  // Guardar estado para compartir/generar imagen
  lastDays = days;
  lastDate = input;

  // Animación de entrada
  const resultDiv = document.getElementById("result");
  resultDiv.classList.add('fade-in');
  setTimeout(() => resultDiv.classList.remove('fade-in'), 300);
}

/**
 * Comparte el resultado vía Web Share API o clipboard
 */
function shareResult() {
  if (lastDays === null) {
    showToast(t('alertCalculateFirst'));
    return;
  }

  const text = t('shareText', lastDays, lastDate, lastEventName);
  const url = window.location.href;
  const shareTitle = t('shareTitle');

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: text,
      url: url
    }).catch(err => {
      console.log('Share cancelled:', err);
    });
  } else {
    navigator.clipboard.writeText(`${text} ${url}`)
      .then(() => showToast(t('copied')))
      .catch(() => showToast(t('copied')));
  }
}

/**
 * Carga y muestra los próximos eventos desde events.json
 */
async function loadEvents() {
  const list = document.getElementById("eventsList");
  
  // Mostrar estado de carga
  list.innerHTML = `<li class="text-center text-gray-400 py-2">${t('loadingEvents')}</li>`;
  
  try {
    // Agregar timestamp para evitar caché
    const res = await fetch(`events.json?v=${Date.now()}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const events = await res.json();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filtrar eventos futuros y tomar los primeros 5
    const upcoming = events
      .filter(e => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      })
      .slice(0, 5);

    list.innerHTML = "";

    if (upcoming.length === 0) {
      list.innerHTML = `<li class="text-center text-gray-400 py-2">${t('noEvents')}</li>`;
      return;
    }

    upcoming.forEach(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const days = Math.ceil(
        (eventDate - now) / (1000 * 60 * 60 * 24)
      );

      const li = document.createElement("li");
      const eventName = getEventName(e);
      const encodedName = encodeURIComponent(eventName);
      
      li.innerHTML = `
        <a href="?event=${encodedName}&date=${e.date}"
           class="flex justify-between items-center bg-gray-100 rounded-xl px-4 py-3 hover:bg-indigo-50 hover:shadow-md transition group"
           title="${t('calculate')}">
          <span class="font-medium text-gray-700 group-hover:text-indigo-600 transition">
            ${eventName}
          </span>
          <span class="font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full text-xs">
            ${days} ${days === 1 ? (preferredLang === 'es' ? 'día' : 'day') : (preferredLang === 'es' ? 'días' : 'days')}
          </span>
        </a>
      `;
      list.appendChild(li);
    });
    
  } catch (err) {
    console.error("Error cargando events.json:", err);
    list.innerHTML = `<li class="text-center text-red-400 py-2">⚠️ Error cargando eventos</li>`;
  }
}

/**
 * Genera una imagen PNG con el resultado del countdown
 */
function generateImage() {
  if (lastDays === null) {
    showToast(t('alertCalculateFirst'));
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  // Fondo gradiente
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, "#4f46e5");  // indigo-600
  grad.addColorStop(1, "#7c3aed");  // purple-600
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Configurar texto
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Número grande de días
  ctx.font = "bold 200px sans-serif";
  ctx.fillText(formatNumber(lastDays), 540, 450);

  // Texto "días"
  ctx.font = "bold 72px sans-serif";
  const daysText = preferredLang === 'es' 
    ? (lastDays === 1 ? 'día' : 'días')
    : (lastDays === 1 ? 'day' : 'days');
  ctx.fillText(daysText, 540, 560);

  // Título de la app
  ctx.font = "bold 48px sans-serif";
  ctx.fillText(t('title'), 540, 660);
  
  // URL del sitio
  ctx.font = "italic 36px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText(window.location.hostname, 540, 730);
  
  // Si hay nombre de evento, agregarlo
  if (lastEventName) {
    ctx.font = "40px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    
    // Truncar nombre si es muy largo
    let eventNameDisplay = lastEventName;
    if (eventNameDisplay.length > 30) {
      eventNameDisplay = eventNameDisplay.substring(0, 27) + '...';
    }
    
    ctx.fillText(`para ${eventNameDisplay}`, 540, 800);
  }

  // Descargar la imagen
  try {
    const link = document.createElement("a");
    link.download = `cuanto-falta-${lastDays}-dias.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    
    showToast(t('imageGenerated'));
  } catch (err) {
    console.error("Error generando imagen:", err);
    showToast("⚠️ Error generando imagen");
  }
}

/**
 * Inicializa los event listeners de los botones
 */
function initEventListeners() {
  // Botón Calcular
  const btnCalculate = document.getElementById('btnCalculate');
  if (btnCalculate) {
    btnCalculate.addEventListener('click', calculate);
  }

  // Botón Compartir
  const btnShare = document.getElementById('btnShare');
  if (btnShare) {
    btnShare.addEventListener('click', shareResult);
  }

  // Botón Generar Imagen
  const btnGenerateImage = document.getElementById('btnGenerateImage');
  if (btnGenerateImage) {
    btnGenerateImage.addEventListener('click', generateImage);
  }

  // Permitir Enter en el input de fecha
  const targetDateInput = document.getElementById('targetDate');
  if (targetDateInput) {
    targetDateInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        calculate();
      }
    });
    
    // Limpiar resultado cuando cambia la fecha
    targetDateInput.addEventListener('change', () => {
      document.getElementById("result").classList.add("hidden");
      lastDays = null;
      lastDate = null;
    });
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Función principal de inicialización
 */
function init() {
  console.log(`🚀 Iniciando app (idioma: ${preferredLang})`);
  
  // Aplicar traducciones a la UI
  applyTranslations();
  
  // Configurar event listeners
  initEventListeners();
  
  // Cargar datos desde URL si existen
  loadFromUrl();
  
  // Cargar eventos próximos
  loadEvents();
  
  // Log de información para debugging
  console.log('📋 Info:', {
    language: preferredLang,
    browserLang: userLang,
    url: window.location.href
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}