# 252 Plaza

Sitio web de 252 Plaza, un mercado gastronómico ubicado en Ruta 5, Km 252, Paso de los Toros, Uruguay.

Incluye una landing principal y 4 sub-marcas con su propia identidad visual: **Del Tomate** (pizzería), **Modo Café** (cafetería), **Chelato** (heladería) y **El Paso** (restaurante). Cada sub-página muestra su menú y permite hacer un pedido conversando con un asistente virtual con IA, que arma el pedido y lo envía por WhatsApp.

## Stack

- [Astro](https://astro.build) + TypeScript
- Netlify (adapter + funciones serverless)
- Anthropic Claude (chatbot del asistente virtual)

## Estructura del proyecto

```
/
├── public/                    # assets estáticos (favicon, video del hero, etc.)
├── src/
│   ├── pages/                 # index + pizzeria, cafeteria, heladeria, restaurante
│   ├── components/            # Header, Footer, ChatBot, ThemeToggle, MenuCard, SubBrandCard
│   ├── layouts/Layout.astro   # layout compartido
│   ├── config/menu.ts         # datos del menú por marca
│   └── styles/globals.css     # design tokens (paletas por marca y tema)
├── netlify/functions/chat.ts  # endpoint /api/chat del chatbot
└── package.json
```

## Instalación y desarrollo

```sh
npm install
```

Crear un archivo `.env` en la raíz con la clave de la API de Anthropic:

```
ANTHROPIC_API_KEY=tu_api_key
```

Levantar el servidor de desarrollo:

```sh
npm run dev
```

El sitio queda disponible en `localhost:4321`.

## Comandos

| Comando                   | Acción                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Instala dependencias                             |
| `npm run dev`             | Inicia el servidor de desarrollo en `localhost:4321` |
| `npm run build`           | Genera el build de producción en `./dist/`       |
| `npm run preview`         | Previsualiza el build localmente antes de deployar |
| `npm run astro ...`       | Corre comandos de la CLI de Astro (`astro add`, `astro check`, etc.) |
| `npm run astro -- --help` | Ayuda de la CLI de Astro                         |

## Documentación adicional

Para el estado actual del proyecto, historial de cambios y próximos pasos, ver [ROADMAP.md](./ROADMAP.md).

## Más información sobre Astro

[Documentación de Astro](https://docs.astro.build) · [Discord de Astro](https://astro.build/chat)
