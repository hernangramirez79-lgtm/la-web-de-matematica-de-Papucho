const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+process.argv[2],{waitUntil:'networkidle'});
await p.pdf({path:process.argv[3],format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="width:100%;text-align:center;font-size:8px;color:#3B2A8C;font-family:Inter">Manual del Profesor (Hernan) · Matemática 1 — <span class="pageNumber"></span></div>',margin:{top:'14mm',bottom:'16mm',left:'14mm',right:'14mm'}});
await b.close();})();
