
import {readFile,writeFile} from 'node:fs/promises';
const records=JSON.parse(await readFile('.media-tools/inventory.json','utf8'));
if(records.some(r=>!r.outputBytes))throw new Error('Aguardar conclusão da preparação dos 11 vídeos.');
const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
data.services=data.services.filter(service=>service.id!=='design');
const descriptions={marcas:'Vídeo fornecido para a frente de marcas e profissionais.',campanha:'Peça em vídeo fornecida como exemplo de criativo de anúncio.',realtime:'Exemplo fornecido de stories produzidos durante uma cobertura.', 'evento-vertical':'Filme vertical fornecido como exemplo de edição após o evento.','evento-horizontal':'Filme horizontal fornecido como exemplo de edição após o evento.','melhores-momentos':'Vídeo fornecido de melhores momentos editados após o evento.'};
const base=r=>({id:r.id,title:r.title,service:r.service,description:descriptions[r.id]||'Vídeo fornecido como exemplo do serviço de '+r.service+'.',format:r.format,cover:r.cover,coverAlt:'Frame do vídeo fornecido: '+r.title,media:r.media,client:null,role:null,metadataPending:true,sourceFile:'materiais/'+r.source,durationSeconds:r.duration});
data.projects=records.filter(r=>r.group).map(r=>({...base(r),group:r.group,slotId:r.slotId,order:r.order,...(r.deliveryPhase?{deliveryPhase:r.deliveryPhase}:{})}));
data.serviceExamples=records.filter(r=>r.serviceId).map(r=>({...base(r),serviceId:r.serviceId}));
for(const service of data.services)service.exampleProjectId=data.serviceExamples.find(example=>example.serviceId===service.id)?.id||null;
data.previewSlots=data.previewSlots.filter(slot=>!data.projects.some(project=>project.slotId===slot.id)).map(slot=>({...slot,order:slot.id==='previa-institucional'?2:0}));
data.pending=['Vídeo de abertura / showreel','Vídeo institucional','Foto de Filipe (opcional)','Títulos, clientes quando aplicável e participação confirmada de Filipe nos trabalhos enviados'];
await writeFile('public/data/portfolio.json',JSON.stringify(data,null,2)+'\n');
const map=JSON.parse(await readFile('materiais/MAPA-DAS-MIDIAS.json','utf8'));
map.notes=['11 vídeos reais incorporados na prévia local; originais preservados.','Design removido do site por solicitação do usuário. A pasta original foi preservada.','Filme de evento possui dois exemplos: vertical 9:16 e horizontal 16:9.'];
for(const slot of map.slots){
 if(slot.id==='design'){slot.status='removido do site';continue;}
 const matches=records.filter(r=>r.slotId===slot.id||r.serviceId===slot.id);
 if(matches.length){slot.receivedFiles=matches.map(r=>r.source.split('/').at(-1));slot.status='incorporado na prévia; identificação editorial pendente';slot.siteMedia=matches.map(r=>r.media.src);}
}
await writeFile('materiais/MAPA-DAS-MIDIAS.json',JSON.stringify(map,null,2)+'\n');
console.log('Integrados '+data.projects.length+' vídeos de portfólio e '+data.serviceExamples.length+' exemplos de serviço. Design removido.');
