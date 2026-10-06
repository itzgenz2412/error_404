const LUMI_TTS_KEY = "lumi_ultimate_settings";
const DEFAULT_VOICE = "en_US-hfc_female-medium";
let _mod = null, _loading = null, _audio = null;

function getSettings(){ try{return JSON.parse(localStorage.getItem(LUMI_TTS_KEY)||"{}")}catch{return{}} }
function getVoice(){ return getSettings().piper_voice || DEFAULT_VOICE }
function getRate(){ const n=Number(getSettings().tts_rate); return Number.isFinite(n)&&n>0?n:1 }

async function getPiper(){
  if(_mod) return _mod;
  if(_loading) return _loading;
  _loading = import("https://esm.sh/@mintplex-labs/piper-tts-web").then(m=>{
    _mod = m.default || m;
    return _mod;
  }).catch(e=>{ _loading=null; throw e; });
  return _loading;
}

export async function speakLumi(text, opts={}){
  const clean = String(text||"").trim();
  if(!clean) return;
  if(_audio){ try{_audio.pause()}catch{} _audio=null }
  const tts = await getPiper();
  const voiceId = opts.voice || opts.voiceId || getVoice();
  const wav = await tts.predict({ text: clean, voiceId: voiceId });
  const url = URL.createObjectURL(wav);
  const audio = new Audio(url);
  audio.playbackRate = getRate();
  _audio = audio;
  audio.onended = ()=>{ URL.revokeObjectURL(url); if(_audio===audio) _audio=null };
  await audio.play();
}

export function stopLumiSpeech(){
  if(_audio){ try{_audio.pause()}catch{} try{_audio.currentTime=0}catch{} _audio=null }
}

export async function downloadLumiVoice(voiceOrProgress, maybeProgress){
  const tts = await getPiper();
  let voiceId, onProgress;
  if(typeof voiceOrProgress === "function"){
    voiceId = getVoice();
    onProgress = voiceOrProgress;
  }else if(typeof voiceOrProgress === "string"){
    voiceId = voiceOrProgress || getVoice();
    onProgress = maybeProgress;
  }else{
    voiceId = getVoice();
    onProgress = maybeProgress;
  }
  const wrapped = (p)=>{
    if(!onProgress) return;
    // normalize for MB display
    onProgress({ loaded: p?.loaded||0, total: p?.total||0, raw: p });
  };
  return await tts.download(voiceId, wrapped);
}

export async function listLumiVoices(){
  const t = await getPiper();
  return await t.voices();
}
export async function storedLumiVoices(){
  const t = await getPiper();
  try{ return await t.stored(); }catch{ return [] }
}
export async function removeLumiVoice(id=getVoice()){
  const t = await getPiper();
  return await t.remove(id);
}
export async function clearLumiVoiceCache(){
  const t = await getPiper();
  return await t.flush();
}

window.LumiPiper = {
  speak: speakLumi,
  stop: stopLumiSpeech,
  download: downloadLumiVoice,
  voices: listLumiVoices,
  stored: storedLumiVoices,
  remove: removeLumiVoice,
  clearCache: clearLumiVoiceCache
};