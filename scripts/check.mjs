
import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
assert.equal(typeof data.site.preview,'boolean');
const domain=new URL(data.site.domain);
assert.equal(domain.protocol,'https:');assert.equal(domain.origin,data.site.domain);
if(!data.site.preview)assert.equal(data.site.contentApproved,true,'Conteúdo de produção deve estar aprovado');
assert.equal(data.site.whatsapp,'5575988796387');
assert.equal(data.groups.length,2);
assert(data.groups.some(g=>g.title==='Cobertura realtime + filmes de eventos'));
const records=[...data.projects,...(data.serviceExamples||[])];
const ids=new Set();
for(const record of [...records,...data.previewSlots,...data.services]){assert(record.id);assert(!ids.has(record.id),'ID repetido: '+record.id);ids.add(record.id);}
for(const p of records){
 if(p.group)assert(data.groups.some(g=>g.id===p.group));
 assert(p.title&&p.service&&p.description&&p.cover&&p.media?.src,'Mídia incompleta: '+p.id);
 assert(p.role||p.metadataPending,'Participação não confirmada nem marcada como pendente: '+p.id);
 assert(['video','image','embed'].includes(p.media.type));
 for(const source of [p.cover,p.media.src]){
   if(!/^https:\/\//.test(source)){const target=path.resolve('public',source);assert(target.startsWith(path.resolve('public')+path.sep));await access(target);}
 }
}
assert(!data.services.some(service=>service.id==='design'),'Serviço de design deve permanecer removido');
for(const service of data.services){assert(service.message&&service.description&&service.delivery);if(service.exampleProjectId)assert(records.some(p=>p.id===service.exampleProjectId));const link=new URL('https://wa.me/'+data.site.whatsapp+'?text='+encodeURIComponent(service.message));assert.equal(link.searchParams.get('text'),service.message);}
for(const source of [data.site.portrait?.src,data.site.showreel?.src,data.site.showreel?.mobileSrc,data.site.showreel?.poster].filter(Boolean)) {
 const target=path.resolve('public',source);assert(target.startsWith(path.resolve('public')+path.sep));await access(target);
}
const html=await readFile('public/index.html','utf8');
assert(html.includes('lang="pt-BR"'));
for(const id of ['inicio','portfolio','servicos','sobre','contato'])assert(html.includes('id="'+id+'"'));
assert(!/instagram/i.test(html));
new vm.Script(await readFile('public/app.js','utf8'));
for(const asset of ['styles.css','app.js','data/portfolio.json','assets/favicon.svg','assets/covers/social-preview.jpg'])await access('public/'+asset);
console.log('Verificação concluída: dados, contatos, mídias, referências e sintaxe válidos.');
