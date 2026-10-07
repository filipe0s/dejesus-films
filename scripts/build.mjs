
import './check.mjs';
import {readFile,cp,mkdir,writeFile,rm} from 'node:fs/promises';
import {verifyProduction} from './verify-production.mjs';

const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
const preview=process.argv.includes('--preview');
if(!preview){
  const failures=[];
  if(data.site.preview)failures.push('site.preview deve ser false');
  if(!data.site.contentApproved)failures.push('aprovar o conteúdo antes de preparar produção');
  if(!data.projects.length)failures.push('incluir trabalhos reais');
  for(const group of data.groups)if(!data.projects.some(p=>p.group===group.id))failures.push('faltam trabalhos de '+group.title);
  for(const service of data.services)if(!service.exampleProjectId)failures.push('falta exemplo real de '+service.name);
  const events=data.projects.filter(p=>p.group==='eventos');
  if(!events.some(p=>p.deliveryPhase==='during'))failures.push('falta cobertura realtime (deliveryPhase: during)');
  if(!events.some(p=>p.deliveryPhase==='after'))failures.push('falta filme posterior (deliveryPhase: after)');
  if(failures.length)throw new Error('Produção bloqueada: '+failures.join('; '));
}
const domain=new URL(data.site.domain).origin;
if(data.site.domain!==domain||!domain.startsWith('https://'))throw new Error('Usar domínio HTTPS sem caminho ou barra final.');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let html=await readFile('public/index.html','utf8');
const title=html.match(/<title>([^<]+)<\/title>/)[1];
const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
const image=domain+'/assets/covers/social-preview.jpg';
const seo=[
  `<link rel="canonical" href="${domain}/">`,
  '<meta property="og:type" content="website">',
  '<meta property="og:locale" content="pt_BR">',
  `<meta property="og:site_name" content="${escape(data.site.brand)}">`,
  `<meta property="og:title" content="${escape(title)}">`,
  `<meta property="og:description" content="${description}">`,
  `<meta property="og:url" content="${domain}/">`,
  `<meta property="og:image" content="${image}">`,
  `<meta property="og:image:secure_url" content="${image}">`,
  '<meta property="og:image:type" content="image/jpeg">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta property="og:image:alt" content="Frame do showreel da deJesus Films">',
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:title" content="${escape(title)}">`,
  `<meta name="twitter:description" content="${description}">`,
  `<meta name="twitter:image" content="${image}">`,
  '<meta name="twitter:image:alt" content="Frame do showreel da deJesus Films">'
].join('\n  ');
html=html.replace('</head>','  '+seo+'\n</head>');
data.site.preview=preview;
if(!preview){
  html=html.replace('noindex, nofollow','index, follow')
    .replace(/<div class="preview-banner[\s\S]*?<\/div>/,'')
    .replace(/<span class="temporary-note">[\s\S]*?<\/span>/,'')
    .replace(/<span class="footer-preview">[\s\S]*?<\/span>/,'');
  data.previewSlots=[];
  delete data.pending;
  for(const record of [...data.projects,...(data.serviceExamples||[])]){delete record.metadataPending;delete record.sourceFile;}
  delete data.site.showreel.sourceFile;delete data.site.portrait.sourceFile;
}
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await writeFile('dist/index.html',html);
await writeFile('dist/data/portfolio.json',JSON.stringify(data,null,2)+'\n');
if(!preview){
  await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+domain+'/sitemap.xml\n');
  await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+domain+'/</loc></url></urlset>\n');
  await verifyProduction();
}else{
  await writeFile('dist/robots.txt','User-agent: *\nDisallow: /\n');
  await rm('dist/sitemap.xml',{force:true});
}
console.log(preview?'Prévia compilada em dist. Não publicar.':'Versão de produção preparada e verificada em dist. Nada foi publicado.');
