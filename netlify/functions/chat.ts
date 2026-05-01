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

FLUJO DE PEDIDO:
1. Recomendás platos según las preferencias del visitante
2. Cuando el visitante elige un plato, preguntás su nombre y hora estimada de llegada
3. Cuando tengas nombre y hora, confirmás el pedido y respondés con este formato EXACTO al final de tu mensaje:

PEDIDO_LISTO:{"plato":"nombre del plato","precio":"precio","nombre":"nombre del cliente","hora":"hora de llegada"}

Reglas:
- Respondé siempre en español, de forma amigable y breve
- Nunca inventes platos que no están en el menú
- El JSON de PEDIDO_LISTO debe ser la última línea de tu respuesta
- Solo incluí PEDIDO_LISTO cuando tengas plato, nombre Y hora confirmados`;

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

    const fullText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Detectar si hay un pedido listo
    const pedidoMatch = fullText.match(/PEDIDO_LISTO:(\{.*\})/);
    let pedido = null;
    let texto = fullText;

    if (pedidoMatch) {
      try {
        pedido = JSON.parse(pedidoMatch[1]);
        // Quitamos la línea PEDIDO_LISTO del texto visible
        texto = fullText.replace(/PEDIDO_LISTO:\{.*\}/, '').trim();
      } catch {
        pedido = null;
      }
    }

    return new Response(
      JSON.stringify({ content: texto, pedido }),
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