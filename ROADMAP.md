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

## En curso

_(nada activo detectado al momento de esta reorganización — completar acá al cierre de la próxima sesión de trabajo)_

## Próximo / Pendiente

> Nota: esta lista es una propuesta inicial inferida del estado del código, no un backlog confirmado por el usuario. Revisar y ajustar prioridades.

- Reemplazar los datos ficticios de `src/config/menu.ts` por el menú y precios reales de cada marca
- Revisar `src/layouts/Layout.astro`: el bloque `<style is:global>@import '../styles/globals.css';</style>` está duplicado (dos veces seguidas)
- Evaluar si conviene agregar un `.env.example` (sin valores reales) para facilitar el onboarding de nuevos colaboradores
- Evaluar si hace falta un `netlify.toml` versionado en vez de depender solo de la config del dashboard de Netlify
