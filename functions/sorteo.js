export async function onRequestPost(context) {
    const { env } = context;

    // 1. Obtener todos los choferes (Com01 al Com100)
    const { results: choferes } = await env.DB.prepare("SELECT id FROM usuarios WHERE rol = 'chofer'").all();
    
    // 2. Obtener las rutas configuradas (Valencia, Barinas, etc.)
    const { results: rutas } = await env.DB.prepare("SELECT * FROM rutas_config").all();

    // 3. Limpiar sorteos anteriores del mes actual (opcional)
    // 4. Lógica de reparto equitativo
    let asignaciones = [];
    const diasMes = 30; 

    for (let dia = 1; dia <= diasMes; dia++) {
        // Mezclamos los choferes para que sea al azar cada día
        let poolDia = [...choferes].sort(() => Math.random() - 0.5);
        
        rutas.forEach(ruta => {
            const horarios = ruta.horarios.split(','); // Ej: "08:30, 10:30"
            horarios.forEach(hora => {
                if (poolDia.length > 0) {
                    const chofer = poolDia.pop(); // Asignamos uno y lo sacamos del pool del día
                    asignaciones.push({
                        usuario_id: chofer.id,
                        destino: ruta.destino,
                        hora: hora.trim(),
                        fecha: `2026-03-${dia.toString().padStart(2, '0')}` // Ejemplo para Marzo
                    });
                }
            });
        });
    }

    // 5. Guardar todo en la base de datos D1
    const stmt = env.DB.prepare("INSERT INTO viajes (usuario_id, destino, hora_programada, fecha_viaje, estado) VALUES (?, ?, ?, ?, 1)");
    await env.DB.batch(asignaciones.map(a => stmt.bind(a.usuario_id, a.destino, a.hora, a.fecha)));

    return new Response(JSON.stringify({ success: true, mensajes: "Sorteo generado con éxito" }));
}
