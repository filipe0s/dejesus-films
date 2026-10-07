
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import assert from 'node:assert/strict';
const exec=promisify(execFile);
const ffmpeg=path.resolve('.media-tools/node_modules/ffmpeg-static/ffmpeg.exe');
const ffprobe=path.resolve('.media-tools/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe');
const records=JSON.parse(await readFile('.media-tools/inventory.json','utf8'));
for(const record of records){
 const file=path.resolve('public',record.media.src);
 const {stdout}=await exec(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{windowsHide:true,maxBuffer:3e6});
 const info=JSON.parse(stdout);const video=info.streams.find(s=>s.codec_type==='video');const audio=info.streams.find(s=>s.codec_type==='audio');
 assert.equal(video.codec_name,'h264');assert.equal(video.pix_fmt,'yuv420p');assert(audio?.codec_name==='aac');
 assert(Math.abs(Number(info.format.duration)-record.duration)<0.5,'Duração alterada: '+record.id);
 assert(Math.abs(video.width/video.height-record.width/record.height)<0.002,'Proporção alterada: '+record.id);
 const bytes=await readFile(file);assert(bytes.indexOf(Buffer.from('moov'))<bytes.indexOf(Buffer.from('mdat')),'Faststart ausente: '+record.id);
 await exec(ffmpeg,['-v','error','-threads','2','-i',file,'-f','null','-'],{windowsHide:true,maxBuffer:3e6});
 console.log('Decodificação completa válida: '+record.id+' ('+video.width+'×'+video.height+')');
}
console.log('11 vídeos: duração e proporção preservadas; H.264/AAC, faststart e decodificação integral verificados.');
