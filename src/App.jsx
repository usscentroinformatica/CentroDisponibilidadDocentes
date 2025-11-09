import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as XLSX from 'xlsx';
import { Trash2, RefreshCw } from 'lucide-react';
import HorarioSelector from './HorarioSelector';

function App() {
  const [docente, setDocente] = useState({ nombre: "", curso: [] });
  const [mostrarSelectorCursos, setMostrarSelectorCursos] = useState(false);
  
  // Lista de cursos disponibles
  const cursosDisponibles = [
    "AUTOCAD 2D",
    "AUTOCAD 3D", 
    "BIZAGI",
    "DISEÑO CONCANVA",
    "DISEÑO WEB",
    "EXCEL 365",
    "EXCEL ASOCIADO",
    "POWER BI",
    "PYTHON",
    "WORD 365",
    "WORD ASOCIADO"
  ];
  const [horarioTexto, setHorarioTexto] = useState("");
  const [horarioSeleccionado, setHorarioSeleccionado] = useState({});
  const [mostrarLista, setMostrarLista] = useState(false);
  const [dniAdminInput, setDniAdminInput] = useState("");
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [listaDocentes, setListaDocentes] = useState([]);
  const [mostrarCombobox, setMostrarCombobox] = useState(false);
  const [busquedaDocente, setBusquedaDocente] = useState("");

  // Estados para filtros del listado
  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
    curso: "",
    dia: "",
    hora: ""
  });
  const [disponibilidadesFiltradas, setDisponibilidadesFiltradas] = useState([]);

  // Cargar lista de docentes para el combobox
  const cargarListaDocentes = async () => {
    try {
      const docentesSnapshot = await getDocs(collection(db, "docentes"));
      const docentes = docentesSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || '',
        ...doc.data()
      }));
      
      // Filtrar nombres únicos
      const nombresUnicos = [...new Set(docentes.map(d => d.nombre))].filter(n => n.trim() !== '');
      setListaDocentes(nombresUnicos.sort());
    } catch (error) {
      console.error("Error al cargar docentes:", error);
    }
  };

  // Cargar docentes al montar el componente
  useEffect(() => {
    cargarListaDocentes();
  }, []);

  // Filtrar docentes según búsqueda
  const docentesFiltrados = listaDocentes.filter(nombre =>
    nombre.toLowerCase().includes(busquedaDocente.toLowerCase())
  );

  // Manejar selección de cursos
  const handleCursoChange = (curso) => {
    const nuevosCursos = docente.curso.includes(curso)
      ? docente.curso.filter(c => c !== curso) // Deseleccionar
      : [...docente.curso, curso]; // Seleccionar
    
    setDocente(prev => ({ ...prev, curso: nuevosCursos }));
  };

  const handleDocenteSelect = (nombreDocente) => {
    setDocente(prev => ({ ...prev, nombre: nombreDocente }));
    setBusquedaDocente(''); // Limpiar el campo de búsqueda
    setMostrarCombobox(false);
  };

  const abrirCombobox = () => {
    setBusquedaDocente(''); // Limpiar búsqueda al abrir
    setMostrarCombobox(true);
  };
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
    if (!docente.nombre || docente.curso.length === 0) return;
    
    try {
      const q = query(
        collection(db, "docentes"),
        where("nombre", "==", docente.nombre)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const registro = querySnapshot.docs[0];
        setRegistroExistente({
          id: registro.id,
          ...registro.data()
        });
        setHorarioTexto(registro.data().horariosDisponibles || "");
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
    if (docente.nombre && docente.curso.length > 0) {
      buscarRegistroExistente();
    } else {
      setRegistroExistente(null);
    }
  }, [docente.nombre, docente.curso]);

  // Actualizar el texto de horario cuando se seleccionan bloques
  useEffect(() => {
    if (Object.keys(horarioSeleccionado).length > 0) {
      const convertirATexto = (seleccion) => {
        const agrupado = {};
        
        Object.keys(seleccion).forEach(key => {
          const [dia, bloque] = key.split('-');
          if (!agrupado[dia]) {
            agrupado[dia] = [];
          }
          agrupado[dia].push(bloque);
        });

        return Object.entries(agrupado)
          .map(([dia, bloques]) => `${dia}: ${bloques.join(', ')}`)
          .join(' | ');
      };
      
      setHorarioTexto(convertirATexto(horarioSeleccionado));
    } else {
      setHorarioTexto("");
    }
  }, [horarioSeleccionado]);

  const guardarDisponibilidades = async () => {
    if (!docente.nombre.trim() || docente.curso.length === 0 || Object.keys(horarioSeleccionado).length === 0) {
      alert("Por favor complete el nombre, seleccione al menos un curso y seleccione al menos un horario disponible");
      return;
    }

    // Convertir la selección de horarios a texto
    const convertirATexto = (seleccion) => {
      const agrupado = {};
      
      Object.keys(seleccion).forEach(key => {
        const [dia, bloque] = key.split('-');
        if (!agrupado[dia]) {
          agrupado[dia] = [];
        }
        agrupado[dia].push(bloque);
      });

      return Object.entries(agrupado)
        .map(([dia, bloques]) => `${dia}: ${bloques.join(', ')}`)
        .join(' | ');
    };

    const horarioTextoFormateado = convertirATexto(horarioSeleccionado);

    try {
      if (registroExistente) {
        // Actualizar registro existente
        const registroRef = doc(db, "docentes", registroExistente.id);
        await updateDoc(registroRef, {
          nombre: docente.nombre,
          cursosDictados: docente.curso,
          horariosDisponibles: horarioTextoFormateado,
          fechaActualizacion: new Date()
        });
        alert("Disponibilidad actualizada exitosamente");
      } else {
        // Crear nuevo registro
        await addDoc(collection(db, "docentes"), {
          nombre: docente.nombre,
          cursosDictados: docente.curso,
          horariosDisponibles: horarioTextoFormateado,
          correoInstitucional: "",
          correoPersonal: "",
          celular: "",
          dni: "",
          direccion: "",
          fechaNacimiento: "",
          descripcion: "",
          foto: "",
          createdAt: new Date(),
          fechaActualizacion: new Date()
        });
        alert("Disponibilidad registrada exitosamente");
      }
      
      // Recargar la lista de docentes para el combobox
      await cargarListaDocentes();
      
      // Limpiar formulario
      setDocente({ nombre: "", curso: [] });
      setHorarioSeleccionado({});
      setRegistroExistente(null);
    } catch (error) {
      console.error("Error al guardar disponibilidad:", error);
      alert("Error al guardar disponibilidad");
    }
  };

  // Eliminar registro (solo admin) - AHORA ACTIVADO
  const eliminarRegistro = async (registroId, nombreDocente) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${nombreDocente}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "docentes", registroId));
      alert("Registro eliminado exitosamente ✅");
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (disponibilidadesFiltradas.length === 0) {
      alert("No hay datos para exportar 😊");
      return;
    }

    const dataForExcel = [];

    // Agregar información de filtros aplicados
    const filtrosAplicados = [];
    if (filtros.fechaInicio) filtrosAplicados.push(`Fecha Inicio: ${filtros.fechaInicio}`);
    if (filtros.fechaFin) filtrosAplicados.push(`Fecha Fin: ${filtros.fechaFin}`);
    if (filtros.curso) filtrosAplicados.push(`Curso: ${filtros.curso}`);
    if (filtros.dia) filtrosAplicados.push(`Día: ${filtros.dia}`);
    if (filtros.hora) filtrosAplicados.push(`Hora: ${filtros.hora}`);

    if (filtrosAplicados.length > 0) {
      dataForExcel.push({ "🔍 Filtros Aplicados": filtrosAplicados.join(" | ") });
      dataForExcel.push({}); // Línea en blanco
    }

    // Encabezados y datos
    disponibilidadesFiltradas.forEach((d) => {
      dataForExcel.push({
        "👨‍🏫 Nombre": d.nombre || 'N/A',
        "📚 Cursos Dictados": d.cursosDictados && Array.isArray(d.cursosDictados) && d.cursosDictados.length > 0
          ? d.cursosDictados.join(', ') 
          : d.cursosDictados && typeof d.cursosDictados === 'string'
          ? d.cursosDictados
          : 'N/A',
        "🕒 Horarios Disponibles": d.horariosDisponibles || 'No hay horarios registrados',
        "📧 Correo Institucional": d.correoInstitucional || 'N/A',
        "📱 Celular": d.celular || 'N/A',
        "📅 Fecha de Nacimiento": d.fechaNacimiento || 'N/A',
        "🏠 Dirección": d.direccion || 'N/A',
        "📧 Correo Personal": d.correoPersonal || 'N/A',
        "📝 Descripción": d.descripcion || 'N/A',
      });
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disponibilidades Docentes");
    
    const colWidths = [
      { wch: 20 }, // Nombre
      { wch: 25 }, // Cursos Dictados
      { wch: 40 }, // Horarios Disponibles
      { wch: 25 }, // Correo Institucional
      { wch: 12 }, // Celular
      { wch: 15 }, // Fecha de Nacimiento
      { wch: 30 }, // Dirección
      { wch: 25 }, // Correo Personal
      { wch: 35 }, // Descripción
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `disponibilidades_docentes_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert("¡Archivo Excel descargado exitosamente! 📊");
  };

  // Listener para lista en tiempo real con ID incluido - ahora lee de la colección 'docentes'
  useEffect(() => {
    if (mostrarLista) {
      const unsub = onSnapshot(collection(db, "docentes"), (snapshot) => {
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

  // Actualizar lista de docentes cuando cambien los datos
  useEffect(() => {
    if (disponibilidades.length > 0) {
      const nombresUnicos = [...new Set(disponibilidades.map(d => d.nombre))].filter(n => n && n.trim() !== '');
      setListaDocentes(nombresUnicos.sort());
    }
  }, [disponibilidades]);

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    let docentesFiltrados = [...disponibilidades];

    // Filtro por fecha (rango)
    if (filtros.fechaInicio && filtros.fechaFin) {
      const fechaInicio = new Date(filtros.fechaInicio);
      const fechaFin = new Date(filtros.fechaFin);
      
      docentesFiltrados = docentesFiltrados.filter(docente => {
        if (docente.createdAt) {
          const fechaDocente = new Date(docente.createdAt.toDate ? docente.createdAt.toDate() : docente.createdAt);
          return fechaDocente >= fechaInicio && fechaDocente <= fechaFin;
        }
        return true;
      });
    }

    // Filtro por curso
    if (filtros.curso) {
      docentesFiltrados = docentesFiltrados.filter(docente => {
        if (Array.isArray(docente.cursosDictados)) {
          return docente.cursosDictados.includes(filtros.curso);
        } else if (typeof docente.cursosDictados === 'string') {
          return docente.cursosDictados.includes(filtros.curso);
        }
        return false;
      });
    }

    // Filtro por día disponible
    if (filtros.dia) {
      docentesFiltrados = docentesFiltrados.filter(docente => {
        if (docente.horariosDisponibles) {
          return docente.horariosDisponibles.toLowerCase().includes(filtros.dia.toLowerCase());
        }
        return false;
      });
    }

    // Filtro por hora disponible
    if (filtros.hora) {
      docentesFiltrados = docentesFiltrados.filter(docente => {
        if (docente.horariosDisponibles) {
          return docente.horariosDisponibles.includes(filtros.hora);
        }
        return false;
      });
    }

    setDisponibilidadesFiltradas(docentesFiltrados);
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [disponibilidades, filtros]);

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

      {/* Formulario de Registro */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
          📝 Registro de Disponibilidad Docente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="relative">
            <label className="block text-blue-900 font-semibold mb-2">👨‍🏫 Nombre del Docente</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Busca o ingresa el nombre del docente"
                value={docente.nombre}
                onChange={(e) => {
                  setDocente(prev => ({ ...prev, nombre: e.target.value }));
                  setBusquedaDocente(e.target.value);
                  setMostrarCombobox(true);
                }}
                onClick={() => {
                  setBusquedaDocente(''); // Limpiar búsqueda al abrir
                  setMostrarCombobox(true);
                }}
                onFocus={() => setMostrarCombobox(true)}
                onBlur={() => {
                  // Pequeño delay para permitir click en las opciones
                  setTimeout(() => setMostrarCombobox(false), 200);
                }}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-900 focus:outline-none transition"
              />
              
              {/* Indicador de carga */}
              {listaDocentes.length === 0 && (
                <div className="absolute right-3 top-3 text-gray-400">
                  <RefreshCw size={16} className="animate-spin" />
                </div>
              )}
            </div>
            
            {/* Combobox con búsqueda */}
            {mostrarCombobox && docentesFiltrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {docentesFiltrados.map((nombre, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors"
                    onClick={() => {
                      setDocente(prev => ({ ...prev, nombre: nombre }));
                      setBusquedaDocente(''); // Limpiar el campo de búsqueda
                      setMostrarCombobox(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-900 font-medium">{nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mensaje cuando no hay resultados */}
            {mostrarCombobox && busquedaDocente && docentesFiltrados.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-lg p-3">
                <p className="text-gray-500 text-sm">No se encontraron docentes con ese nombre</p>
                <p className="text-blue-600 text-xs mt-1">Presiona Enter o haz clic fuera para usar: "{busquedaDocente}"</p>
              </div>
            )}
          </div>
          
          <div className="relative">
            <label className="block text-blue-900 font-semibold mb-2">📚 Cursos a Dictar</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarSelectorCursos(!mostrarSelectorCursos)}
                className="w-full border-2 border-blue-200 p-3 rounded-lg bg-white text-left focus:border-blue-900 focus:outline-none transition flex justify-between items-center"
              >
                <span className={docente.curso.length > 0 ? 'text-blue-900' : 'text-gray-400'}>
                  {docente.curso.length > 0 
                    ? `${docente.curso.length} curso(s) seleccionado(s)` 
                    : 'Selecciona los cursos que dictarás'}
                </span>
                <svg 
                  className={`w-5 h-5 text-blue-600 transform transition-transform ${mostrarSelectorCursos ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Selector de cursos desplegable */}
              {mostrarSelectorCursos && (
                <div className="absolute z-20 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  <div className="p-3 bg-blue-50 border-b border-blue-200">
                    <p className="text-blue-900 font-semibold text-sm">Selecciona uno o varios cursos:</p>
                  </div>
                  
                  {cursosDisponibles.map((curso, index) => (
                    <label 
                      key={index}
                      className="flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={docente.curso.includes(curso)}
                        onChange={() => handleCursoChange(curso)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-blue-900 font-medium">{curso}</span>
                      
                      {/* Indicador visual de selección */}
                      {docente.curso.includes(curso) && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </label>
                  ))}
                  
                  <div className="p-3 bg-gray-50 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setMostrarSelectorCursos(false)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold transition"
                    >
                      Listo ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mostrar cursos seleccionados */}
            {docente.curso.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-900 font-semibold text-sm mb-2">Cursos seleccionados:</p>
                <div className="flex flex-wrap gap-2">
                  {docente.curso.map((curso, index) => (
                    <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      {curso}
                      <button
                        type="button"
                        onClick={() => handleCursoChange(curso)}
                        className="hover:bg-blue-700 rounded-full p-1 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Horarios */}
        <div className="mb-6">
          <HorarioSelector 
            horarioSeleccionado={horarioSeleccionado}
            setHorarioSeleccionado={setHorarioSeleccionado}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={guardarDisponibilidades}
            disabled={!docente.nombre.trim() || docente.curso.length === 0 || Object.keys(horarioSeleccionado).length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              !docente.nombre.trim() || docente.curso.length === 0 || Object.keys(horarioSeleccionado).length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
            }`}
          >
            {registroExistente ? '🔄 Actualizar Disponibilidad' : '💾 Guardar Disponibilidad'}
          </button>
          
          <button
            onClick={() => {
              setDocente({ nombre: "", curso: [] });
              setHorarioSeleccionado({});
              setRegistroExistente(null);
            }}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition"
          >
            🗑️ Limpiar Formulario
          </button>
        </div>

        {registroExistente && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800 text-center">
              ⚠️ Estás actualizando un registro existente. Los cambios se reflejarán inmediatamente.
            </p>
          </div>
        )}
      </div>

      {/* Lista de Disponibilidades */}
      {mostrarLista && (
        <div className="bg-white shadow-xl rounded-2xl p-6 max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900">📋 Lista de Docentes Registrados</h2>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition shadow-md flex items-center gap-2"
              disabled={disponibilidadesFiltradas.length === 0}
            >
              📊 Descargar Excel
            </button>
          </div>

          {/* Filtros de búsqueda */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h3 className="text-blue-900 font-semibold mb-3 flex items-center gap-2">
              🔍 Filtros de Búsqueda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtro por Fecha Inicio */}
              <div>
                <label className="block text-blue-800 text-sm font-medium mb-1">📅 Fecha Inicio</label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Filtro por Fecha Fin */}
              <div>
                <label className="block text-blue-800 text-sm font-medium mb-1">📅 Fecha Fin</label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Filtro por Curso */}
              <div>
                <label className="block text-blue-800 text-sm font-medium mb-1">📚 Curso</label>
                <select
                  value={filtros.curso}
                  onChange={(e) => setFiltros(prev => ({ ...prev, curso: e.target.value }))}
                  className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos los cursos</option>
                  {cursosDisponibles.map(curso => (
                    <option key={curso} value={curso}>{curso}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Día */}
              <div>
                <label className="block text-blue-800 text-sm font-medium mb-1">📆 Día Disponible</label>
                <select
                  value={filtros.dia}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dia: e.target.value }))}
                  className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos los días</option>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              {/* Filtro por Hora */}
              <div>
                <label className="block text-blue-800 text-sm font-medium mb-1">⏰ Hora Disponible</label>
                <select
                  value={filtros.hora}
                  onChange={(e) => setFiltros(prev => ({ ...prev, hora: e.target.value }))}
                  className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todas las horas</option>
                  <option value="08:00 - 09:00">08:00 - 09:00</option>
                  <option value="09:00 - 10:00">09:00 - 10:00</option>
                  <option value="10:00 - 11:00">10:00 - 11:00</option>
                  <option value="11:00 - 12:00">11:00 - 12:00</option>
                  <option value="12:00 - 13:00">12:00 - 13:00</option>
                  <option value="13:00 - 14:00">13:00 - 14:00</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="15:00 - 16:00">15:00 - 16:00</option>
                  <option value="16:00 - 17:00">16:00 - 17:00</option>
                  <option value="17:00 - 18:00">17:00 - 18:00</option>
                  <option value="18:00 - 19:00">18:00 - 19:00</option>
                  <option value="19:00 - 20:00">19:00 - 20:00</option>
                  <option value="20:00 - 21:00">20:00 - 21:00</option>
                </select>
              </div>
            </div>

            {/* Botones de acción para filtros */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setFiltros({ fechaInicio: "", fechaFin: "", curso: "", dia: "", hora: "" })}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium transition"
              >
                🗑️ Limpiar Filtros
              </button>
            </div>
          </div>
          
          {disponibilidadesFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-8">No hay registros aún 😊</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-blue-200 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">👨‍🏫 Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">📚 Cursos Dictados</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">🕒 Horarios Disponibles</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">📧 Correo Institucional</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">📱 Celular</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider">🗑️ Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {disponibilidadesFiltradas.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                        {d.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-700">
                        {d.cursosDictados && Array.isArray(d.cursosDictados) && d.cursosDictados.length > 0
                          ? d.cursosDictados.join(', ') 
                          : d.cursosDictados && typeof d.cursosDictados === 'string'
                          ? d.cursosDictados
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-800 max-w-md">
                        <div className="bg-blue-50 p-2 rounded-md">
                          {d.horariosDisponibles || 'No hay horarios registrados'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {d.correoInstitucional || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {d.celular || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => eliminarRegistro(d.id, d.nombre || 'Docente')}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg inline-flex items-center gap-1 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Eliminar registro de docente"
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