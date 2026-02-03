export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // LOGIN: Valida usuario y placa (contraseña)
    if (url.pathname === "/api/login" && request.method === "POST") {
        const { usuario, pass } = await request.json();
        const user = await env.DB.prepare(
            "SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?"
        ).bind(usuario, pass).first();

        if (user) return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }));
        return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    // GESTIÓN DE USUARIOS: Obtener todos o uno
    if (url.pathname === "/api/usuarios" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const query = id ? "SELECT * FROM usuarios WHERE cedula_id = ?" : "SELECT * FROM usuarios ORDER BY cedula_id ASC";
        const result = id ? await env.DB.prepare(query).bind(id).first() : (await env.DB.prepare(query).all()).results;
        return new Response(JSON.stringify(result));
    }

    // ACTUALIZAR PERFIL (Desde Admin)
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

    // MAPA EN VIVO: Solo unidades en ruta (Naranja)
    if (url.pathname === "/api/mapa-vivo") {
        const { results } = await env.DB.prepare(`
            SELECT u.cedula_id, u.placa_buseta, v.ultima_latitud, v.ultima_longitud, v.ultima_actualizacion, v.destino
            FROM viajes v JOIN usuarios u ON v.usuario_id = u.id WHERE v.estado = 2
        `).all();
        return new Response(JSON.stringify(results));
    }

    return new Response("No encontrado", { status: 404 });
}
