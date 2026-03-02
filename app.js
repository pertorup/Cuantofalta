let lastDays = null;
let lastDate = null;

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("event");
  const date = params.get("date");

  if (name && date) {
    document.getElementById("targetDate").value = date;
    calculate();
    document.title = `¿Cuánto falta para ${name}?`;
  }
}

loadFromUrl();

function calculate() {
  const input = document.getElementById("targetDate").value;
  if (!input) {
    alert("Elegí una fecha");
    return;
  }

  const now = new Date();
  const target = new Date(input);
  const diff = target - now;

  if (diff < 0) {
    alert("La fecha ya pasó");
    return;
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  document.getElementById("days").innerText = days;
  document.getElementById("result").classList.remove("hidden");

  lastDays = days;
  lastDate = input;
}

function shareResult() {
  if (lastDays === null) {
    alert("Primero calculá una fecha");
    return;
  }

  const text = `⏳ Faltan ${lastDays} días para esta fecha (${lastDate}). Miralo acá 👇`;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: "¿Cuánto falta?",
      text: text,
      url: url
    });
  } else {
    navigator.clipboard.writeText(`${text} ${url}`);
    alert("Texto copiado para compartir 📋");
  }
}

async function loadEvents() {
  try {
    const res = await fetch("events.json");
    const events = await res.json();

    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.date) > now)
      .slice(0, 5);

    const list = document.getElementById("eventsList");
    list.innerHTML = "";

    upcoming.forEach(e => {
      const days = Math.ceil(
        (new Date(e.date) - now) / (1000 * 60 * 60 * 24)
      );

      const li = document.createElement("li");
      li.innerHTML = `
        <a href="?event=${encodeURIComponent(e.name)}&date=${e.date}"
           class="flex justify-between bg-gray-100 rounded-xl px-3 py-2 hover:bg-gray-200 transition">
          <span>${e.name}</span>
          <span class="font-semibold">${days} días</span>
        </a>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error cargando events.json", err);
  }
}

loadEvents();

function generateImage() {
  if (lastDays === null) {
    alert("Primero calculá una fecha");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");

  // fondo gradiente
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, "#4f46e5");
  grad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // texto grande
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  ctx.font = "bold 180px sans-serif";
  ctx.fillText(lastDays, 540, 480);

  ctx.font = "bold 64px sans-serif";
  ctx.fillText("días", 540, 580);

  ctx.font = "40px sans-serif";
  ctx.fillText("¿Cuánto falta?", 540, 650);
  ctx.fillText(window.location.hostname, 540, 720);

  const link = document.createElement("a");
  link.download = "cuanto-falta.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}