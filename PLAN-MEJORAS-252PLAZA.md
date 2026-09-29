# PLAN DE MEJORAS — 252 Plaza

> Documento preparado el 27/09/2026 a partir de una revisión completa del código.
> **Claude Code: leé este archivo entero antes de hacer cualquier cosa.** Después leé `CLAUDE.md` y `ROADMAP.md`.

---

## 0. Instrucciones para Claude Code

### 0.1 Quién soy y cómo quiero trabajar

- Soy NH. Vengo de **Astro, HTML/CSS avanzado y JS vanilla**. **React es nuevo para mí.**
- Este plan tiene dos objetivos: **arreglar problemas reales** del sitio y **aprender React** construyendo algo útil.
- Quiero un aprendizaje **socrático pero ágil**: preguntame antes de resolver, dejame escribir las partes clave y corregime después. No me des bloques enteros de código terminado en las fases de aprendizaje.
- Trabajamos **una fase por vez**. Al terminar cada fase: resumí qué cambió, qué aprendí y esperá mi confirmación antes de seguir.
- Respetá todas las reglas de `CLAUDE.md` (theming con `var(--brand-*)`, botón de WhatsApp, número de WhatsApp, system prompt, secretos).

### 0.2 Modelo y nivel de esfuerzo — recomendámelo SIEMPRE

**Antes de empezar cada fase**, decime:
1. Qué modelo conviene y con qué nivel de esfuerzo (usá `/model` para ver cuáles tengo disponibles).
2. Por qué: el riesgo de la tarea, cuántos archivos toca y si es una conversación larga de aprendizaje o una tarea corta y precisa.
3. Si conviene activar el estilo de aprendizaje (`/output-style` → Learning) para esa fase.

Punto de partida sugerido (ajustalo si tenés mejores criterios o si los modelos disponibles cambiaron):

| Fase | Tipo de tarea | Modelo sugerido | Esfuerzo | Output style |
|---|---|---|---|---|
| 1. Seguridad `/api/chat` | Pocos archivos, pero un error cuesta dinero (API key expuesta a abuso) | El más capaz disponible (familia Opus) | Alto | Normal: quiero entender el razonamiento, pero que quede bien |
| 2. Arreglos menores | Cambios chicos y mecánicos | Rápido y económico (Sonnet o Haiku) | Bajo | Normal |
| 3. Carrito en React | Conversación larga, muchas idas y vueltas didácticas | Sonnet | Medio | **Learning** |
| 4. ChatBot a React (opcional) | Refactor de código en producción | Sonnet (Opus si se complica) | Medio o alto | **Learning** |

### 0.3 Qué NO tocar sin preguntarme

- `netlify/functions/chat.ts` → la constante `systemPrompt` (el tono del asistente en producción). La Fase 1 toca **la validación**, no el prompt.
- El número de WhatsApp (`WHATSAPP_NUMBER` en `ChatBot.astro`). Si hace falta reusarlo, **proponé** moverlo a `src/config/` y esperá mi OK.
- `.env` y cualquier secreto. Nunca leerlo en voz alta, nunca commitearlo.
- Los precios de `src/config/menu.ts` son **ficticios**. Se pueden cambiar de formato, pero no hay que tomarlos como reales.

---

## 1. Fase 1 — Seguridad del endpoint `/api/chat` (PRIORIDAD ALTA)

### 1.1 El problema

`netlify/functions/chat.ts` recibe `messages` del cliente y los pasa **directo** a la API de Anthropic, sin ninguna validación:

```ts
const { messages } = await req.json();
const response = await client.messages.create({ ..., messages });
```

Consecuencias:
- **Cualquiera puede usar el endpoint como un Claude gratis pagado por nosotros.** Puede mandar conversaciones enormes, textos larguísimos o miles de pedidos por minuto desde un script.
- **Se puede inyectar historial falso.** El cliente decide los `role` (`user` / `assistant`), así que puede fabricar respuestas "del asistente" para manipular al modelo.
- **No hay límite de pedidos por IP.**
- Si `req.json()` falla o `messages` no es un array, el error cae en el `catch` general sin distinguir entre un error del cliente y uno del servidor.
- `response.content[0]` puede no existir. No se chequea el largo del array.

### 1.2 Qué hay que implementar

Guiame paso a paso y explicame el **porqué** de cada validación:

1. **Validar la forma del body:**
   - `messages` tiene que ser un array no vacío.
   - Cada elemento: `role` ∈ `{"user","assistant"}` y `content` de tipo `string`.
   - El último mensaje tiene que ser `role: "user"`.
   - Si algo falla → `400` con un mensaje genérico.
2. **Límites de tamaño:**
   - Quedarse solo con los **últimos 10 mensajes** (`slice(-10)`), asegurando que el primero de ese recorte sea `user` (la API de Anthropic lo exige).
   - Cortar cada `content` a un máximo razonable (por ejemplo, 500 caracteres).
   - Rechazar el body si supera un tamaño total (por ejemplo, 10 KB).
