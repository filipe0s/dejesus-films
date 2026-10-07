
import {readFile,writeFile,mkdir,stat,rename} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile);
const ffmpeg=path.resolve('.media-tools/node_modules/ffmpeg-static/ffmpeg.exe');
const ffprobe=path.resolve('.media-tools/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe');
const entries=[
 {id:'marcas',slotId:'previa-reel',group:'marcas',source:'02-portfolio/01-video-marcas/video-marcas.mp4.mp4',title:'Vídeo para marcas',service:'Filmmaker mobile',order:1},
 {id:'campanha',slotId:'previa-criativo',group:'marcas',source:'02-portfolio/03-anuncio/anuncio.mp4',title:'Criativo de anúncio',service:'Anúncios + gestão de tráfego',order:3},
 {id:'realtime',slotId:'previa-realtime',group:'eventos',source:'02-portfolio/04-stories-realtime/stories-realtime.mp4.mp4',title:'Stories durante o evento',service:'Storymaker',deliveryPhase:'during',order:1},
 {id:'evento-vertical',slotId:'previa-evento',group:'eventos',source:'02-portfolio/05-filme-evento/filme-evento.mp4.MP4',title:'Filme de evento · vertical',service:'Filmmaker mobile',deliveryPhase:'after',order:2},
 {id:'evento-horizontal',slotId:'previa-evento',group:'eventos',source:'02-portfolio/05-filme-evento/filme-horizontal-evento.mp4.mov',title:'Filme de evento · horizontal',service:'Filmmaker mobile',deliveryPhase:'after',order:3},
 {id:'melhores-momentos',slotId:'previa-momentos',group:'eventos',source:'02-portfolio/06-melhores-momentos/melhores-momentos.mp4.mp4',title:'Melhores momentos',service:'Edição de vídeos',deliveryPhase:'after',order:4},
 {id:'servico-storymaker',serviceId:'storymaker',source:'03-servicos/01-storymaker/storymaker.mp4.mp4',title:'Storymaker',service:'Storymaker'},
 {id:'servico-filmmaker',serviceId:'filmmaker',source:'03-servicos/02-filmmaker/filmmaker.mp4',title:'Filmmaker mobile',service:'Filmmaker mobile'},
 {id:'servico-edicao',serviceId:'edicao',source:'03-servicos/03-edicao/edicao.mp4.MP4',title:'Edição de vídeos',service:'Edição de vídeos'},
 {id:'servico-social',serviceId:'social',source:'03-servicos/04-social-media/social-media.mp4.mp4',title:'Social media',service:'Social media'},
 {id:'servico-anuncios',serviceId:'anuncios',source:'03-servicos/05-anuncios-trafego/anuncios-trafego.mp4.mp4',title:'Anúncios + gestão de tráfego',service:'Anúncios + gestão de tráfego'}
];
await mkdir('public/assets/videos',{recursive:true});await mkdir('public/assets/covers',{recursive:true});await mkdir('.media-tools',{recursive:true});
async function probe(file){const {stdout}=await exec(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{maxBuffer:4e6,windowsHide:true});return JSON.parse(stdout);}
const records=[];
for(const entry of entries){
 const source=path.resolve('materiais',entry.source);const info=await probe(source);const video=info.streams.find(s=>s.codec_type==='video');
 const rotation=Math.abs(video.side_data_list?.find(s=>s.rotation!==undefined)?.rotation||0);
 const swap=rotation%180===90;const width=swap?video.height:video.width;const height=swap?video.width:video.height;
 const size=(await stat(source)).size;const duration=Number(info.format.duration);const format=width<height?'9:16':'16:9';
 const record={...entry,width,height,format,duration,sourceBytes:size,codec:video.codec_name,colorTransfer:video.color_transfer,cover:'assets/covers/'+entry.id+'.webp',media:{type:'video',src:'assets/videos/'+entry.id+'.mp4'}};records.push(record);
 console.log(JSON.stringify({id:entry.id,format,width,height,seconds:Math.round(duration),MB:Math.round(size/1e6),codec:video.codec_name,hdr:video.color_transfer}));
}
await writeFile('.media-tools/inventory.json',JSON.stringify(records,null,2));
if(process.argv.includes('--probe-only'))process.exit(0);
async function prepare(record){
 const input=path.resolve('materiais',record.source);const output=path.resolve('public',record.media.src);const cover=path.resolve('public',record.cover);
 const portrait=record.width<record.height;
 const scale='scale=w='+(portrait?720:1280)+':h='+(portrait?1280:720)+':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1';
 const hdr=['smpte2084','arib-std-b67'].includes(record.colorTransfer);
 const tone=hdr?'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,':'';
 const exists=await stat(output).then(s=>s.size>1000).catch(()=>false);
 if(!exists){
  console.log('Preparando '+record.id+'…');
  const temp=output+'.partial.mp4';
  await exec(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',input,'-map','0:v:0','-map','0:a:0?','-vf',scale+','+tone+'fps=30','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-threads','3','-sn','-dn',temp],{maxBuffer:5e6,windowsHide:true});
  await rename(temp,output);
 }
 const hasCover=await stat(cover).then(s=>s.size>100).catch(()=>false);
 if(!hasCover)await exec(ffmpeg,['-y','-hide_banner','-loglevel','error','-ss',String(record.id==='evento-vertical'?25:Math.min(2,record.duration/4)),'-i',output,'-frames:v','1','-vf','scale=480:854:force_original_aspect_ratio=decrease','-quality','85',cover],{maxBuffer:2e6,windowsHide:true});
 const result=await probe(output);const v=result.streams.find(s=>s.codec_type==='video');record.outputBytes=(await stat(output)).size;record.outputWidth=v.width;record.outputHeight=v.height;record.outputCodec=v.codec_name;
 console.log('Pronto: '+record.id+' ('+(record.outputBytes/1e6).toFixed(1)+' MB)');
}
let next=0;async function worker(){while(next<records.length){const record=records[next++];await prepare(record);}}
await Promise.all([worker(),worker()]);
await writeFile('.media-tools/inventory.json',JSON.stringify(records,null,2));
console.log('11 mídias e capas preparadas. Originais preservados.');
