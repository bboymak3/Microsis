export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" // Permite que tu web se comunique con el Worker
    };

    try {
      // 1. PRUEBA DE CONEXIÓN (Entra a /api/test)
      if (url.pathname === "/api/test") {
        const res = await env.DB.prepare("SELECT count(*) as total FROM usuarios").first();
        return new Response(JSON.stringify({ estado: "Conectado", usuarios: res.total }), { headers });
      }

      // 2. LÓGICA DE LOGIN
      if (url.pathname === "/api/login" && request.method === "POST") {
        const { usuario, pass } = await request.json();
        const user = await env.DB.prepare("SELECT * FROM usuarios WHERE cedula_id = ? AND password = ?")
          .bind(usuario, pass).first();

        if (user) {
          return new Response(JSON.stringify({ success: true, rol: user.rol, id: user.id }), { headers });
        }
        return new Response(JSON.stringify({ success: false, error: "Credenciales inválidas" }), { status: 401, headers });
      }

      // 3. OBTENER USUARIOS (Para el Admin)
      if (url.pathname === "/api/usuarios" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM usuarios ORDER BY cedula_id ASC").all();
        return new Response(JSON.stringify(results), { headers });
      }

      return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers });

    } catch (e) {
      return new Response(JSON.stringify({ error: "Fallo de Worker: " + e.message }), { status: 500, headers });
    }
  }
};
