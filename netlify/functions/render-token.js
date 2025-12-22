import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // 1. Initialiser le magasin de données (Mémoire persistante)
  // On utilise un store nommé 'visual-tokens'
  // Note: Dans Netlify Functions v2, les credentials sont récupérés automatiquement
  const store = getStore('visual-tokens');

  // GESTION DU CORS (Pour autoriser n8n et votre navigateur)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // --- MODE SAUVEGARDE (POST) ---
  if (req.method === 'POST') {
    try {
      // On lit les données envoyées (le gros JSON du visuel)
      const data = await req.text();
      
      if (!data) {
        return new Response("Body vide", { status: 400, headers });
      }

      // On crée un ID unique pour ce visuel
      const token = crypto.randomUUID();

      // IMPORTANT : On sauvegarde dans les Blobs (Disque dur du Cloud)
      // Cela remplace la variable mémoire qui s'effaçait
      await store.set(token, data);

      console.log(`[POST] Token sauvegardé dans Blobs : ${token} (Taille: ${data.length})`);

      // On renvoie le token au front-end
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error("[POST] Erreur sauvegarde:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // --- MODE LECTURE (GET) ---
  if (req.method === 'GET') {
    try {
      // On récupère le token depuis l'URL (?token=...)
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response("Token manquant", { status: 400, headers });
      }

      // On va chercher les données dans les Blobs (explicitement en texte)
      const data = await store.get(token, { type: 'text' });

      if (!data) {
        console.error(`[GET] Token introuvable ou expiré : ${token}`);
        return new Response(JSON.stringify({ error: "Token introuvable ou expiré" }), {
          status: 404,
          headers
        });
      }

      console.log(`[GET] Données récupérées pour : ${token} (${data.length} caractères)`);

      // On renvoie le JSON complet du visuel
      return new Response(data, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error("[GET] Erreur lecture:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  return new Response("Méthode non autorisée", { status: 405, headers });
};
