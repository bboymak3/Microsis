export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const resHeaders = { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
    };

    // FUNCIÓN DE PRUEBA: Si entras a /api/test y ves "OK", la DB está conectada
    if (url.pathname === "/api/test") {
        try {
            const result = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
            return new Response(JSON.stringify({ status: "Conectado", total_usuarios: result.total }), { headers: resHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ status: "Error de Conexión", error: e.message }), { status: 500, headers: resHeaders });
        }
    }

    // LOGIN CORREGIDO
    if (url.pathname === "/api/login" && request.method === "POST") {
        try {
            const { usuario, pass } = await request.json();
            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass).first();

            if (user) {
                return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), { headers: resHeaders });
            } else {
                return new Response(JSON.stringify({ success: false, msg: "Usuario o clave incorrecta" }), { status: 401, headers: resHeaders });
            }
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: resHeaders });
        }
    }

    // OBTENER USUARIOS
    if (url.pathname === "/api/usuarios" && request.method === "GET") {
        try {
            const id = url.searchParams.get("id");
            if (id) {
                const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ?").bind(id).first();
                return new Response(JSON.stringify(user), { headers: resHeaders });
            }
            const { results } = await env.DB.prepare("SELECT * FROM usuarios ORDER BY cedula_id ASC").all();
            return new Response(JSON.stringify(results), { headers: resHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: resHeaders });
        }
    }

    return new Response("API endpoint no encontrado", { status: 404 });
}
