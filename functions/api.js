export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

    // 1. RUTA DE DIAGNÓSTICO (Entra aquí primero)
    if (url.pathname === "/api/debug") {
        const checks = {
            conexion_env: !!env,
            conexion_db: !!env.DB,
            metodo: request.method
        };
        
        try {
            const dbCheck = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
            checks.usuarios_en_db = dbCheck.total;
            checks.estado = "LISTO - CONECTADO";
        } catch (e) {
            checks.estado = "ERROR DE VINCULACIÓN";
            checks.error_detalle = e.message;
        }
        return new Response(JSON.stringify(checks), { headers });
    }

    // 2. LOGIN ULTRA-SIMPLIFICADO (Para probar si responde)
    if (url.pathname === "/api/login" && request.method === "POST") {
        try {
            const body = await request.json();
            const { usuario, pass } = body;

            // Buscamos al usuario
            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass).first();

            if (user) {
                return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), { headers });
            }
            return new Response(JSON.stringify({ success: false, msg: "No encontrado" }), { status: 401, headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    return new Response("API Activa - Esperando ruta correcta", { status: 200 });
}