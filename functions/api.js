export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const headers = { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
    };

    try {
        // 1. RUTA DE PRUEBA: microsis.pages.dev/api/test
        if (url.pathname === "/api/test") {
            const result = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
            return new Response(JSON.stringify({ 
                status: "Conectado", 
                total_usuarios: result.total 
            }), { headers });
        }

        // 2. LÓGICA DE LOGIN
        if (url.pathname === "/api/login" && request.method === "POST") {
            const body = await request.json();
            const { usuario, pass } = body;

            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass)
                .first();

            if (user) {
                return new Response(JSON.stringify({ 
                    success: true, 
                    rol: user.rol, 
                    id: user.id 
                }), { headers });
            } else {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: "Credenciales incorrectas" 
                }), { status: 401, headers });
            }
        }

        return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers });

    } catch (e) {
        // Esto previene el error "Unexpected end of JSON"
        return new Response(JSON.stringify({ 
            success: false, 
            error: "Error de Servidor: " + e.message 
        }), { status: 500, headers });
    }
}
