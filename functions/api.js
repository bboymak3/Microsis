export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Configuración de cabeceras para que el navegador entienda que enviamos JSON
    const headers = { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
    };

    try {
        // 1. VERIFICAR CONEXIÓN (Ping de seguridad)
        if (url.pathname === "/api/ping") {
            return new Response(JSON.stringify({ status: "ok", db_connected: !!env.DB }), { headers });
        }

        // 2. LÓGICA DE LOGIN
        if (url.pathname === "/api/login" && request.method === "POST") {
            const { usuario, pass } = await request.json();

            if (!env.DB) {
                return new Response(JSON.stringify({ success: false, error: "Vinculación DB no encontrada en Cloudflare" }), { status: 500, headers });
            }

            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass)
                .first();

            if (user) {
                return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), { headers });
            } else {
                return new Response(JSON.stringify({ success: false, error: "Credenciales inválidas" }), { status: 401, headers });
            }
        }

        // 3. OBTENER TODOS LOS USUARIOS (Para el Admin)
        if (url.pathname === "/api/usuarios" && request.method === "GET") {
            const id = url.searchParams.get("id");
            let result;
            
            if (id) {
                result = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ?").bind(id).first();
            } else {
                const { results } = await env.DB.prepare("SELECT * FROM usuarios ORDER BY cedula_id ASC").all();
                result = results;
            }
            return new Response(JSON.stringify(result), { headers });
        }

        // 4. GUARDAR RUTAS (Configuración)
        if (url.pathname === "/api/rutas" && request.method === "POST") {
            const { destino, horarios } = await request.json();
            await env.DB.prepare("INSERT INTO rutas_config (destino, horarios, dias_activos) VALUES (?, ?, 'L-D')").bind(destino, horarios).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // 5. OBTENER RUTAS
        if (url.pathname === "/api/rutas" && request.method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM rutas_config").all();
            return new Response(JSON.stringify(results), { headers });
        }

        // 6. MOTOR DE SORTEO
        if (url.pathname === "/api/sorteo" && request.method === "POST") {
            const { results: choferes } = await env.DB.prepare("SELECT id FROM usuarios WHERE rol = 'chofer'").all();
            const { results: rutas } = await env.DB.prepare("SELECT * FROM rutas_config").all();
            
            for (const ruta of rutas) {
                const listaHoras = ruta.horarios.split(",");
                for (const hora of listaHoras) {
                    const randomIdx = Math.floor(Math.random() * choferes.length);
                    const choferId = choferes[randomIdx].id;
                    await env.DB.prepare("INSERT INTO viajes (usuario_id, destino, hora_programada, fecha_viaje, estado) VALUES (?, ?, ?, CURRENT_DATE, 1)")
                        .bind(choferId, ruta.destino, hora.trim())
                        .run();
                }
            }
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // Si la ruta no existe
        return new Response(JSON.stringify({ error: "Endpoint no encontrado" }), { status: 404, headers });

    } catch (error) {
        // Este bloque atrapa cualquier error y lo envía como JSON para que el Index no se rompa
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}