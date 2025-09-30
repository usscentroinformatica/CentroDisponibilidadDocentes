import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const DisponibilidadForm = ({ docente }) => {
  const [diasSeleccionados, setDiasSeleccionados] = useState(new Set());
  const [rangosHoras, setRangosHoras] = useState({}); // { "Lunes": { inicio: "9:00 AM", fin: "12:00 PM" } }

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const toggleDia = (dia) => {
    const nuevoSet = new Set(diasSeleccionados);
    if (nuevoSet.has(dia)) {
      nuevoSet.delete(dia);
      setRangosHoras((prev) => {
        const nuevo = { ...prev };
        delete nuevo[dia];
        return nuevo;
      });
    } else {
      nuevoSet.add(dia);
      setRangosHoras((prev) => ({ ...prev, [dia]: { inicio: "", fin: "" } }));
    }
    setDiasSeleccionados(nuevoSet);
  };

  // Función para convertir "hh:mm AM/PM" a minutos totales (para validación)
  const horaToMinutos = (horaStr) => {
    if (!horaStr) return -1;
    const [time, ampm] = horaStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const actualizarRango = (dia, tipo, valorCompleto) => {
    setRangosHoras((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [tipo]: valorCompleto }
    }));
  };

  // Manejador para actualizar hora (combina hh:mm y AM/PM)
  const handleHoraChange = (dia, tipo, hhmm, ampm) => {
    const valorCompleto = `${hhmm} ${ampm}`;
    actualizarRango(dia, tipo, valorCompleto);
  };

  const guardarDisponibilidades = async () => {
    if (diasSeleccionados.size === 0) {
      return alert("Selecciona al menos un día");
    }

    let todosValidos = true;
    for (let dia of diasSeleccionados) {
      const { inicio, fin } = rangosHoras[dia] || {};
      if (!inicio || !fin) {
        todosValidos = false;
        break;
      }
      if (horaToMinutos(inicio) >= horaToMinutos(fin)) {
        todosValidos = false;
        break;
      }
    }

    if (!todosValidos) {
      return alert("Completa los rangos de horas para todos los días seleccionados (y asegúrate de que 'Desde' sea antes de 'Hasta')");
    }

    for (let dia of diasSeleccionados) {
      const { inicio, fin } = rangosHoras[dia];
      await addDoc(collection(db, "disponibilidades"), {
        nombre: docente.nombre,
        dni: docente.dni,
        dia,
        horaInicio: inicio,
        horaFin: fin,
        creado: new Date()
      });
    }

    alert(`¡Registrados ${diasSeleccionados.size} días de disponibilidad! ✅`);
    setDiasSeleccionados(new Set());
    setRangosHoras({});
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">🕒 Registrar Horarios</h2>
        <p className="text-gray-600">Selecciona días y define rangos (Lunes - Viernes)</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-2 text-center">Docente: <span className="text-blue-900">{docente.nombre}</span> (DNI: {docente.dni})</p>
      </div>

      {/* Checkboxes para días - Centrado extra */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-blue-900 mb-3 text-center">📅 Selecciona días:</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 justify-items-center mx-auto max-w-md">
          {diasSemana.map((dia) => (
            <label key={dia} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition w-full max-w-xs justify-center">
              <input
                type="checkbox"
                checked={diasSeleccionados.has(dia)}
                onChange={() => toggleDia(dia)}
                className="mr-3 w-4 h-4 text-blue-900"
              />
              <span className="font-medium text-gray-700">{dia}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Listado dinámico de rangos - Centrado */}
      {diasSeleccionados.size > 0 && (
        <div className="mb-6 mx-auto max-w-2xl">
          <label className="block text-sm font-semibold text-blue-900 mb-3 text-center">⏰ Rangos de horas por día (12h con AM/PM):</label>
          <div className="space-y-4">
            {Array.from(diasSeleccionados).map((dia) => {
              const inicio = rangosHoras[dia]?.inicio || "";
              const fin = rangosHoras[dia]?.fin || "";
              const [inicioHHMM] = inicio.split(' ') || [""];
              const [finHHMM] = fin.split(' ') || [""];
              const [inicioAMPM] = inicio.split(' ').slice(1) || ["AM"];
              const [finAMPM] = fin.split(' ').slice(1) || ["AM"];

              return (
                <div key={dia} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mx-auto max-w-lg">
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-blue-900 mr-2">📍</span>
                    <strong className="text-blue-900">{dia}:</strong>
                  </div>
                  <div className="flex justify-center gap-4 items-end">
                    <div className="flex flex-col flex-1 max-w-xs">
                      <label className="text-xs font-medium text-gray-600 mb-1 text-center">Desde</label>
                      <div className="flex gap-1 justify-center">
                        <input
                          type="text"
                          placeholder="hh:mm"
                          value={inicioHHMM}
                          onChange={(e) => handleHoraChange(dia, "inicio", e.target.value, inicioAMPM)}
                          pattern="^([1-9]|1[0-2]):[0-5][0-9]$"
                          className="border-2 border-blue-200 p-2 rounded-lg w-20 text-sm focus:border-blue-900 focus:outline-none transition"
                          title="Formato: 1-12:00-59"
                        />
                        <select
                          value={inicioAMPM}
                          onChange={(e) => handleHoraChange(dia, "inicio", inicioHHMM, e.target.value)}
                          className="border-2 border-blue-200 p-2 rounded-lg text-sm focus:border-blue-900 focus:outline-none transition"
                        >
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                      </div>
                    </div>
                    <span className="text-gray-500 font-semibold self-center text-lg">—</span>
                    <div className="flex flex-col flex-1 max-w-xs">
                      <label className="text-xs font-medium text-gray-600 mb-1 text-center">Hasta</label>
                      <div className="flex gap-1 justify-center">
                        <input
                          type="text"
                          placeholder="hh:mm"
                          value={finHHMM}
                          onChange={(e) => handleHoraChange(dia, "fin", e.target.value, finAMPM)}
                          pattern="^([1-9]|1[0-2]):[0-5][0-9]$"
                          className="border-2 border-blue-200 p-2 rounded-lg w-20 text-sm focus:border-blue-900 focus:outline-none transition"
                          title="Formato: 1-12:00-59"
                        />
                        <select
                          value={finAMPM}
                          onChange={(e) => handleHoraChange(dia, "fin", finHHMM, e.target.value)}
                          className="border-2 border-blue-200 p-2 rounded-lg text-sm focus:border-blue-900 focus:outline-none transition"
                        >
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {inicio && fin && (
                    <p className="text-sm text-blue-700 mt-2 font-medium bg-white px-3 py-1 rounded inline-block text-center block w-full">
                      Vista previa: {inicio} - {fin}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={guardarDisponibilidades}
        className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 w-full font-semibold transition shadow-lg disabled:opacity-50"
        disabled={diasSeleccionados.size === 0}
      >
        💾 Guardar Horarios
      </button>
    </div>
  );
};

export default DisponibilidadForm;