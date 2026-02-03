export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // LOGIN
    if (url.pathname === "/api/login" && request.method === "POST") {
        const { usuario, pass } = await request.json();
        const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?").bind(usuario, pass).first();
        if (user) return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }));
        return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    // USUARIOS (LISTA Y PERFIL INDIVIDUAL)
    if (url.pathname === "/api/usuarios" && request.method === "GET") {
        const id = url.searchParams.get("id");
        if (id) {
            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ?").bind(id).first();
            return new Response(JSON.stringify(user));
        }
        const { results } = await env.DB.prepare("SELECT * FROM usuarios ORDER BY cedula_id ASC").all();
        return new Response(JSON.stringify(results));
    }

    // ACTUALIZAR PERFIL DESDE ADMIN
    if (url.pathname === "/api/usuarios/update" && request.method === "POST") {
        const d = await request.json();
        await env.DB.prepare(`
            UPDATE usuarios SET 
            nombre=?, placa_buseta=?, password=?, serial_motor=?, tipo_sangre=?, 
            contacto_principal=?, contacto_familiar=?, usa_lentes=?, genero=?, edad=?
            WHERE cedula_id=?
        `).bind(d.nombre, d.placa_buseta, d.placa_buseta, d.serial_motor, d.tipo_sangre, d.contacto_principal, d.contacto_familiar, d.usa_lentes?1:0, d.genero, d.edad, d.cedula_id).run();
        return new Response(JSON.stringify({ success: true }));
    }

    // GESTIÓN DE RUTAS (DESTINOS Y HORARIOS)
    if (url.pathname === "/api/rutas") {
        if (request.method === "POST") {
            const { destino, horarios } = await request.json();
            await env.DB.prepare("INSERT INTO rutas_config (destino, horarios, dias_activos) VALUES (?, ?, 'L,M,X,J,V,S,D')").bind(destino, horarios).run();
            return new Response(JSON.stringify({ success: true }));
        }
        const { results } = await env.DB.prepare("SELECT * FROM rutas_config").all();
        return new Response(JSON.stringify(results));
    }

    // MAPA EN VIVO
    if (url.pathname === "/api/mapa-vivo") {
        const { results } = await env.DB.prepare(`
            SELECT u.cedula_id, u.placa_buseta, v.ultima_latitud, v.ultima_longitud, v.ultima_actualizacion, v.destino
            FROM viajes v JOIN usuarios u ON v.usuario_id = u.id WHERE v.estado = 2
        `).all();
        return new Response(JSON.stringify(results));
    }

    return new Response("Not Found", { status: 404 });
}
