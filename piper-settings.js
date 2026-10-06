// piper-setting.js - Lumi by Deris - Final
import { listLumiVoices, downloadLumiVoice, storedLumiVoices } from "./lumi-tts.js";

const PIPER_DEFAULT = "en_US-hfc_female-medium";

function formatMB(b){ 
  if(!Number.isFinite(b)||b<=0) return "0.00 MB"; 
  return (b/1024/1024).toFixed(2)+" MB"; 
}

function updateDownloadInfo(loaded,total){
  const size = document.getElementById("downloadSize");
  const perc = document.getElementById("downloadPercent");
  const bar = document.getElementById("piperProgress");
  if(!size||!perc) return;
  if(total>0){
    size.textContent = `Downloaded: ${formatMB(loaded)} / ${formatMB(total)}`;
    const pct = Math.min(100,Math.round((loaded/total)*100));
    perc.textContent = pct+"%";
    if(bar) bar.style.width = pct+"%";
  }else if(loaded>0){
    size.textContent = `Downloaded: ${formatMB(loaded)} / Calculating...`;
    perc.textContent = "...";
    if(bar) bar.style.width = "45%";
  }else{
    size.textContent = "Downloaded: 0.00 MB / 0.00 MB";
    perc.textContent = "0%";
    if(bar) bar.style.width = "0%";
  }
}

function getS(){ try{return JSON.parse(localStorage.getItem("lumi_ultimate_settings")||"{}")}catch{return{}} }
function saveS(s){ localStorage.setItem("lumi_ultimate_settings",JSON.stringify(s)) }

export async function initLumiPiperSettings(){
  let s=getS();
  if(!s.piper_voice){ s.piper_voice=PIPER_DEFAULT; s.tts_engine="piper"; saveS(s); }
  const sel=document.getElementById("piper_voice");
  const st=document.getElementById("piperStatus");
  if(!sel) return;
  if(st) st.textContent="Loading voices...";
  try{
    const voices=await listLumiVoices();
    sel.innerHTML="";
    voices.forEach(v=>{
      const id=typeof v==="string"?v:(v.key||v.id||"");
      if(!id) return;
      const o=document.createElement("option");
      o.value=id;
      o.textContent=typeof v==="string"?v:(v.name||v.key||id);
      sel.appendChild(o);
    });
    if(![...sel.options].some(o=>o.value===s.piper_voice)){
      const o=document.createElement("option"); o.value=s.piper_voice; o.textContent=s.piper_voice; sel.appendChild(o);
    }
    sel.value=s.piper_voice;
    if(st){ st.textContent="✓ Voice list ready"; st.className="key-status ok"; }
  }catch(e){
    if(st){ st.textContent="Failed: "+e.message; st.className="key-status bad"; }
  }
}

export function savePiperVoice(){
  const sel=document.getElementById("piper_voice");
  if(!sel) return;
  let s=getS();
  s.piper_voice=sel.value||PIPER_DEFAULT;
  s.tts_engine="piper";
  saveS(s);
}

export async function downloadSelectedPiperVoice(){
  const sel=document.getElementById("piper_voice");
  const voiceId=sel?.value||PIPER_DEFAULT;
  const st=document.getElementById("piperStatus");
  const bar=document.getElementById("piperProgress");
  
  savePiperVoice();
  if(bar) bar.style.width="0%";
  updateDownloadInfo(0,0);
  if(st){ st.textContent=`Downloading ${voiceId}...`; st.className="key-status bad"; }

  try{
    // FIX: now pass voiceId + progress -> fixes your e is not a function
    await downloadLumiVoice(voiceId, p=>{
      const loaded=Number(p?.loaded||0);
      const total=Number(p?.total||0);
      updateDownloadInfo(loaded,total);
      if(st){
        if(total>0) st.textContent=`Downloading... ${Math.round(loaded/total*100)}% • ${formatMB(loaded)} / ${formatMB(total)}`;
        else if(loaded>0) st.textContent=`Downloading... ${formatMB(loaded)}...`;
      }
    });
    if(bar) bar.style.width="100%";
    document.getElementById("downloadSize").textContent="Downloaded: Voice model ready";
    document.getElementById("downloadPercent").textContent="100%";
    if(st){ st.textContent=`✓ Ready & cached: ${voiceId}`; st.className="key-status ok"; }
    try{ await storedLumiVoices(); }catch{}
  }catch(e){
    if(st){ st.textContent="❌ Failed: "+e.message; st.className="key-status bad"; }
    if(bar) bar.style.width="0%";
  }
}

window.downloadSelectedPiperVoice=downloadSelectedPiperVoice;
window.initLumiPiperSettings=initLumiPiperSettings;