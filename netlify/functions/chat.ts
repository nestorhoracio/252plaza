import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { MENU } from "../../src/config/menu";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `Sos el asistente virtual de 252 Plaza, un mercado gastronómico ubicado en Ruta 5, Km 252, Paso de los Toros, Uruguay.

Tu rol es ayudar a los visitantes a elegir qué comer o tomar según sus preferencias, y facilitarles hacer un pedido por WhatsApp.

El menú completo disponible es:

🍕 PIZZERÍA - Del Tomate:
${MENU.pizzeria.map(p => `- ${p.nombre}: ${p.descripcion} | ${p.precio}`).join('\n')}

☕ CAFETERÍA - Modo Café:
${MENU.cafeteria.map(p => `- ${p.nombre}: ${p.descripcion} | ${p.precio}`).join('\n')}

🍦 HELADERÍA - Chelato:
${MENU.heladeria.map(p => `- ${p.nombre}: ${p.descripcion} | ${p.precio}`).join('\n')}

🥩 RESTAURANTE - El Paso:
${MENU.restaurante.map(p => `- ${p.nombre}: ${p.descripcion} | ${p.precio}`).join('\n')}

Reglas:
- Respondé siempre en español, de forma amigable y breve
- Cuando el visitante elija un plato, preguntale su nombre y hora estimada de llegada
- Con esa info, generá un mensaje listo para enviar por WhatsApp
- Nunca inventes platos que no están en el menú`;

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { messages } = await req.json();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    return new Response(
      JSON.stringify({ 
        content: response.content[0].type === 'text' 
          ? response.content[0].text 
          : '' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al procesar la solicitud" }),
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/chat",
};