const fs = require("fs");
const https = require("https");
const ical = require("node-ical");

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

// eventos deportivos fijos (no dependen de ICS)
const FIXED_EVENTS = [
  { name: "Navidad", date: "2026-12-25", type: "holiday" },
  { name: "Año Nuevo", date: "2027-01-01", type: "holiday" },
  { name: "Mundial de Fútbol 2026", date: "2026-06-11", type: "sports" }
];

function fetchICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

(async () => {
  const events = [...FIXED_EVENTS];
  const now = new Date();

  for (const source of SOURCES) {
    try {
      const icsData = await fetchICS(source.url);
      const parsed = ical.parseICS(icsData);

      Object.values(parsed).forEach(e => {
        if (e.type === "VEVENT") {
          const date = new Date(e.start);
          if (date > now) {
            events.push({
              name: e.summary,
              date: date.toISOString().split("T")[0],
              type: source.type
            });
          }
        }
      });
    } catch (err) {
      console.error("Error leyendo", source.url, err.message);
    }
  }

  // eliminar duplicados por nombre + fecha
  const unique = Array.from(
    new Map(events.map(e => [`${e.name}-${e.date}`, e])).values()
  );

  unique.sort((a, b) => new Date(a.date) - new Date(b.date));

  fs.writeFileSync("events.json", JSON.stringify(unique, null, 2));
  console.log("events.json generado con", unique.length, "eventos");
})();