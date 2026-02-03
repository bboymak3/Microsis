export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const headers = { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
    };

    try {
        // RUTA DE PRUEBA: microsis.pages.dev/api/test
        if (url.pathname === "/api/test") {
            const result = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
            return new Response(JSON.stringify({ 
                status: "Conectado", 
                total_usuarios: result.total 
            }), { headers });
        }

        // LOGIN
        if (url.pathname === "/api/login" && request.method === "POST") {
            const { usuario, pass } = await request.json();
            
            const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
                .bind(usuario, pass).first();

            if (user) {
                return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), { headers });
            } else {
                return new Response(JSON.stringify({ success: false }), { status: 401, headers });
            }
        }

        return new Response(JSON.stringify({ error: "No encontrado" }), { status: 404, headers });

    } catch (e) {
        // Esto evita el error de "Unexpected end of JSON" devolviendo el mensaje de error real
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
    }
}