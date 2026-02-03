export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 1. Lógica de LOGIN
    if (url.pathname === "/api/login" && request.method === "POST") {
        const { usuario, pass } = await request.json();
        
        const user = await env.DB.prepare(
            "SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?"
        ).bind(usuario, pass).first();

        if (user) {
            return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    // 2. Obtener los 100 perfiles para el Admin
    if (url.pathname === "/api/usuarios" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM usuarios").all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // 3. Actualizar ubicación GPS y Estado (Naranja/Verde)
    if (url.pathname === "/api/update-viaje" && request.method === "POST") {
        const { viajeId, estado, lat, lon, pasajeros, incidente } = await request.json();
        
        await env.DB.prepare(`
            UPDATE viajes SET 
            estado = ?, 
            ultima_latitud = ?, 
            ultima_longitud = ?, 
            ultima_actualizacion = CURRENT_TIMESTAMP,
            pasajeros_inicio = COALESCE(?, pasajeros_inicio),
            incidente = COALESCE(?, incidente)
            WHERE id = ?
        `).bind(estado, lat, lon, pasajeros, incidente, viajeId).run();

        return new Response(JSON.stringify({ success: true }));
    }

    return new Response("Not Found", { status: 404 });
}
