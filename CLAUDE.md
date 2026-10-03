# CLAUDE.md

Contexto para trabajar en este proyecto. Ver [ROADMAP.md](./ROADMAP.md) para estado actual y próximos pasos antes de empezar cualquier tarea nueva.

## Stack

- **Astro 6** + TypeScript
- **Adapter Netlify** (`@astrojs/netlify`) — el sitio se despliega como funciones serverless de Netlify
- **React** (`@astrojs/react@5.x`) para islas interactivas. No subir a la v6/v7 mientras Astro use Vite 7: traen Vite 8 y rompen el dev server
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

- **Theming**: se controla con atributos `data-brand` y `data-theme` en `<html>`, y variables CSS (`--brand-bg`, `--brand-surface`, `--brand-primary`, `--brand-accent`, `--brand-text`) definidas en `src/styles/globals.css`. No hardcodear colores en componentes — usar `var(--brand-*)`. El tema inicial lo aplica un `<script is:inline>` en el `<head>` de `Layout.astro` (evita el parpadeo); `ThemeToggle` solo maneja el click.
- **Botón de WhatsApp** (`.btn-whatsapp` en `globals.css`): el color verde está forzado con `!important` a propósito, para que no herede la paleta de cada marca. No cambiar este comportamiento sin avisar.
- **Número de WhatsApp**: está hardcodeado como `WHATSAPP_NUMBER` en `src/components/ChatBot.astro`. Avisar antes de cambiarlo o de moverlo a config/env.
- **Menú** (`src/config/menu.ts`): los platos y precios son **ficticios/de ejemplo**, no datos reales del negocio. No asumir que son correctos ni usarlos como referencia de precios reales.
- **Secretos**: `ANTHROPIC_API_KEY` vive en `.env` (no commiteado, ver `.gitignore`). No commitear secretos ni crear `.env.example` con valores reales.
- **System prompt del chatbot**: vive en `netlify/functions/chat.ts` (constante `systemPrompt`). Cambios ahí afectan directamente el tono y comportamiento del asistente en producción — avisar antes de reescribirlo.
- **Seguridad de `/api/chat`**: el endpoint valida el body, recorta el historial, controla el `Origin` y tiene rate limit nativo de Netlify (`config.rateLimit`, 20 pedidos/min por IP). `aggregateBy` tiene que ser un array o el límite pasa a ser global para todo el sitio. No relajar estas validaciones sin avisar.
- **Imágenes del menú**: `MenuCard` recibe el nombre de archivo (`imagen` en `menu.ts`) y lo resuelve con `import.meta.glob` sobre `src/assets/images/*.webp`. Si el archivo no existe, el build falla a propósito.
- **Chatbot en local**: `npm run dev` no le pasa el `.env` a las funciones de Netlify (la emulación solo inyecta variables de un sitio vinculado). Para probar el chatbot en local: `node --env-file=.env node_modules/astro/bin/astro.mjs dev`.

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