3. **Controlar el origen:** aceptar solo pedidos cuyo `Origin` sea el dominio de producción o `localhost` en desarrollo. No es seguridad fuerte (se puede falsificar desde un script), pero corta el abuso casual desde otros sitios.
4. **Rate limiting:** investigá si la versión actual de Netlify Functions permite configurar `rateLimit` en el `config` de la función (por IP). Si se puede, aplicalo (por ejemplo, 20 pedidos por minuto por IP). Si no, proponé la alternativa más simple.
5. **Robustez de la respuesta:**
   - Chequear que exista `process.env.ANTHROPIC_API_KEY` y, si falta, responder `500` sin exponer detalles.
   - Buscar el primer bloque `type === "text"` en vez de asumir `content[0]`.
   - Separar los errores: `400` (el cliente mandó algo inválido), `429` (demasiados pedidos) y `500` (falla nuestra o de la API). Loguear el error real con `console.error` del lado del servidor, nunca devolverlo al cliente.
6. **Validar `PEDIDO_LISTO`:** después del `JSON.parse`, verificar que `plato`, `precio`, `nombre` y `hora` sean strings no vacíos y de largo razonable antes de devolverlos.

### 1.3 Del lado del cliente (`ChatBot.astro`)

- **Envío doble:** mientras se espera la respuesta, deshabilitar el input y el botón (o usar una bandera `enviando`). Hoy, si se aprieta Enter dos veces rápido, se mandan dos pedidos.
- Manejar las respuestas `400`, `429` y `500` con mensajes amigables distintos. Por ejemplo, para un `429`: "Estás escribiendo muy rápido, esperá un momento".
- Hoy `historial` crece sin límite. Aunque el servidor ya recorte, conviene recortarlo también en el cliente.

### 1.4 Cómo probar

- Desde la terminal, con `curl` o un script chico: body vacío, `messages` que no es array, `role: "system"`, un mensaje de 50.000 caracteres, 30 pedidos seguidos. Cada caso tiene que devolver el código correcto.
- Una conversación normal de pedido tiene que seguir funcionando igual que antes, incluido el botón de WhatsApp.

---

## 2. Fase 2 — Arreglos menores

1. **Import duplicado:** en `src/layouts/Layout.astro`, el bloque `<style is:global>@import '../styles/globals.css';</style>` está repetido. Dejar uno solo. (Ya figura en `ROADMAP.md`).
2. **Parpadeo del tema (FOUC):** `ThemeToggle.astro` aplica el tema recién cuando corre su `<script>` (que va al final del body y es un módulo). En modo oscuro, la página puede verse clara un instante. Solución: un `<script is:inline>` **en el `<head>` de `Layout.astro`** que lea `localStorage` / `prefers-color-scheme` y ponga `data-theme` antes del primer pintado.
   - Ojo: hoy `data-theme` se pone en `<body>`, y el `<body>` todavía no existe cuando corre un script en el `<head>`. Evaluá conmigo si conviene moverlo a `<html>` (y ajustar los selectores de `globals.css`) o usar otra estrategia. **Explicame el trade-off antes de decidir.**
3. **CSS sin uso:** en `ThemeToggle.astro`, la regla `.theme-toggle` no se aplica a nada (el botón usa `id="themeToggle"` y estilos inline). Limpiar y pasar los estilos inline a un `<style>`.
4. **Imágenes del menú asignadas por posición:** las páginas hacen `imagenes[i]`, así que la foto depende del **orden** y no del plato. Si alguien reordena `menu.ts`, las fotos quedan cruzadas. Resolverlo usando el campo `imagen` que ya existe en `menu.ts`, con `import.meta.glob` sobre `src/assets/images/*.webp` o con un mapa. **Este arreglo es requisito de la Fase 3.**
5. **Las 4 páginas de marca son casi idénticas** (`pizzeria.astro`, `cafeteria.astro`, etc.): solo cambian textos, la imagen del hero y la clave del menú. Evaluar si conviene una ruta dinámica `src/pages/[marca].astro` con `getStaticPaths`. **Solo proponerlo y explicarlo**; no hacerlo sin mi OK.

---

## 3. Fase 3 — Carrito de pedido multi-marca con React (APRENDIZAJE)

### 3.1 Por qué esta mejora

- Hoy solo se puede pedir **un plato por vez**, y solo a través del chatbot. En un patio de comidas lo natural es "una pizza + un helado + dos cafés".
- Es el tipo de proyecto de mi nicho freelance: **catálogo + carrito + cierre por WhatsApp**. Quiero tenerlo funcionando para mostrarlo.
- Obliga a aprender, en orden: `useState`, listas, estado derivado y **estado compartido entre islas de Astro**.

### 3.2 Qué tiene que hacer

- **Botón "Agregar"** en cada `MenuCard` (isla React chica, `client:visible`).
- **Carrito flotante** visible en las 4 páginas (isla React en `Layout.astro`, `client:load` o `client:idle`: explicame la diferencia). Tiene que:
  - Mostrar un contador de ítems en el ícono.
  - Al abrirse, listar los platos **agrupados por marca**, con botones + / − y quitar.
  - Mostrar subtotales por marca y el total general.
  - Botón **"Enviar pedido por WhatsApp"**, que arma el mensaje con todos los platos, cantidades, total, nombre y hora de llegada (con dos inputs en el carrito).
  - Botón "Vaciar carrito".
