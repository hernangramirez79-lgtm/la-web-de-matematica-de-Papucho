# Matemática 1 en Juego

Material de Matemática de 1.er año armado por Hernan Ramirez a partir del índice de *Matemática 1 – Nuevo Dinámica*:

- **Una web de ejercicios con puntajes** (`docs/index.html`): 86 ejercicios de los 49 temas, corrección automática, 3 intentos por ejercicio, ayudas paso a paso, festejos futboleros con sonido y niveles de premios. Los alumnos entran desde el navegador, sin cuentas.
- **Registro para el profe** (`apps-script/`): cada intento de cada alumno se anota en una planilla de Google Sheets del profe, y todas las noches llega un mail con el resumen del día.
- **El Manual del Profesor** (`manual/`): resumen teórico de los 49 temas, con un ejemplo básico de cada uno, en PDF para imprimir.

## Estructura

```
matematica-1-en-juego/
├── docs/
│   └── index.html            La web completa (un solo archivo). GitHub Pages la publica desde esta carpeta.
├── apps-script/
│   ├── Codigo.gs             Registro de intentos en Google Sheets + mail diario
│   └── appsscript.json       Zona horaria y permisos del script
├── manual/
│   ├── Manual_del_Profesor_Hernan.pdf
│   ├── manual.tpl.html       Fuente del manual
│   ├── render.py             Convierte fracciones y raíces del fuente a HTML
│   └── pdf.js                Genera el PDF con Chromium (Playwright)
└── automatizacion/
    └── resumen-diario.md     Versión anterior del mail diario (para la web publicada dentro de Claude)
```

## Puesta en marcha (una sola vez, unos 15 minutos)

### 1. La planilla y el registro (Google Sheets + Apps Script)

1. En Google Drive, creá una planilla nueva. Ponele de nombre, por ejemplo, **Matemática 1 en Juego – Registro**.
2. En la planilla: **Extensiones → Apps Script**.
3. Borrá lo que aparece en `Código.gs` y pegá todo el contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs). Guardá (ícono del disquete).
4. En **Configuración del proyecto** (el engranaje), poné la zona horaria **(GMT-03:00) Buenos Aires**.
5. Arriba, elegí la función **`instalar`** y tocá **Ejecutar**. Google te va a pedir permisos (planilla, Drive para guardar las fotos, enviar mails y ejecutar a horario): aceptalos. Si dice "Google no verificó esta app", tocá *Configuración avanzada → Ir a … (no seguro)*: es tu propio script.
   - Esto prepara la hoja **Intentos**, crea en tu Drive la carpeta **Matemática 1 en Juego – Fotos**, programa el mail diario para las 23:59 y te manda un **mail de prueba** con el link a esa carpeta.
6. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier persona**
   - Tocá **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`).
7. Pegá esa URL en `docs/index.html`, en la línea:
   ```js
   const REGISTRO_URL="";
   ```
   quedando `const REGISTRO_URL="https://script.google.com/macros/s/…/exec";`

> Si más adelante cambiás el código del script, usá **Implementar → Administrar implementaciones → Editar → Nueva versión** para que la URL siga siendo la misma.

### 2. Publicar la web (GitHub Pages)

1. Subí este repositorio a GitHub.
2. En el repositorio: **Settings → Pages → Build and deployment**: *Source* **Deploy from a branch**, rama **main**, carpeta **/docs**. Guardá.
3. En uno o dos minutos la web queda en `https://TU_USUARIO.github.io/matematica-1-en-juego/`. Ese es el link para los chicos.

## Cómo funciona para los alumnos

- **Cada vez que entran** aparece una ventana de bienvenida donde escriben su **nombre** y su **número de camiseta** (obligatorios); la camiseta se va dibujando mientras escriben. Queda precargado lo de la vez anterior y arriba hay un botón **Cambiar jugador**.
- Cada ejercicio se resuelve en la hoja: para enviarlo tienen que escribir el resultado **y subir una foto de la hoja**. Si se equivocan, tienen que corregir la hoja y subir una foto nueva. Los puntos se dan según el resultado escrito; el profe revisa el procedimiento en las fotos.
- El progreso y los puntos se guardan en el navegador de cada alumno: si cambia de celu o borra los datos del navegador, arranca de cero (el registro del profe no se pierde).
- Si no hay internet al enviar, el intento queda guardado y se manda solo cuando vuelve la conexión (si cierran la página antes, se manda el intento sin la foto).

## Qué ve el profe

- **La planilla**: una fila por intento con fecha, alumno, número, ejercicio, tema, qué respondió, la respuesta correcta, el resultado (verde = correcto, rojo = incorrecto o sin intentos), intento, puntos y el **link a la foto de la hoja**. Se puede filtrar y ordenar como cualquier planilla.
- **Las fotos**: en tu Drive, carpeta **Matemática 1 en Juego – Fotos**, con nombres como `2026-11-20 17.40 - Mateo Pérez - ej 1a - intento 1 - incorrecto.jpg`. La web las achica antes de mandarlas (unos 100 KB cada una).
- **El mail diario** (alrededor de las 23:59; Google lo corre con ±15 minutos de margen), a la cuenta de Google que instaló el script: por alumno, ejercicios hechos, bien, errores, sin intentos y puntos; la tabla de cada intento con el link a cada foto; y los temas para repasar. Si ese día nadie hizo ejercicios, llega igual avisándolo.
- Para mandar el mail a otra dirección, completá `MAIL_PROFE` al principio de `Codigo.gs`.

## Ajustes de la web

Al principio del bloque "Corrector con foto" de `docs/index.html`:

| Constante | Valor actual | Qué hace |
|---|---|---|
| `REGISTRO_URL` | `""` | URL de la app web de Apps Script. Vacía = no se registra en la planilla. |
| `FOTO` | `true` | Exige la foto de la hoja en cada envío. En la web pública la foto se guarda en el Drive del profe; dentro de claude.ai, además, Claude revisa el procedimiento antes de dar los puntos. En `false`, alcanza con el resultado. |
| `MAXT` | `3` | Intentos por ejercicio. |

Los ejercicios están en `CAPS`, las explicaciones de cada tema en `REC`, el paso a paso de cada ejercicio en `EXPL` y los niveles de premios en `PRIZES`.

**Puntos:** 10 al primer intento, 6 al segundo (o con pista), 3 al tercero. Niveles: Bronce 100, Plata 250, Oro 450, Diamante 700 (premios "a definir").

## Límites a tener en cuenta

- La URL del registro es pública dentro de la página: alguien que sepa programar podría mandar filas falsas a la planilla. Para un curso alcanza; si pasara, se borran las filas.
- Los puntos viven en el navegador de cada alumno, así que un alumno con conocimientos técnicos podría modificarlos. El registro de la planilla es el que vale.
- Google permite unos 100 mails por día con una cuenta gratuita; el script manda uno solo por día.

## El manual (`manual/`)

Para regenerar el PDF después de editar `manual.tpl.html`:

```bash
npm install playwright
npx playwright install chromium
python3 render.py manual.tpl.html manual.html
node pdf.js "$PWD/manual.html" "$PWD/Manual_del_Profesor_Hernan.pdf"
```

En el fuente, `F(a|b)` es una fracción, `R(|x)` una raíz cuadrada, `R(3|x)` una raíz cúbica y `PER(3)` un período.

## Nota

El libro *Matemática 1 – Nuevo Dinámica* no se incluye en este repositorio. Los textos, ejercicios y explicaciones de este proyecto son propios y siguen el orden de su índice.
