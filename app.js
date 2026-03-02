let lastDays = null;
let lastDate = null;

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