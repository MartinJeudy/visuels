import OpenAI from "openai";

export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { text, maxLength, type } = JSON.parse(event.body);

        if (!text || !maxLength) {
            return { statusCode: 400, body: "Missing text or maxLength" };
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("Missing OPENAI_API_KEY");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configuration serveur manquante (API Key)" })
            };
        }

        // Initialiser le client OpenAI
        const openai = new OpenAI({ apiKey });

        // Prompt engineering avancé pour des visuels impactants
        let systemPrompt = `Tu es un expert en communication événementielle et copywriting. Ta mission est de raccourcir le texte suivant pour qu'il fasse STRICTEMENT moins de ${maxLength} caractères, tout en le rendant plus impactant et vendeur. Réponds UNIQUEMENT avec le texte reformulé, sans guillemets, sans explications.`;

        let userPrompt = "";

        if (type === 'title') {
            userPrompt = `CONTEXTE : C'est le TITRE PRINCIPAL sur une affiche ou un post Instagram.
RÈGLES :
1. Sois ultra-court et percutant (Punchy).
2. Supprime les mots inutiles comme "Concert de", "Spectacle de", "Soirée avec" si cela n'apporte rien.
3. Garde l'essence de l'événement (ex: "Magie Close-up" au lieu de "Soirée de magie immersive...").
4. Ne mets PAS de guillemets.
5. Maximum ${maxLength} caractères.

Texte original : "${text}"`;
        } else if (type === 'artist') {
            userPrompt = `CONTEXTE : C'est le NOM DE L'ARTISTE affiché en gros.
RÈGLES :
1. Garde uniquement le nom de scène.
2. Supprime les mentions comme "le groupe", "l'artiste", "par", "avec".
3. Si c'est une liste trop longue, garde le principal ou mets "Etc".
4. Maximum ${maxLength} caractères.

Texte original : "${text}"`;
        } else if (type === 'description' || type === 'general') {
            userPrompt = `CONTEXTE : C'est la DESCRIPTION courte (accroche) sur le visuel.
RÈGLES :
1. Donne envie immédiatement (Teasing).
2. Supprime TOUTES les infos pratiques (Date, Heure, Lieu, Prix, Lien) car elles sont DÉJÀ affichées ailleurs sur le visuel.
3. Concentre-toi sur l'émotion, le style, l'ambiance.
4. Utilise un ton dynamique et chaleureux.
5. Maximum ${maxLength} caractères.

Texte original : "${text}"`;
        }

        // Appel à l'API OpenAI (gpt-4o-mini : rapide et économique)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 150,
            temperature: 0.7
        });

        let reformulatedText = completion.choices[0].message.content;

        // Nettoyage basique (enlever les guillemets si l'IA en a mis)
        reformulatedText = reformulatedText.replace(/^["']|["']$/g, '').trim();

        // Sécurité : si l'IA a échoué à réduire suffisamment, on coupe proprement
        if (reformulatedText.length > maxLength) {
            reformulatedText = reformulatedText.substring(0, maxLength - 3) + "...";
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ reformulatedText }),
        };

    } catch (error) {
        console.error("Function Error:", error.message || error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erreur lors de la reformulation",
                details: error.message || String(error)
            }),
        };
    }
};
