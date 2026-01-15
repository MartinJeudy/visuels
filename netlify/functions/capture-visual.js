export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const payload = JSON.parse(event.body);

        // Validation basique
        if (!payload.captureUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "captureUrl manquant" })
            };
        }

        if (!payload.outputFormat) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "outputFormat manquant" })
            };
        }

        const webhookUrl = process.env.N8N_WEBHOOK_URL_CAPTURE;
        if (!webhookUrl) {
            console.error("Missing N8N_WEBHOOK_URL_CAPTURE");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configuration serveur manquante (Webhook Capture)" })
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
            const errorText = await response.text().catch(() => response.statusText);
            console.error("N8N webhook error:", errorText);
            throw new Error(`Erreur n8n: ${response.status}`);
        }

        // Récupérer la réponse de n8n et la transmettre au client
        const responseData = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        console.error("Capture Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur lors de la capture: " + error.message }),
        };
    }
};
