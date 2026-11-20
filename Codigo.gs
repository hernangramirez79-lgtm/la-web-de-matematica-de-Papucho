/**
 * Matemática 1 en Juego — registro de intentos y resumen diario por mail.
 *
 * Va pegado en Extensiones → Apps Script de una planilla de Google Sheets.
 * - doPost: la web le manda cada intento y se anota como una fila en la hoja "Intentos".
 *   La foto de la hoja del alumno se guarda en la carpeta de Drive "Matemática 1 en Juego – Fotos"
 *   y su link queda en la columna "Foto".
 * - enviarResumenDiario: todas las noches manda al profe el resumen de las últimas 24 horas.
 * - instalar: se corre UNA vez a mano para preparar la hoja y programar el mail diario.
 */

const HOJA = 'Intentos';
const MAIL_PROFE = '';            // Vacío = el mail de la cuenta de Google que instala el script.
const HORA_RESUMEN = 23;          // El mail sale entre las 23:45 y las 00:15 (Google tiene un margen de ±15 min).
const MINUTO_RESUMEN = 59;
const CARPETA_FOTOS = 'Matemática 1 en Juego – Fotos';

const COLS = ['Fecha', 'Alumno', 'N.°', 'Dispositivo', 'Capítulo', 'Tema', 'Ejercicio', 'Enunciado',
  'Respondió', 'Correcta', 'Resultado', 'Intento', 'Máx. intentos', 'Puntos', 'Puntos totales', 'Foto'];
const C = { fecha: 0, alumno: 1, numero: 2, dispositivo: 3, capitulo: 4, tema: 5, ejercicio: 6, enunciado: 7,
  respuesta: 8, correcta: 9, resultado: 10, intento: 11, max: 12, puntos: 13, total: 14, foto: 15 };

/* ---------- Recibir intentos desde la web ---------- */

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const fecha = new Date();
    const fotoUrl = guardarFoto_(d, fecha);   // fuera del lock: subir a Drive puede tardar unos segundos
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      hoja_().appendRow([
        fecha,
        texto_(d.alumno) || 'Sin nombre',
        texto_(d.numero),
        texto_(d.dispositivo),
        Number(d.capitulo) || '',
        texto_(d.tema),
        texto_(d.ejercicio),
        texto_(d.enunciado),
        texto_(d.respuesta),
        texto_(d.correcta),
        texto_(d.resultado),
        Number(d.intento) || '',
        Number(d.maxIntentos) || '',
        Number(d.puntos) || 0,
        Number(d.totalPuntos) || 0,
        fotoUrl,
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Guarda la foto (data URL JPEG/PNG en base64) en la carpeta de fotos y devuelve su link, o '' si no vino foto. */
function guardarFoto_(d, fecha) {
  try {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(d.foto || ''));
    if (!m) return '';
    const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
    const limpio = v => String(v || '').replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ .-]/g, '').trim().slice(0, 40);
    const nombre = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd HH.mm') + ' - ' +
      (limpio(d.alumno) || 'Sin nombre') + ' - ej ' + limpio(d.ejercicio) + ' - intento ' + (Number(d.intento) || '') +
      ' - ' + limpio(d.resultado) + '.' + ext;
    const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nombre);
    return carpetaFotos_().createFile(blob).getUrl();
  } catch (err) {
    return 'No se pudo guardar la foto: ' + String(err).slice(0, 120);
  }
}

function carpetaFotos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_FOTOS_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* la borraron: se crea otra */ }
  }
  const carpeta = DriveApp.createFolder(CARPETA_FOTOS);
  props.setProperty('CARPETA_FOTOS_ID', carpeta.getId());
  return carpeta;
}

/** Abrir la URL de la app web en el navegador muestra este mensaje: sirve para comprobar que está publicada. */
function doGet() {
  return ContentService.createTextOutput('Registro de "Matemática 1 en Juego" funcionando.');
}

/* ---------- Resumen diario ---------- */

