export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Cabeceras para permitir que tu HTML lea la respuesta
    const resHeaders = { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
    };

    try {
        // 1. TEST DE CONEXIÓN
        if (url.pathname === "/api/test") {
            const res = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
            return new Response(JSON.stringify({ estado: "Conectado", usuarios: res.total }), { headers: resHeaders });
        }

        // 2. LÓGICA DE LOGIN
        if (url.pathname === "/api/login" && request.method === "POST") {
            const { usuario, pass } = await request.json();
            
            // Buscamos en la tabla de usuarios de D1
            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass)
                .first();

            if (user) {
                return new Response(JSON.stringify({ 
                    success: true, 
                    rol: user.rol, 
                    id: user.id 
                }), { headers: resHeaders });
            }
            return new Response(JSON.stringify({ success: false, error: "Credenciales inválidas" }), { status: 401, headers: resHeaders });
        }

        // 3. LISTA DE USUARIOS (Para el Administrador)
        if (url.pathname === "/api/usuarios" && request.method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM usuarios ORDER BY cedula_id ASC").all();
            return new Response(JSON.stringify(results), { headers: resHeaders });
        }

        return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers: resHeaders });

    } catch (e) {
        // Esto previene el error "Unexpected end of JSON input" en el navegador
        return new Response(JSON.stringify({ success: false, error: "Error de servidor: " + e.message }), { status: 500, headers: resHeaders });
    }
}
