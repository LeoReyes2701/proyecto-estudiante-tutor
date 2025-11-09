// src/components/schedule/consultarHorario.js
document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("horariosList");

  try {
    const res = await fetch("http://localhost:3000/schedules");
    if (!res.ok) throw new Error("Error al consultar horarios");
    const horarios = await res.json();

    list.innerHTML = ""; // limpiar antes de renderizar

    if (horarios.length === 0) {
      list.innerHTML = `<div class="alert alert-info">No hay horarios registrados aún.</div>`;
      return;
    }

    horarios.forEach(h => {
      const card = document.createElement("div");
      card.className = "card shadow-sm schedule-card mb-3";
      card.innerHTML = `
        <h5 class="day-title fw-bold mb-3">
          <div class="d-flex align-items-center">
            <span>${h.day.charAt(0).toUpperCase() + h.day.slice(1)}</span>
          </div>
          <span class="day-hours">${h.start} - ${h.end}</span>
        </h5>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Error:", err);
    list.innerHTML = `<div class="alert alert-danger">No se pudo cargar los horarios.</div>`;
  }
});