function enviarResumenDiario() {
  const datos = hoja_().getDataRange().getValues();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filas = datos.slice(1).filter(r => r[C.fecha] instanceof Date && r[C.fecha] >= desde);
  const tz = Session.getScriptTimeZone();
  const hoy = Utilities.formatDate(new Date(), tz, 'd/M/yyyy');
  const para = MAIL_PROFE || Session.getEffectiveUser().getEmail();
  const asunto = 'Matemática 1 en Juego — resumen del ' + hoy;

  if (!filas.length) {
    MailApp.sendEmail({ to: para, subject: asunto, name: 'Matemática 1 en Juego',
      body: 'Hoy nadie hizo ejercicios.', htmlBody: '<p>Hoy nadie hizo ejercicios.</p>' });
    return;
  }

  // Agrupar por alumno (nombre + número de camiseta).
  const porAlumno = {};
  filas.forEach(r => {
    const k = String(r[C.alumno]).trim().toLowerCase() + '|' + r[C.numero];
    (porAlumno[k] = porAlumno[k] || []).push(r);
  });

  const td = 'style="border:1px solid #DCD5F2;padding:6px 8px;text-align:left"';
  const th = 'style="border:1px solid #DCD5F2;padding:6px 8px;text-align:left;background:#EFEBFA;color:#211A4A"';
  let html = '<div style="font-family:Arial,sans-serif;color:#211A4A">' +
    '<h2 style="color:#3B2A8C;margin:0 0 4px">Matemática 1 en Juego</h2>' +
    '<p style="margin:0 0 16px">Resumen del ' + hoy + ' (últimas 24 horas)</p>';
  let txt = 'Matemática 1 en Juego — resumen del ' + hoy + '\n\n';
  const erroresPorTema = {};

  Object.keys(porAlumno).sort().forEach(k => {
    const rs = porAlumno[k].sort((a, b) => a[C.fecha] - b[C.fecha]);
    const nombre = rs[0][C.alumno], num = rs[0][C.numero];
    const ejercicios = new Set(rs.map(r => r[C.ejercicio])).size;
    const bien = rs.filter(r => r[C.resultado] === 'correcto').length;
    const errores = rs.filter(r => r[C.resultado] === 'incorrecto').length;
    const sinIntentos = rs.filter(r => r[C.resultado] === 'sin intentos').length;
    const puntos = Math.max.apply(null, rs.map(r => Number(r[C.total]) || 0));

    html += '<h3 style="color:#D9157A;margin:18px 0 4px">' + esc_(nombre) + (num !== '' ? ' (N.° ' + esc_(num) + ')' : '') + '</h3>' +
      '<p style="margin:0 0 8px">Ejercicios: <b>' + ejercicios + '</b> · Bien: <b>' + bien + '</b> · Errores: <b>' + errores +
      '</b> · Sin intentos: <b>' + sinIntentos + '</b> · Puntos totales: <b>' + puntos + '</b></p>' +
      '<table style="border-collapse:collapse;font-size:13px"><tr><th ' + th + '>Hora</th><th ' + th + '>Ejercicio</th><th ' + th +
      '>Respondió</th><th ' + th + '>Resultado</th><th ' + th + '>Intento</th><th ' + th + '>Puntos</th><th ' + th + '>Hoja</th></tr>';
    txt += nombre + (num !== '' ? ' (N.° ' + num + ')' : '') + ' — ejercicios: ' + ejercicios + ', bien: ' + bien +
      ', errores: ' + errores + ', sin intentos: ' + sinIntentos + ', puntos totales: ' + puntos + '\n';

    rs.forEach(r => {
      const hora = Utilities.formatDate(r[C.fecha], tz, 'HH:mm');
      const ok = r[C.resultado] === 'correcto';
      const res = ok ? 'correcto' : r[C.resultado] + ' (era ' + r[C.correcta] + ')';
      const color = ok ? '#18917D' : '#C62D3A';
      html += '<tr><td ' + td + '>' + hora + '</td><td ' + td + '>' + esc_(r[C.ejercicio] + ' · ' + r[C.tema]) + '</td><td ' + td + '>' +
        esc_(r[C.respuesta]) + '</td><td ' + td.replace('text-align:left', 'text-align:left;font-weight:bold;color:' + color) + '>' +
        esc_(res) + '</td><td ' + td + '>' + r[C.intento] + ' de ' + r[C.max] + '</td><td ' + td + '>' + r[C.puntos] + '</td><td ' + td + '>' +
        (/^https:\/\//.test(String(r[C.foto] || '')) ? '<a href="' + esc_(r[C.foto]) + '">ver foto</a>' : '—') + '</td></tr>';
      txt += '  ' + hora + '  ' + r[C.ejercicio] + ' · ' + r[C.tema] + ' — respondió ' + r[C.respuesta] + ' — ' + res +
        ' — intento ' + r[C.intento] + ' de ' + r[C.max] +
        (/^https:\/\//.test(String(r[C.foto] || '')) ? ' — foto: ' + r[C.foto] : '') + '\n';
      if (!ok) erroresPorTema[r[C.tema]] = (erroresPorTema[r[C.tema]] || 0) + 1;
    });
    html += '</table>';
    txt += '\n';
  });

  const temas = Object.keys(erroresPorTema).sort((a, b) => erroresPorTema[b] - erroresPorTema[a]).slice(0, 3);
  if (temas.length) {
    const linea = 'Para repasar: ' + temas.map(t => t + ' (' + erroresPorTema[t] + (erroresPorTema[t] === 1 ? ' error)' : ' errores)')).join(', ') + '.';
    html += '<p style="margin-top:18px;padding:8px 12px;background:#FFF3D3;border-left:4px solid #F5B400">' + esc_(linea) + '</p>';
    txt += linea + '\n';
  }
  html += '</div>';

  MailApp.sendEmail({ to: para, subject: asunto, body: txt, htmlBody: html, name: 'Matemática 1 en Juego' });
}

/* ---------- Instalación (correr una vez) ---------- */

function instalar() {
  const sh = hoja_();
  // Colores por resultado.
  const rg = sh.getRange('K2:K');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('correcto').setBackground('#DFF4EF').setRanges([rg]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('incorrecto').setBackground('#FCE4E6').setRanges([rg]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('sin intentos').setBackground('#F6C3CA').setRanges([rg]).build(),
  ]);
  // Mail diario: borra el anterior si existía y crea uno nuevo.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'enviarResumenDiario')
    .forEach(t => ScriptApp.deleteTrigger(t));
  carpetaFotos_();   // crea la carpeta de fotos (y pide el permiso de Drive)
  ScriptApp.newTrigger('enviarResumenDiario').timeBased().everyDays(1).atHour(HORA_RESUMEN).nearMinute(MINUTO_RESUMEN).create();
  probarMail();
}

function probarMail() {
  const para = MAIL_PROFE || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({ to: para, name: 'Matemática 1 en Juego', subject: 'Matemática 1 en Juego — mail de prueba',
    body: 'Si recibiste este mail, el registro y el resumen diario están bien configurados.\n\n' +
      'Las fotos de las hojas se guardan en tu Drive, en la carpeta: ' + carpetaFotos_().getUrl() });
}

/* ---------- Utilidades ---------- */

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if (!sh) sh = ss.insertSheet(HOJA);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#3B2A8C').setFontColor('#FFFFFF');
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  }
  return sh;
}

/** Texto seguro para la planilla: corta largos y evita que algo escrito por un alumno se tome como fórmula. */
function texto_(v) {
  let s = String(v == null ? '' : v).slice(0, 300);
  if (/^[=+@]/.test(s) || (/^-/.test(s) && isNaN(Number(s)))) s = "'" + s;
  return s;
}

function esc_(v) {
  return String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
