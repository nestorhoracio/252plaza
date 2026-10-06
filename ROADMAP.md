# ROADMAP — 252 Plaza

Mantener actualizado al final de cada sesión de trabajo. No hace falta ser exhaustivo: priorizar que quede claro qué está hecho, qué está en curso, y qué sigue.

## Hecho

- Estructura base del sitio y sistema de paletas por marca (`data-brand` + `data-theme`)
- Footer con iconos y toggle de tema dark/light flotante
- Hero con video de fondo y mapa de Google Maps embebido
- Sidebar mobile con menú hamburger
- 4 sub-páginas de marca (pizzería, cafetería, heladería, restaurante) con `MenuCard` y datos de menú ficticios
- Subhero con imagen de fondo en las 4 sub-páginas
- Chatbot con IA (Anthropic, `claude-haiku-4-5-20251001`) integrado, con flujo de pedido por WhatsApp
- Favicon personalizado y limpieza pre-deploy
- Botón de WhatsApp: logo oficial, color forzado independiente del tema, estilos movidos a `globals.css`, número real del comercio configurado
- Identidad visual: logo 252 Plaza en el header, favicon actualizado, tipografías Playfair Display + Lora, paleta oscura ajustada al logo
- Icono de TikTok con colores oficiales de marca
- **Plan de mejoras, Fase 1 — Seguridad de `/api/chat`** (ver `PLAN-MEJORAS-252PLAZA.md`):
  - Validación del body (400), control de `Origin` (403), rate limit nativo de Netlify por IP (429), errores del servidor solo en logs (500)
  - Límites: body de 20 KB, últimos 10 mensajes, 500 chars por mensaje del usuario y 2000 por respuesta del asistente
  - Validación de los campos de `PEDIDO_LISTO`
  - ChatBot: sin envío doble, mensajes amigables por código de error, historial recortado en el cliente
- **Plan de mejoras, Fase 2 — Arreglos menores**:
  - Quitado el `@import` duplicado de `globals.css` en `Layout.astro`
  - Sin parpadeo del tema: `data-brand` y `data-theme` pasaron de `<body>` a `<html>`, con un script inline en el `<head>`
  - `ThemeToggle`: estilos inline pasados a `<style>`, regla `.theme-toggle` sin uso eliminada
  - Imágenes del menú resueltas por el campo `imagen` de `menu.ts` (antes dependían del orden)

## En curso

- Plan de mejoras, **Fase 3 — Carrito multi-marca en React** (aprendizaje). Avance:
  - ✅ Paso 1: integración de React instalada (`@astrojs/react@5.0.7`, **fijada a la v5** porque la v6/v7 piden Vite 8 y Astro 6.1 usa Vite 7; con la v7 el dev server falla con `Missing field moduleType`)
  - ✅ Paso 2: primera isla de prueba (`src/components/Contador.tsx`, `useState`). Quedó sin montar en ninguna página; es solo material de aprendizaje
  - ✅ 3.3 cambios de datos: `precio` ahora es número y cada plato tiene `id` escrito a mano (`"pizzeria-napolitana"`; no derivado del nombre, para que el carrito guardado no se rompa si se corrige un nombre). `formatearPrecio` en `src/config/formato.ts` (`$390`, miles con punto). `chat.ts` usa `formatearPrecio` en las 4 líneas del menú; se verificó que el texto del prompt es idéntico al anterior. El `PEDIDO_LISTO` sigue con precio como texto
  - ✅ Paso 3: props. `BotonAgregar.tsx` recibe solo el `id` del plato (`client:visible`, dentro de `MenuCard`); la cantidad es estado del carrito, no prop. Por ahora solo hace `console.log`
  - ✅ Paso 4: listas con `.map()` y `key` (practicado con un componente de prueba que ya se borró; se provocó el aviso de React por `key` faltante). Se usa el `id` fijo del plato como `key`, no el índice
  - ⏭️ Siguiente: paso 5 (estado derivado: el total se calcula, no se guarda) y después el paso 6 (el problema de las islas, antes de arreglarlo con nanostores)
  - Pendiente menor: `astro check` no está disponible (falta `@astrojs/check`); decidir si se instala para el criterio de aceptación del plan

## Próximo / Pendiente

> Nota: esta lista es una propuesta inicial inferida del estado del código, no un backlog confirmado por el usuario. Revisar y ajustar prioridades.

- Probar el rate limit en producción después del deploy: más de 20 pedidos en un minuto desde la misma IP tienen que devolver `429` (en `astro dev` no se emula)
- **Propuesta (pendiente de OK):** unificar las 4 páginas de marca en `src/pages/[marca].astro` con `getStaticPaths`. Hoy solo cambian textos, imagen del hero y la clave del menú; el `<style>` de cada página está copiado 4 veces
- **Propuesta (pendiente de OK):** que `npm run dev` cargue el `.env` para las funciones (por ejemplo con `node --env-file-if-exists=.env`), así el chatbot funciona en local sin comandos extra
- Reemplazar los datos ficticios de `src/config/menu.ts` por el menú y precios reales de cada marca
- Evaluar si conviene agregar un `.env.example` (sin valores reales) para facilitar el onboarding de nuevos colaboradores
- Evaluar si hace falta un `netlify.toml` versionado en vez de depender solo de la config del dashboard de Netlify
