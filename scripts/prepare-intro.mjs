
import {readFile,writeFile,mkdir,rename,stat,readdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile);
const ffmpeg=path.resolve('.media-tools/node_modules/ffmpeg-static/ffmpeg.exe');
const ffprobe=path.resolve('.media-tools/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe');
const videoFolder='materiais/01-inicio/01-showreel';const photoFolder='materiais/04-sobre/01-filipe';
const videos=(await readdir(videoFolder)).filter(name=>/\.(mp4|mov|webm)$/i.test(name));const photos=(await readdir(photoFolder)).filter(name=>/\.(jpe?g|png|webp)$/i.test(name));
if(videos.length!==1||photos.length!==1)throw new Error('Seleção ambígua: confirmar os materiais antes de preparar.');
const source=path.resolve(videoFolder,videos[0]);const photo=path.resolve(photoFolder,photos[0]);
await mkdir('public/assets/photos',{recursive:true});await mkdir('public/assets/videos',{recursive:true});await mkdir('public/assets/covers',{recursive:true});
for(const [name,width,crf]of [['showreel-desktop',1080,22],['showreel-mobile',540,25]]){
 const output=path.resolve('public/assets/videos',name+'.mp4');
 if(!await stat(output).then(s=>s.size>1000).catch(()=>false)){
  console.log('Preparando '+name+'…');
  const temp=output+'.partial.mp4';
  await exec(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',source,'-map','0:v:0','-an','-vf','scale='+width+':-2,setsar=1,fps=30','-c:v','libx264','-preset','veryfast','-crf',String(crf),'-pix_fmt','yuv420p','-movflags','+faststart','-threads','3','-map_metadata','-1',temp],{windowsHide:true,maxBuffer:3e6});
  await rename(temp,output);
 }
 const {stdout}=await exec(ffprobe,['-v','error','-show_streams','-show_format','-of','json',output],{windowsHide:true,maxBuffer:3e6});const info=JSON.parse(stdout);
 if(info.streams.some(s=>s.codec_type==='audio'))throw new Error('O fundo deve ficar sem faixa de áudio.');
 console.log(name+': '+(Number(info.format.size)/1e6).toFixed(1)+' MB, sem áudio');
}
await exec(ffmpeg,['-y','-hide_banner','-loglevel','error','-ss','3','-i','public/assets/videos/showreel-desktop.mp4','-frames:v','1','-vf','scale=900:-2','-quality','85','public/assets/covers/showreel.webp'],{windowsHide:true,maxBuffer:2e6});
await exec(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',photo,'-frames:v','1','-vf','scale=1000:-2','-quality','85','public/assets/photos/filipe.webp'],{windowsHide:true,maxBuffer:2e6});
const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
data.site.showreel={src:'assets/videos/showreel-desktop.mp4',mobileSrc:'assets/videos/showreel-mobile.mp4',poster:'assets/covers/showreel.webp',sourceFile:videoFolder+'/'+videos[0]};
data.site.portrait={src:'assets/photos/filipe.webp',alt:'Filipe de Jesus',sourceFile:photoFolder+'/'+photos[0]};
data.pending=data.pending.filter(item=>!/(showreel|abertura|foto)/i.test(item));
await writeFile('public/data/portfolio.json',JSON.stringify(data,null,2)+'\n');
console.log('Foto e vídeo principal incorporados; originais preservados.');