- **Persistencia en `localStorage`**: el carrito no se pierde al navegar entre `/pizzeria` y `/heladeria`.
- **Estilos:** solo `var(--brand-*)`. El botón de WhatsApp reusa `.btn-whatsapp` de `globals.css`.
- **Posición:** hoy el ChatBot está abajo a la izquierda y el ThemeToggle abajo a la derecha. Proponé dónde va el carrito sin que se pisen, sobre todo en mobile.

### 3.3 Cambios de datos necesarios

- `precio` hoy es un string (`"$390"`) y **no se puede sumar**. Pasar a `precio: 390` (número) y formatear al mostrar (`Intl.NumberFormat`).
  - ⚠️ `chat.ts` arma el system prompt con `p.precio`. Al cambiar el formato hay que ajustar esa línea para que el prompt siga mostrando `$390`. **Es un cambio de formato, no de contenido del prompt, pero avisame antes.**
- Agregar un `id` único a cada plato (ej. `"pizzeria-napolitana"`) para identificarlo en el carrito.
- Agregar la marca (`marca: "pizzeria"`) o derivarla de la clave del objeto.

### 3.4 Plan de aprendizaje (un concepto por paso)

En cada paso: **primero preguntame cómo lo haría en vanilla JS**, después mostrame la versión React y la diferencia.

1. `npx astro add react` → explicame qué cambió en `astro.config.mjs`, `package.json` y `tsconfig.json`.
2. **Primera isla:** un botón contador aislado (`useState`). Entender que el componente **se vuelve a ejecutar** cuando cambia el estado.
3. **Props:** el botón "Agregar" recibe el plato por props desde `MenuCard.astro`. Diferencia entre props de Astro y props de React.
4. **Listas:** el carrito renderiza un array con `.map()` y `key`. Por qué `key` importa.
5. **Estado derivado:** el total **se calcula**, no se guarda en el estado. Por qué guardar el total aparte es un error típico.
6. **El problema de las islas:** dos islas separadas no comparten estado de React. Mostrame el problema funcionando mal **antes** de arreglarlo.
7. **`nanostores` + `@nanostores/react`:** la solución que recomienda la documentación de Astro. Store del carrito, acciones (`agregar`, `quitar`, `cambiarCantidad`, `vaciar`) y `useStore`.
8. **Persistencia:** `@nanostores/persistent` o `localStorage` a mano; evaluemos juntos cuál conviene.
9. **Armar el mensaje de WhatsApp** y `encodeURIComponent`. Reusar el número de WhatsApp **solo con mi OK** (ver 0.3).
10. **Medir:** comparar el peso del JS del build (`npm run build`) antes y después de agregar React. Explicame qué es `client:*` en términos de JS que descarga el visitante.

### 3.5 Criterios de aceptación

- [ ] Se puede agregar un plato de cada una de las 4 marcas y el carrito los muestra agrupados.
- [ ] Al navegar entre páginas, el carrito se mantiene.
- [ ] El total es correcto con cantidades mayores a 1.
- [ ] El mensaje de WhatsApp sale legible, con saltos de línea y acentos correctos.
- [ ] Funciona en mobile (375 px) sin pisarse con el ChatBot ni con el ThemeToggle.
- [ ] Funciona en tema claro y oscuro, y con la paleta de cada marca.
- [ ] Accesibilidad básica: botones con `aria-label` y el carrito se puede cerrar con `Esc`.
- [ ] `npm run build` pasa sin errores ni warnings de TypeScript (`npx astro check`).

---

## 4. Fase 4 (opcional) — Pasar el ChatBot a React

Solo después de terminar la Fase 3 y con mi OK.

- Es el mejor ejercicio de "antes y después": el `ChatBot.astro` actual crea el DOM a mano con `createElement` e `innerHTML`, que es justo lo que React reemplaza con estado + JSX.
- Estado: `abierto`, `mensajes[]`, `input`, `enviando`.
- **Integración con el carrito:** cuando el asistente detecta un pedido, en vez de mostrar solo el botón de WhatsApp, podría **agregar el plato al carrito** usando el mismo store de nanostores.
- No cambiar el `systemPrompt` sin avisar. Si la integración necesita cambiar el formato de `PEDIDO_LISTO`, proponelo primero.

---

## 5. Al cerrar cada sesión

- Actualizar `ROADMAP.md`: qué quedó hecho, qué está en curso y qué sigue.
- Si se agregan variables de entorno, sumarlas a un `.env.example` **sin valores reales**.
- Recordarme hacer commit con un mensaje descriptivo por fase.

---

## 6. Primer mensaje sugerido para arrancar

```
Leé PLAN-MEJORAS-252PLAZA.md, CLAUDE.md y ROADMAP.md.
Decime qué modelo y nivel de esfuerzo recomendás para la Fase 1 y por qué,
y cuando te confirme, empezamos.
```
