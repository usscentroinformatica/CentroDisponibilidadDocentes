import React, { useState } from "react";
import { getDocs, query, where, collection } from "firebase/firestore";
import { db } from "./firebase"; // Importación corregida
import DisponibilidadForm from "./components/DisponibilidadForm";
import ListaDisponibilidades from "./components/ListaDisponibilidades";

function App() {
  const [docente, setDocente] = useState({ nombre: "", dni: "" });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false); // Para spinner durante query

  const handleContinuar = async () => {
    if (!docente.nombre || !docente.dni) {
      alert("Por favor, ingresa nombre y DNI");
      return;
    }

    setLoading(true);
    try {
      // Query a colección "admins": Busca por DNI (único)
      const q = query(
        collection(db, "admins"), // Corregido a "admins"
        where("dni", "==", docente.dni),
        where("nombre", "==", docente.nombre) // Verifica también nombre para más seguridad
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Existe admin: Habilita modo
        setIsAdmin(true);
        alert("¡Acceso de administrador confirmado! ✅");
      } else {
        // No es admin: Solo registro normal
        alert("Registro exitoso. Puedes registrar horarios, pero no ver la lista completa.");
      }
    } catch (error) {
      console.error("Error al verificar admin:", error);
      alert("Error al verificar acceso. Intenta de nuevo.");
    }
    setMostrarFormulario(true);
    setLoading(false);
  };

  if (!mostrarFormulario) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="p-8 bg-white shadow-xl rounded-2xl max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">📚 Registro de Disponbilidad</h1>
            <p className="text-gray-600">Ingresa tus datos para gestionar horarios</p>
          </div>
          <input
            type="text"
            placeholder="Nombre completo"
            value={docente.nombre}
            onChange={(e) => setDocente({ ...docente, nombre: e.target.value })}
            className="border-2 border-blue-200 p-3 rounded-lg w-full mb-4 focus:border-blue-900 focus:outline-none transition"
          />
          <input
            type="text"
            placeholder="DNI (sin puntos ni guiones)"
            value={docente.dni}
            onChange={(e) => setDocente({ ...docente, dni: e.target.value })}
            className="border-2 border-blue-200 p-3 rounded-lg w-full mb-6 focus:border-blue-900 focus:outline-none transition"
          />
          <button
            onClick={handleContinuar}
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 w-full font-semibold transition shadow-md disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Continuar"}
          </button>
          <p className="text-gray-500 text-sm mt-4 text-center">
            Si eres administrador, usa tu nombre y DNI registrados en el sistema para ver la disponibilidad completa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">👨‍🏫 Panel de {docente.nombre}</h1>
          <p className="text-gray-600">Gestiona tu disponibilidad semanal {isAdmin && "(Modo Admin)"}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setMostrarLista(!mostrarLista)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
          >
            {mostrarLista ? "Ocultar" : "Ver"} Disponibilidad 📊
          </button>
        )}
      </div>
      
      {/* Contenedor dinámico: Centrado si no hay lista, grid si hay */}
      {mostrarLista ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DisponibilidadForm docente={docente} />
          <ListaDisponibilidades />
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <DisponibilidadForm docente={docente} />
          </div>
        </div>
      )}
      
      <button
        onClick={() => {
          setMostrarFormulario(false);
          setIsAdmin(false);
          setMostrarLista(false);
        }}
        className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold transition mx-auto block"
      >
        Volver a Registro 🔄
      </button>
    </div>
  );
}

export default App;