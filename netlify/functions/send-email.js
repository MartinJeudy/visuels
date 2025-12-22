export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const payload = JSON.parse(event.body);

        // Validation basique
        if (!payload.email) {
            return { statusCode: 400, body: "Email manquant" };
        }

        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("Missing N8N_WEBHOOK_URL");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configuration serveur manquante (Webhook)" })
            };
        }

        // Transfert vers n8n avec authentification
        const apiKey = process.env.N8N_API_KEY;
        const headers = {
            "Content-Type": "application/json"
        };

        if (apiKey) {
            headers["X-API-KEY"] = apiKey;
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erreur n8n: ${response.statusText}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur lors de l'envoi" }),
        };
    }
};
