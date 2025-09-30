import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const ListaDisponibilidades = () => {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [vistaTabla, setVistaTabla] = useState(true); // Para toggle entre lista y tabla (opcional)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "disponibilidades"), (snapshot) => {
      setDisponibilidades(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, []);

  // Función para agrupar datos en tabla: { [docente]: { [dia]: "horaInicio - horaFin" } }
  const procesarTabla = () => {
    const tablaData = {};
    disponibilidades.forEach((d) => {
      const keyDocente = `${d.nombre} (${d.dni})`;
      if (!tablaData[keyDocente]) {
        tablaData[keyDocente] = {};
      }
      tablaData[keyDocente][d.dia] = `${d.horaInicio} - ${d.horaFin}`;
    });
    return tablaData;
  };

  const tablaData = procesarTabla();
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">📋 Horarios Registrados</h2>
        <p className="text-gray-600">Lista y tabla de disponibilidades de todos los docentes</p>
        {/* Toggle opcional entre vistas */}
        <button
          onClick={() => setVistaTabla(!vistaTabla)}
          className="mt-2 bg-blue-900 text-white px-4 py-1 rounded hover:bg-blue-800 text-sm"
        >
          {vistaTabla ? "Ver Lista" : "Ver Tabla"}
        </button>
      </div>

      {/* Vista de Lista (original) */}
      {!vistaTabla && (
        <>
          {disponibilidades.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No hay registros aún 😊</p>
            </div>
          )}
          <ul className="space-y-3">
            {disponibilidades.map((d, i) => (
              <li key={i} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-blue-900 font-bold">{d.nombre}</strong>
                    <span className="text-gray-600 ml-2">(DNI: {d.dni})</span>
                  </div>
                  <span className="text-sm text-blue-700 font-semibold">🕐 {d.dia}</span>
                </div>
                <p className="text-lg font-semibold text-blue-800 mt-1">{d.horaInicio} - {d.horaFin}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Vista de Tabla (nueva) */}
      {vistaTabla && (
        <>
          {Object.keys(tablaData).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No hay registros aún 😊</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-blue-200 rounded-lg overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Docente</th>
                  {dias.map((dia) => (
                    <th key={dia} className="px-4 py-3 text-center font-semibold">{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {Object.keys(tablaData).map((docenteKey) => (
                  <tr key={docenteKey} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 font-medium text-blue-900 border-r border-blue-200">
                      {docenteKey}
                    </td>
                    {dias.map((dia) => (
                      <td key={dia} className="px-4 py-3 text-center text-sm">
                        {tablaData[docenteKey][dia] ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {tablaData[docenteKey][dia]}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No disponible</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ListaDisponibilidades;