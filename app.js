const $=id=>document.getElementById(id);
const chat=$("chat"), input=$("input"), backendUrl=$("backendUrl"), statusEl=$("status");
let history=JSON.parse(localStorage.getItem("mai_history")||"[]"), kill=false, pending=null, lastReply="";
backendUrl.value=localStorage.getItem("mai_backend")||"";

function save(){localStorage.setItem("mai_history",JSON.stringify(history.slice(-50)))}
function add(who,text,saveIt=true){const d=document.createElement("div");d.className="msg "+(who==="You"?"you":who==="Assistant"?"assistant":"system");d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;if(saveIt){history.push({who,text});save()}}
history.forEach(x=>add(x.who,x.text,false));
if(!history.length)add("Assistant","আসসালামু আলাইকুম। আমি My AI Assistant V4। বাংলা বা English-এ লিখুন/বলুন।",false);

$("saveUrl").onclick=()=>{let u=backendUrl.value.trim().replace(/\/+$/,"");localStorage.setItem("mai_backend",u);backendUrl.value=u;statusEl.textContent=u?"Backend URL saved":"No backend — local commands only"};
$("kill").onclick=()=>{kill=!kill;$("kill").textContent=`Kill switch: ${kill?"ON":"OFF"}`;add("System",kill?"Kill switch চালু। Action বন্ধ থাকবে।":"Kill switch বন্ধ।",true)};
$("send").onclick=()=>submit();
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit()}});
document.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>{input.value=b.dataset.command;submit()});

function sensitive(t){const s=t.toLowerCase();return /delete|মুছে|password|পাসওয়ার্ড|send money|টাকা পাঠা|factory reset/.test(s)}
function localCommand(t){
 const s=t.toLowerCase().trim();
 if(/^(হ্যালো|হাই|hello|hi|সালাম|আসসালামু আলাইকুম)$/.test(s)) return "ওয়ালাইকুম আসসালাম। আমি আপনার My AI Assistant V4।";
 if(s.includes("সময়")||s.includes("time")) return "এখন সময় "+new Date().toLocaleTimeString("bn-BD");
 if(s.includes("তারিখ")||s.includes("date")||s.includes("আজ কত")) return "আজ "+new Date().toLocaleDateString("bn-BD",{dateStyle:"full"});
 if(s.includes("কি করতে পার")||s.includes("what can you do")||s==="help") return "আমি AI chat, বাংলা voice input, voice reply, Google search এবং কয়েকটি safe web shortcut দিতে পারি।";
 const apps=[["youtube","https://www.youtube.com"],["ইউটিউব","https://www.youtube.com"],["chrome","https://www.google.com"],["ক্রোম","https://www.google.com"],["gmail","https://mail.google.com"],["জিমেইল","https://mail.google.com"],["maps","https://maps.google.com"],["ম্যাপ","https://maps.google.com"],["whatsapp","https://web.whatsapp.com"],["হোয়াটসঅ্যাপ","https://web.whatsapp.com"],["facebook","https://www.facebook.com"],["ফেসবুক","https://www.facebook.com"],["instagram","https://www.instagram.com"],["ইনস্টাগ্রাম","https://www.instagram.com"],["telegram","https://web.telegram.org"]];
 for(const [k,u] of apps) if(s.includes(k)){window.open(u,"_blank","noopener");return "ওয়েব version খুলেছি: "+k}
 if(s.includes("search")||s.includes("সার্চ")||s.includes("খুঁজে")||s.includes("অনুসন্ধান")){
   let q=s.replace(/^.*?(search|সার্চ|খুঁজে|অনুসন্ধান)/,"").trim()||t;
   window.open("https://www.google.com/search?q="+encodeURIComponent(q),"_blank","noopener");return "Google search খুলেছি: "+q;
 }
 return null;
}
async function submit(){
 const t=input.value.trim();if(!t)return;input.value="";add("You",t);
 if(kill){add("Assistant","Kill switch চালু আছে। আগে এটি OFF করুন.");return}
 if(sensitive(t)){pending=t;$("confirmText").textContent=t;$("confirm").classList.remove("hidden");return}
 await run(t);
}
$("confirmYes").onclick=async()=>{const t=pending;pending=null;$("confirm").classList.add("hidden");await run(t)};
$("confirmNo").onclick=()=>{pending=null;$("confirm").classList.add("hidden");add("Assistant","Cancelled.")};

async function run(t){
 const local=localCommand(t);if(local){add("Assistant",local);speak(local);return}
 const base=backendUrl.value.trim().replace(/\/+$/,"");
 if(!base){add("Assistant","AI chat চালাতে Backend URL সেট করুন। তবে local commands এখনই কাজ করবে।");return}
 setBusy(true);
 try{
  const h=history.slice(-11,-1).map(x=>({role:x.who==="You"?"user":"assistant",content:x.text}));
  const r=await fetch(base+"/command",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:t,history:h})});
  const data=await r.json();if(!r.ok)throw new Error(data.detail||"Server error");
  lastReply=data.reply||"";add("Assistant",lastReply);speak(lastReply);statusEl.textContent="Connected";
 }catch(e){add("Assistant","Backend error: "+e.message);statusEl.textContent="Backend connection failed"}finally{setBusy(false)}
}
function setBusy(v){document.body.classList.toggle("busy",v);statusEl.textContent=v?"AI is thinking…":statusEl.textContent}
function speak(t){if("speechSynthesis"in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t))}}
$("speakLast").onclick=()=>{if(lastReply)speak(lastReply)};
$("voice").onclick=()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){add("System","এই browser-এ voice recognition support নেই। Chrome-এ চেষ্টা করুন.");return}
 const r=new SR();r.lang="bn-BD";r.interimResults=false;r.maxAlternatives=1;
 r.onstart=()=>statusEl.textContent="শুনছি…";
 r.onerror=e=>statusEl.textContent="Voice error: "+e.error;
 r.onresult=e=>{input.value=e.results[0][0].transcript;submit()};
 r.onend=()=>statusEl.textContent="Ready";r.start();
};
let deferred;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(!deferred)return;deferred.prompt();deferred=null;$("installBtn").classList.add("hidden")};
if("serviceWorker"in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
