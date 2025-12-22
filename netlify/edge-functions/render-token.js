import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Initialiser le store - Netlify injecte automatiquement les credentials
  const store = getStore('visual-tokens');

  // --- MODE SAUVEGARDE (POST) ---
  if (req.method === 'POST') {
    try {
      const data = await req.text();

      if (!data) {
        return new Response(JSON.stringify({ error: "Body vide" }), { status: 400, headers });
      }

      const token = crypto.randomUUID();
      await store.set(token, data);

      console.log(`[POST] Token sauvegardé: ${token} (${data.length} chars)`);

      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error("[POST] Erreur:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // --- MODE LECTURE (GET) ---
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response(JSON.stringify({ error: "Token manquant" }), { status: 400, headers });
      }

      console.log(`[GET] Recherche token: ${token}`);

      const data = await store.get(token, { type: 'text' });

      if (!data) {
        console.error(`[GET] Token introuvable: ${token}`);
        return new Response(JSON.stringify({ error: "Token introuvable ou expiré" }), {
          status: 404,
          headers
        });
      }

      console.log(`[GET] Token trouvé: ${token} (${data.length} chars)`);

      return new Response(data, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error("[GET] Erreur:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405, headers });
};

export const config = {
  path: "/api/render-token"
};
