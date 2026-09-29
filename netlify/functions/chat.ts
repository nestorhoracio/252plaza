import type { Config, Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { MENU } from "../../src/config/menu";

const MAX_BODY_BYTES = 20 * 1024;
const MAX_MENSAJES = 10;
const MAX_CHARS_USUARIO = 500;
// Una respuesta del bot con max_tokens: 500 ronda los 2000 caracteres.
const MAX_CHARS_ASISTENTE = 2000;
const MAX_CHARS_CAMPO_PEDIDO = 100;

type Mensaje = { role: "user" | "assistant"; content: string };
type Pedido = { plato: string; precio: string; nombre: string; hora: string };

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

function respuestaJSON(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// El header Origin se puede falsificar desde un script: esto solo corta el
// uso casual del endpoint desde otros sitios web, no es autenticación.
function origenPermitido(req: Request, context: Context): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const permitidos = [new URL(req.url).origin, context.site?.url];
  return permitidos.includes(origin);
}

function esMensajeValido(m: unknown): m is Mensaje {
  if (typeof m !== "object" || m === null) return false;
  const { role, content } = m as Record<string, unknown>;
  return (
    (role === "user" || role === "assistant") &&
    typeof content === "string" &&
    content.trim().length > 0
  );
}

function validarMensajes(body: unknown): Mensaje[] | null {
  if (typeof body !== "object" || body === null) return null;
  const { messages } = body as Record<string, unknown>;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (!messages.every(esMensajeValido)) return null;
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

function recortarHistorial(messages: Mensaje[]): Mensaje[] {
  const recorte = messages.slice(-MAX_MENSAJES).map((m) => ({
    role: m.role,
    content: m.content.slice(
      0,
      m.role === "user" ? MAX_CHARS_USUARIO : MAX_CHARS_ASISTENTE
    ),
  }));
  // La API de Anthropic exige que la conversación empiece con un mensaje "user".
  while (recorte.length > 0 && recorte[0].role !== "user") recorte.shift();
  return recorte;
}

function esPedidoValido(p: unknown): p is Pedido {
  if (typeof p !== "object" || p === null) return false;
  const { plato, precio, nombre, hora } = p as Record<string, unknown>;
  return [plato, precio, nombre, hora].every(
    (v) =>
      typeof v === "string" &&
      v.trim().length > 0 &&
      v.length <= MAX_CHARS_CAMPO_PEDIDO
  );
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return respuestaJSON(405, { error: "Método no permitido" });
  }

  if (!origenPermitido(req, context)) {
    return respuestaJSON(403, { error: "Origen no permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] Falta la variable de entorno ANTHROPIC_API_KEY");
    return respuestaJSON(500, { error: "Error al procesar la solicitud" });
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return respuestaJSON(400, { error: "Solicitud inválida" });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return respuestaJSON(400, { error: "Solicitud inválida" });
  }

  const validados = validarMensajes(body);
  if (!validados) {
    return respuestaJSON(400, { error: "Solicitud inválida" });
  }
  const messages = recortarHistorial(validados);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const bloqueTexto = response.content.find((b) => b.type === "text");
    const fullText = bloqueTexto?.type === "text" ? bloqueTexto.text : "";

    const pedidoMatch = fullText.match(/PEDIDO_LISTO:(\{.*\})/);
    let pedido: Pedido | null = null;
    let texto = fullText;

    if (pedidoMatch) {
      // Quitamos la línea PEDIDO_LISTO del texto visible aunque el JSON venga mal.
      texto = fullText.replace(/PEDIDO_LISTO:\{.*\}/, "").trim();
      try {
        const candidato: unknown = JSON.parse(pedidoMatch[1]);
        if (esPedidoValido(candidato)) pedido = candidato;
      } catch {
        pedido = null;
      }
    }

    return respuestaJSON(200, { content: texto, pedido });
  } catch (error) {
    console.error("[chat] Error al llamar a la API de Anthropic:", error);
    return respuestaJSON(500, { error: "Error al procesar la solicitud" });
  }
};

export const config: Config = {
  path: "/api/chat",
  // aggregateBy tiene que ser un array: si se pasa "ip" como string, Netlify lo
  // ignora y aplica el límite a todo el sitio en vez de a cada IP.
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip", "domain"],
    windowSize: 60,
    windowLimit: 20,
  },
};