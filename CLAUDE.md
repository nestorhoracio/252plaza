# CLAUDE.md

Contexto para trabajar en este proyecto. Ver [ROADMAP.md](./ROADMAP.md) para estado actual y próximos pasos antes de empezar cualquier tarea nueva.

## Stack

- **Astro 6** + TypeScript
- **Adapter Netlify** (`@astrojs/netlify`) — el sitio se despliega como funciones serverless de Netlify
- **Chatbot con IA**: `@anthropic-ai/sdk`, modelo `claude-haiku-4-5-20251001`
- Node >= 22.12.0

## Estructura

```
src/
├── pages/            # index (landing) + 4 sub-marcas: pizzeria, cafeteria, heladeria, restaurante
├── components/        # Header, Footer, ChatBot, ThemeToggle, MenuCard, SubBrandCard
├── layouts/Layout.astro  # layout compartido, recibe props `brand` y `title`
├── config/menu.ts     # datos del menú por marca (actualmente ficticios/de ejemplo)
└── styles/globals.css # design tokens (theming por marca y por tema claro/oscuro)

netlify/functions/chat.ts  # endpoint /api/chat — llama a Claude, arma el system prompt con el menú
```

El sitio tiene una landing (`plaza`) y 4 sub-marcas independientes, cada una con su propia paleta de colores: Del Tomate (pizzería), Modo Café (cafetería), Chelato (heladería), El Paso (restaurante).

## Convenciones y cosas para NO tocar sin avisar

- **Theming**: se controla con atributos `data-brand` y `data-theme` en `<body>`, y variables CSS (`--brand-bg`, `--brand-surface`, `--brand-primary`, `--brand-accent`, `--brand-text`) definidas en `src/styles/globals.css`. No hardcodear colores en componentes — usar `var(--brand-*)`.
- **Botón de WhatsApp** (`.btn-whatsapp` en `globals.css`): el color verde está forzado con `!important` a propósito, para que no herede la paleta de cada marca. No cambiar este comportamiento sin avisar.
- **Número de WhatsApp**: está hardcodeado como `WHATSAPP_NUMBER` en `src/components/ChatBot.astro`. Avisar antes de cambiarlo o de moverlo a config/env.
- **Menú** (`src/config/menu.ts`): los platos y precios son **ficticios/de ejemplo**, no datos reales del negocio. No asumir que son correctos ni usarlos como referencia de precios reales.
- **Secretos**: `ANTHROPIC_API_KEY` vive en `.env` (no commiteado, ver `.gitignore`). No commitear secretos ni crear `.env.example` con valores reales.
- **System prompt del chatbot**: vive en `netlify/functions/chat.ts` (constante `systemPrompt`). Cambios ahí afectan directamente el tono y comportamiento del asistente en producción — avisar antes de reescribirlo.

## Comandos útiles

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Levanta el server de desarrollo en `localhost:4321` |
| `npm run build` | Genera el build de producción en `./dist/` |
| `npm run preview` | Previsualiza el build localmente |
| `npm run astro ...` | Corre comandos de la CLI de Astro (ej. `astro check`) |

No hay `netlify.toml` en el repo — el deploy en Netlify se gestiona probablemente desde el dashboard, no desde config versionada.

---

Ver [ROADMAP.md](./ROADMAP.md) para estado actual y próximos pasos antes de empezar cualquier tarea nueva.
