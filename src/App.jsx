import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [docente, setDocente] = useState({ nombre: "", curso: "" });
  const [horarioTexto, setHorarioTexto] = useState(""); // Manual: ej. "Lunes 9:00 AM - 12:00 PM, Martes 2:00 PM - 5:00 PM"
  const [mostrarLista, setMostrarLista] = useState(false);
  const [dniAdminInput, setDniAdminInput] = useState(""); // Para verificación admin en ver lista
  const [disponibilidades, setDisponibilidades] = useState([]);

  // Verificar DNI admin para mostrar lista
  const handleVerDisponibilidad = async () => {
    if (!dniAdminInput) {
      alert("Ingresa tu DNI de administrador");
      return;
    }
    try {
      const q = query(collection(db, "admins"), where("dni", "==", dniAdminInput));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setMostrarLista(!mostrarLista);
        setDniAdminInput(""); // Limpia input
      } else {
        alert("DNI de administrador no válido");
      }
    } catch (error) {
      alert("Error al verificar DNI admin");
    }
  };

  // Guardar disponibilidad manual
  const guardarDisponibilidades = async () => {
    if (!docente.nombre || !docente.curso || !horarioTexto.trim()) {
      alert("Ingresa nombre, curso y describe tu horario manualmente");
      return;
    }

    try {
      await addDoc(collection(db, "disponibilidades"), {
        nombre: docente.nombre,
        curso: docente.curso,
        descripcion: horarioTexto.trim(), // Todo manual como string
        creado: new Date()
      });
      alert(`¡Horario registrado para ${docente.curso}! ✅`);
      setHorarioTexto(""); // Limpia
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  // Listener para lista en tiempo real
  useEffect(() => {
    if (mostrarLista) {
      const unsub = onSnapshot(collection(db, "disponibilidades"), (snapshot) => {
        setDisponibilidades(snapshot.docs.map((doc) => doc.data()));
      });
      return () => unsub();
    }
  }, [mostrarLista]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">👨‍🏫 Panel de Disponibilidad</h1>
          <p className="text-gray-600">Gestiona horarios de docentes</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="DNI Admin para ver lista"
            value={dniAdminInput}
            onChange={(e) => setDniAdminInput(e.target.value)}
            className="border-2 border-blue-200 p-2 rounded-lg w-32 focus:border-blue-900"
          />
          <button
            onClick={handleVerDisponibilidad}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
          >
            {mostrarLista ? "Ocultar" : "Ver"} 📊
          </button>
        </div>
      </div>

      {/* Formulario Único: Nombre, Curso y Horario Manual */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">🕒 Registro de Horarios</h2>
        
        {/* Inputs Nombre y Curso */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={docente.nombre}
            onChange={(e) => setDocente({ ...docente, nombre: e.target.value })}
            className="border-2 border-blue-200 p-3 rounded-lg w-full focus:border-blue-900 focus:outline-none transition"
          />
          <input
            type="text"
            placeholder="Curso"
            value={docente.curso}
            onChange={(e) => setDocente({ ...docente, curso: e.target.value })}
            className="border-2 border-blue-200 p-3 rounded-lg w-full focus:border-blue-900 focus:outline-none transition"
          />
        </div>

        <div className="mb-4 text-center">
          <p className="text-sm font-semibold text-blue-800">Docente: {docente.nombre} | Curso: {docente.curso}</p>
        </div>

        {/* Input Manual para Horario */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-blue-900 mb-2 text-center">📅 Describe tu horario manualmente:</label>
          <textarea
            placeholder="Escribe tu horario aquí..."
            value={horarioTexto}
            onChange={(e) => setHorarioTexto(e.target.value)}
            rows={3}
            className="border-2 border-blue-200 p-3 rounded-lg w-full focus:border-blue-900 focus:outline-none transition resize-none"
          />
          <p className="text-xs text-gray-600 mt-2 text-center">
            Ejemplo: Lunes 9:00 AM - 12:00 PM, Miércoles 2:00 PM - 5:00 PM, Viernes 10:00 AM - 1:00 PM
          </p>
        </div>

        <button
          onClick={guardarDisponibilidades}
          className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 w-full font-semibold transition shadow-lg disabled:opacity-50"
          disabled={!docente.nombre || !docente.curso || !horarioTexto.trim()}
        >
          💾 Guardar Horario
        </button>
      </div>

      {/* Lista de Disponibilidades (solo si admin y visible) */}
      {mostrarLista && (
        <div className="bg-white shadow-xl rounded-2xl p-6 max-w-full">
          <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">📋 Disponibilidades</h2>
          <ul className="space-y-3">
            {disponibilidades.map((d, i) => (
              <li key={i} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-blue-900 font-bold">{d.nombre}</strong>
                  <span className="text-sm text-blue-700">📚 {d.curso}</span>
                </div>
                <p className="text-lg font-semibold text-blue-800">{d.descripcion}</p>
                <p className="text-xs text-gray-500 mt-1">Registrado: {d.creado?.toDate().toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          {disponibilidades.length === 0 && (
            <p className="text-center text-gray-500 text-lg">No hay registros aún 😊</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;