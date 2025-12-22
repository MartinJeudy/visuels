const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ error: "Email requis" }) };
        }

        // URL du webhook n8n qui vérifie le statut d'abonnement
        const n8nCheckUrl = process.env.N8N_WEBHOOK_URL_ABONNEMENT;

        if (!n8nCheckUrl) {
            console.error("Missing N8N_WEBHOOK_URL_ABONNEMENT");
            // Par défaut, si pas de config, on considère que c'est gratuit (ou on bloque, selon la stratégie)
            // Ici on renvoie une erreur serveur pour forcer la config
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configuration serveur manquante" })
            };
        }

        const apiKey = process.env.N8N_API_KEY;
        const headers = {
            "Content-Type": "application/json"
        };

        if (apiKey) {
            headers["X-API-KEY"] = apiKey;
        }

        // Appel à n8n
        const response = await fetch(n8nCheckUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error(`Erreur n8n: ${response.statusText}`);
        }

        const data = await response.json();

        // On s'attend à ce que n8n renvoie { isPremium: true/false }
        return {
            statusCode: 200,
            body: JSON.stringify({
                isPremium: data.isPremium || false,
                // On peut ajouter d'autres infos si besoin (date fin, plan...)
            }),
        };

    } catch (error) {
        console.error("Check Subscription Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur lors de la vérification" }),
        };
    }
};
