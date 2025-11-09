import React from 'react';

const HorarioSelector = ({ horarioSeleccionado, setHorarioSeleccionado }) => {
  // Días de la semana
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Bloques de horarios (ajustables según necesidad)
  const bloquesHorarios = [
    '06:00 - 08:00',
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00'
  ];

  // Función para manejar el cambio de selección
  const handleHorarioChange = (dia, bloque) => {
    const key = `${dia}-${bloque}`;
    setHorarioSeleccionado(prev => {
      const nuevo = { ...prev };
      if (nuevo[key]) {
        delete nuevo[key]; // Deseleccionar
      } else {
        nuevo[key] = true; // Seleccionar
      }
      return nuevo;
    });
  };

  // Convertir la selección a texto para guardar
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

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">
        📅 Selecciona tus horarios disponibles
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 text-left font-semibold text-blue-900">Día/Hora</th>
              {bloquesHorarios.map(bloque => (
                <th key={bloque} className="p-2 text-center font-semibold text-blue-900 text-xs">
                  {bloque}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dias.map(dia => (
              <tr key={dia} className="border-b border-blue-100">
                <td className="p-2 font-semibold text-blue-800 bg-blue-50">{dia}</td>
                {bloquesHorarios.map(bloque => {
                  const key = `${dia}-${bloque}`;
                  const estaSeleccionado = horarioSeleccionado[key];
                  
                  return (
                    <td key={bloque} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleHorarioChange(dia, bloque)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          estaSeleccionado
                            ? 'bg-green-500 border-green-600 text-white'
                            : 'bg-gray-100 border-gray-300 hover:bg-green-100 hover:border-green-400'
                        }`}
                        title={`${dia} ${bloque}`}
                      >
                        {estaSeleccionado ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista previa de la selección */}
      {Object.keys(horarioSeleccionado).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Horarios seleccionados:</h4>
          <p className="text-sm text-green-700">
            {convertirATexto(horarioSeleccionado)}
          </p>
        </div>
      )}
    </div>
  );
};

export default HorarioSelector;