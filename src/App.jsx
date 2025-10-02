import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as XLSX from 'xlsx';
import { Trash2, RefreshCw } from 'lucide-react';

function App() {
  const [docente, setDocente] = useState({ nombre: "", curso: "" });
  const [horarioTexto, setHorarioTexto] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [dniAdminInput, setDniAdminInput] = useState("");
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [registroExistente, setRegistroExistente] = useState(null);

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
        setDniAdminInput("");
      } else {
        alert("DNI de administrador no válido");
      }
    } catch (error) {
      alert("Error al verificar DNI admin");
    }
  };

  // Buscar si el docente ya tiene un registro
  const buscarRegistroExistente = async () => {
    if (!docente.nombre || !docente.curso) return;
    
    try {
      const q = query(
        collection(db, "disponibilidades"),
        where("nombre", "==", docente.nombre),
        where("curso", "==", docente.curso)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const registro = querySnapshot.docs[0];
        setRegistroExistente({
          id: registro.id,
          ...registro.data()
        });
        setHorarioTexto(registro.data().descripcion);
      } else {
        setRegistroExistente(null);
        setHorarioTexto("");
      }
    } catch (error) {
      console.error("Error al buscar registro:", error);
    }
  };

  // Ejecutar búsqueda cuando cambien nombre o curso
  useEffect(() => {
    if (docente.nombre && docente.curso) {
      buscarRegistroExistente();
    } else {
      setRegistroExistente(null);
      setHorarioTexto("");
    }
  }, [docente.nombre, docente.curso]);

  // Guardar o actualizar disponibilidad
  const guardarDisponibilidades = async () => {
    if (!docente.nombre || !docente.curso || !horarioTexto.trim()) {
      alert("Ingresa nombre, curso y describe tu horario manualmente");
      return;
    }

    try {
      if (registroExistente) {
        // ACTUALIZAR registro existente
        await updateDoc(doc(db, "disponibilidades", registroExistente.id), {
          descripcion: horarioTexto.trim(),
          actualizado: new Date()
        });
        alert(`¡Horario actualizado para ${docente.curso}! 🔄`);
      } else {
        // CREAR nuevo registro
        await addDoc(collection(db, "disponibilidades"), {
          nombre: docente.nombre,
          curso: docente.curso,
          descripcion: horarioTexto.trim(),
          creado: new Date(),
          actualizado: new Date()
        });
        alert(`¡Horario registrado para ${docente.curso}! ✅`);
      }
      
      // Limpiar formulario después de guardar
      setDocente({ nombre: "", curso: "" });
      setHorarioTexto("");
      setRegistroExistente(null);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  // Eliminar registro (solo admin)
  const eliminarRegistro = async (registroId, nombreDocente) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${nombreDocente}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "disponibilidades", registroId));
      alert("Registro eliminado exitosamente ✅");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (disponibilidades.length === 0) {
      alert("No hay datos para exportar 😊");
      return;
    }

    const dataForExcel = disponibilidades.map((d) => ({
      "👨‍🏫 Nombre": d.nombre,
      "📚 Curso": d.curso,
      "🕒 Descripción del Horario": d.descripcion,
      "📅 Fecha de Registro": d.creado?.toDate().toLocaleDateString('es-ES') || 'N/A',
      "🔄 Última Actualización": d.actualizado?.toDate().toLocaleDateString('es-ES') || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disponibilidades Docentes");
    
    const colWidths = [
      { wch: 20 }, // Nombre
      { wch: 15 }, // Curso
      { wch: 40 }, // Descripción
      { wch: 15 }, // Fecha creación
      { wch: 18 }, // Última actualización
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `disponibilidades_docentes_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert("¡Archivo Excel descargado exitosamente! 📊");
  };

  // Listener para lista en tiempo real con ID incluido
  useEffect(() => {
    if (mostrarLista) {
      const unsub = onSnapshot(collection(db, "disponibilidades"), (snapshot) => {
        setDisponibilidades(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
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

      {/* Formulario */}
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

        {/* Alerta si ya existe registro */}
        {registroExistente && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-center gap-2">
            <RefreshCw className="text-yellow-600" size={20} />
            <p className="text-sm font-semibold text-yellow-800">
              Ya existe un registro para este docente. Si guardas, se actualizará el horario actual.
            </p>
          </div>
        )}

        <div className="mb-4 text-center">
          <p className="text-sm font-semibold text-blue-800">Docente: {docente.nombre || "---"} | Curso: {docente.curso || "---"}</p>
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
          className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 w-full font-semibold transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!docente.nombre || !docente.curso || !horarioTexto.trim()}
        >
          {registroExistente ? (
            <>
              <RefreshCw size={20} />
              🔄 Actualizar Horario
            </>
          ) : (
            <>
              💾 Guardar Horario Nuevo
            </>
          )}
        </button>
      </div>

      {/* Lista de Disponibilidades */}
      {mostrarLista && (
        <div className="bg-white shadow-xl rounded-2xl p-6 max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900">📋 Disponibilidades de Docentes</h2>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition shadow-md flex items-center gap-2"
              disabled={disponibilidades.length === 0}
            >
              📊 Descargar Excel
            </button>
          </div>
          
          {disponibilidades.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-8">No hay registros aún 😊</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-blue-200 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">👨‍🏫 Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">📚 Curso</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">🕒 Horario</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">📅 Actualizado</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider">🗑️ Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {disponibilidades.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">{d.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{d.curso}</td>
                      <td className="px-6 py-4 text-sm text-blue-800 max-w-md">
                        <div className="bg-blue-50 p-2 rounded-md">{d.descripcion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {d.actualizado?.toDate().toLocaleDateString('es-ES') || d.creado?.toDate().toLocaleDateString('es-ES') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => eliminarRegistro(d.id, d.nombre)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition inline-flex items-center gap-1"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-center text-xs text-gray-500 mt-4">
            Total de registros: {disponibilidades.length} | Usa el botón para exportar a Excel y analizar offline 📈
          </p>
        </div>
      )}
    </div>
  );
}

export default App;