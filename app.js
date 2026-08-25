const API_BASE_URL = (window.THREE_DO_API_URL || "").replace(/\/$/,"");

const state={username:"",parent:"",points:0,slots:3,tasks:[],characters:[],special:false,selectedCharacter:0,level:1,weapons:["pistol"],equippedWeapon:"pistol"};
let currentTask=null;
const prices=[0,80,120,160,220,280,350,430,520,620,740,880,1040,1250,1500];
const characterHearts=Array.from({length:15},(_,i)=>i+1);
const avatars=["🧑‍🚀","🧙","🥷","🧑‍🎨","🧑‍🍳","🦸","🧝","🤖","🧑‍🚀","🧛","🧑‍🚒","🧑‍🔬","🧑‍🎤","🦹","👑"];

function save(){localStorage.setItem("threeDoList",JSON.stringify(state))}
function load(){let x=localStorage.getItem("threeDoList");if(x)Object.assign(state,JSON.parse(x))}
function startApp(){
 state.username=document.getElementById("username").value.trim()||"Player";
 state.parent=document.getElementById("parentName").value.trim()||"Parent";
 state.tasks=state.tasks.length?state.tasks:Array.from({length:state.slots},(_,i)=>({text:"",done:false}));
 document.getElementById("home").classList.add("hidden");document.getElementById("app").classList.remove("hidden");
 document.getElementById("welcome").textContent=`Hi, ${state.username}`;
 render();save();setTimeout(showGameTabInit,50)
}
function showTab(id,btn){document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");if(id==="characters")renderCharacters();if(id==="weapons")renderWeapons()}
function render(){
 document.getElementById("points").textContent=state.points;
 const list=document.getElementById("taskList");list.innerHTML="";
 for(let i=0;i<state.slots;i++){
  let t=state.tasks[i]||{text:"",done:false};state.tasks[i]=t;
  const row=document.createElement("div");row.className="task "+(t.done?"done":"");
  row.innerHTML=`<button class="check" ${t.done?"disabled":""} onclick="openProof(${i})">${t.done?"✓":""}</button><input class="task-name" ${t.done?"disabled":""} value="${esc(t.text)}" placeholder="Write Task ${i+1}" oninput="updateTask(${i},this.value)"><small>${t.done?"Completed":"Task "+(i+1)}</small>`;
  list.appendChild(row)
 }
 const completed=state.tasks.slice(0,state.slots).filter(t=>t.done).length;
 document.getElementById("progressText").textContent=`${completed} / ${state.slots} Tasks Completed`;
 document.getElementById("progressBar").style.width=(completed/state.slots*100)+"%";
 document.getElementById("slot4").classList.toggle("hidden",state.slots>=4);
 document.getElementById("slot5").classList.toggle("hidden",state.slots<4||state.slots>=5);
 let paid=document.getElementById("paidSlots");paid.innerHTML="";
 if(state.slots>=5){for(let i=6;i<=state.slots;i++){}}
}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function updateTask(i,v){state.tasks[i].text=v;save()}
function openProof(i){
 if(!state.tasks[i].text.trim()){toast("Write the task first.");return}
 currentTask=i;document.getElementById("proofTask").textContent=state.tasks[i].text;document.getElementById("proofImage").value="";document.getElementById("preview").classList.add("hidden");document.getElementById("proofModal").classList.remove("hidden")
}
function closeModal(){document.getElementById("proofModal").classList.add("hidden")}
function previewImage(e){let f=e.target.files[0];if(f){let img=document.getElementById("preview");img.src=URL.createObjectURL(f);img.classList.remove("hidden")}}
async function verifyTask(){
 const file=document.getElementById("proofImage").files[0];
 if(!file){toast("Please add a proof image.");return}
 if(state.tasks[currentTask].done)return;

 const taskText=state.tasks[currentTask].text.trim();
 const lower=taskText.toLowerCase();
 let category=null;
 if(/home\s*work|homework|study|school|assignment|worksheet|home work|واجب|واجبات|مذاكر|مذاكرة|دراسة|دروس|حل الواجب/.test(lower))category="homework";
 else if(/hang\s*out|hangout|outside|street|sidewalk|walk|go out|hanging out|خروج|شارع|رصيف|فسحة|تمشية|بره|برا|خارج/.test(lower))category="hangout";
 else if(/take\s*a\s*nap|take a nap|nap|sleep|rest|bed|bedroom|نوم|قيلولة|سرير|غرفة النوم|راحة/.test(lower))category="nap";
 else if(/workout|work\s*out|gym|exercise|training|fitness|work out|جيم|تمرين|تمرينات|رياضة|النادي/.test(lower))category="workout";

 if(!category){
   toast("For photo verification, use one of: Homework, Hang Out, Take a Nap, or Workout.",5000);
   return;
 }
 const reader=new FileReader();
 reader.onload=async()=>{
   const btn=document.querySelector("#proofModal .primary");
   const old=btn.textContent;btn.disabled=true;btn.textContent="Checking photo with AI…";
   try{
    const res=await fetch(`${API_BASE_URL}/api/verify-task`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({category,taskText,image:reader.result})
    });
    const data=await res.json();
    if(!res.ok||!data.ok)throw new Error(data.message||"Verification failed. Check that the AI backend is online.");
    if(data.verified){
      state.tasks[currentTask].done=true;state.points++;closeModal();render();save();
      toast("Verified ✓ Your parents sent you this point",4500);checkReward();
    }else{
      toast(data.reason||"Photo does not clearly prove the task. Please take a better photo.",6000);
    }
   }catch(err){
    toast(err.message||"AI verification is unavailable. Make sure the server is running and OPENAI_API_KEY is set.",8000);
   }finally{btn.disabled=false;btn.textContent=old}
 };
 reader.readAsDataURL(file);
}
function checkReward(){
 const completed=state.tasks.slice(0,state.slots).filter(t=>t.done).length;
 if(state.slots>=5&&completed>=5){const day=new Date().getDay();if([4,5,6].includes(day))toast("You currently have five points from your parents; they're supposed to prepare a gift for you. Go and get it from them.",9000)}
}
function unlockSlot(n){
 if(n===4||n===5){if(state.points<5){toast("You need 5 points.");return}state.points-=5;state.slots=n;state.tasks.push({text:"",done:false});render();save();toast(`Task Slot ${n} unlocked!`)}
}
function addPaidSlot(){if(state.points<0)return}
function renderCharacters(){
 const grid=document.getElementById("characterGrid") || document.getElementById("charactersGrid");
 if(!grid)return;
 const chars=Array.from({length:15},(_,i)=>({
   id:i, name:`Character ${i+1}`, avatar:avatars[i]||["🧑","👦","👧","🧔","👨‍🚀","🥷","🧙","🧝","🤖","🦸","🧛","🧟","👹","🐉","👑"][i],
   price:prices[i]??(i*100), hearts:characterHearts[i]||i+1
 }));
 grid.innerHTML="";
 chars.forEach(ch=>{
   const owned=(ch.id===0)||state.characters.includes(ch.id);
   const selected=state.selectedCharacter===ch.id;
   const card=document.createElement("div");
   card.className="character-card "+(selected?"selected ":"")+(owned?"owned":"locked");
   card.innerHTML=`
     <div class="avatar-big">${ch.avatar}</div>
     <h3>${ch.name}</h3>
     <div class="character-hearts">${"❤️".repeat(ch.hearts)}</div>
     <div class="character-hp">${ch.hearts} Heart${ch.hearts===1?"":"s"} • ${ch.hearts} HP</div>
     <div class="character-price">${ch.price===0?"FREE":"⭐ "+ch.price+" points"}</div>
     ${selected?'<button class="secondary" disabled>✓ SELECTED</button>':
       owned?`<button onclick="selectCharacter(${ch.id})">SELECT</button>`:
       `<button onclick="buyCharacter(${ch.id})">BUY</button>`}
   `;
   grid.appendChild(card);
 });
}
function buyCharacter(i){
 let p=prices[i]||0;
 if(state.characters.includes(i)){selectCharacter(i);return}
 if(state.points<p){toast(`You need ${p} points.`);return}
 state.points-=p;state.characters.push(i);state.selectedCharacter=i;save();renderCharacters();render();updatePlayerCharacter();toast(`Character ${i+1} unlocked and selected!`);
}
function selectCharacter(i){
 if(i!==0&&!state.characters.includes(i)){toast("Buy this character first.");return}
 state.selectedCharacter=i;save();renderCharacters();render();updatePlayerCharacter();toast(`Character ${i+1} selected • ${characterHearts[i]} hearts`);
}
function selectChar(i){
 state.selectedCharacter=i; save(); renderCharacters();
 const p=document.getElementById("player"); if(p) p.textContent=avatars[i];
 toast(`Character ${i+1} selected!`);
}

function buySpecial(){if(state.special){toast("Special character already unlocked.");return}state.special=true;save();toast("Demo purchase complete — Special Character unlocked!")}
function toast(msg,time=3500){let t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove("show"),time)}



// ---------------- Weapon Shop ----------------
const WEAPONS={
 pistol:{name:"Starter Pistol",icon:"🔫",price:0,desc:"Basic single shot. Damage 1.",damage:1,cooldown:220,shots:1,spread:0,color:"#ffd83d"},
 shotgun:{name:"Blaster Shotgun",icon:"💥",price:100,desc:"3 pellets with stronger damage. Damage 2 per pellet.",damage:2,cooldown:620,shots:3,spread:.16,color:"#ff9b4a"},
 freeze:{name:"Freeze Ray",icon:"❄️",price:220,desc:"Heavy ice shot. Damage 3 and freezes enemies.",damage:3,cooldown:780,shots:1,spread:0,color:"#7ed8ff"},
 boomerang:{name:"Power Boomerang",icon:"🪃",price:380,desc:"Heavy returning weapon. Damage 4.",damage:4,cooldown:650,shots:1,spread:0,color:"#a58cff"},
 rocket:{name:"Rocket Launcher",icon:"🚀",price:600,desc:"Massive explosive shot. Damage 6 plus splash damage.",damage:6,cooldown:1000,shots:1,spread:0,color:"#ff5c5c"}
};
function renderWeapons(){
 const grid=document.getElementById("weaponGrid"); if(!grid)return;
 document.getElementById("weaponPoints").textContent=state.points;
 grid.innerHTML="";
 Object.entries(WEAPONS).forEach(([id,w])=>{
  const owned=state.weapons.includes(id), equipped=state.equippedWeapon===id;
  const card=document.createElement("div");
  card.className="weapon-card "+(owned?"owned ":"")+(equipped?"equipped":"");
  card.innerHTML=`<div class="weapon-icon">${w.icon}</div>${equipped?'<span class="weapon-tag">EQUIPPED ✓</span>':''}
  <h3>${w.name}</h3><p>${w.desc}</p><div class="weapon-price">${w.price===0?"FREE":"⭐ "+w.price+" points"}</div>
  ${owned?`<button class="${equipped?"secondary":""}" onclick="equipWeapon('${id}')">${equipped?"Equipped ✓":"Equip"}</button>`:
  `<button onclick="buyWeapon('${id}')">${w.price===0?"Get":"Buy for "+w.price+" points"}</button>`}`;
  grid.appendChild(card);
 });
}
function buyWeapon(id){
 const w=WEAPONS[id]; if(state.weapons.includes(id)){equipWeapon(id);return}
 if(state.points<w.price){toast(`You need ${w.price} points to buy ${w.name}.`);return}
 state.points-=w.price;state.weapons.push(id);state.equippedWeapon=id;save();renderWeapons();render();toast(`${w.name} purchased and equipped!`);
}
function equipWeapon(id){
 if(!state.weapons.includes(id))return;
 state.equippedWeapon=id;save();renderWeapons();toast(`${WEAPONS[id].name} equipped!`);
}

// ---------------- Stable Mario-style platformer engine ----------------
const LEVELS = [
 {name:"Green Hills", difficulty:"Very Easy", length:2800, enemies:2, coins:6},
 {name:"Mushroom Valley", difficulty:"Very Easy+", length:3200, enemies:3, coins:7},
 {name:"Night Forest", difficulty:"Easy", length:3600, enemies:5, coins:5},
 {name:"Lava Road", difficulty:"Easy+", length:4000, enemies:7, coins:6},
 {name:"Castle Run", difficulty:"Medium", length:4400, enemies:9, coins:7},
 {name:"Ice Caverns", difficulty:"Medium+", length:4800, enemies:11, coins:5},
 {name:"Sky Kingdom", difficulty:"Hard", length:5200, enemies:13, coins:6},
 {name:"Monster Valley", difficulty:"Hard+", length:5600, enemies:15, coins:7},
 {name:"Dark Castle", difficulty:"Expert", length:6000, enemies:17, coins:5},
 {name:"Volcano Fortress", difficulty:"Expert+", length:6400, enemies:19, coins:6},
 {name:"Cloud Peaks", difficulty:"Expert+", length:6800, enemies:21, coins:7},
 {name:"Haunted Woods", difficulty:"Expert+", length:7200, enemies:23, coins:5},
 {name:"Crystal Caves", difficulty:"Expert++", length:7600, enemies:25, coins:6},
 {name:"Desert Ruins", difficulty:"Expert++", length:8000, enemies:27, coins:7},
 {name:"Storm Valley", difficulty:"Expert++", length:8400, enemies:29, coins:5},
 {name:"Frozen Castle", difficulty:"Nightmare", length:8800, enemies:31, coins:6},
 {name:"Poison Swamp", difficulty:"Nightmare", length:9200, enemies:33, coins:7},
 {name:"Thunder Plains", difficulty:"Nightmare", length:9600, enemies:35, coins:5},
 {name:"Shadow Kingdom", difficulty:"Nightmare+", length:10000, enemies:37, coins:6},
 {name:"Dragon Road", difficulty:"Nightmare+", length:10400, enemies:39, coins:7},
 {name:"Ancient Temple", difficulty:"Nightmare+", length:10800, enemies:41, coins:5},
 {name:"Red Canyon", difficulty:"Nightmare++", length:11200, enemies:43, coins:6},
 {name:"Moon Base", difficulty:"Nightmare++", length:11600, enemies:45, coins:7},
 {name:"Fire Kingdom", difficulty:"Nightmare++", length:12000, enemies:47, coins:5},
 {name:"Pirate Bay", difficulty:"Nightmare+++", length:12400, enemies:49, coins:6},
 {name:"Deep Forest", difficulty:"Nightmare+++", length:12800, enemies:51, coins:7},
 {name:"Iron Fortress", difficulty:"Nightmare+++", length:13200, enemies:53, coins:5},
 {name:"Broken Sky", difficulty:"Insane", length:13600, enemies:55, coins:6},
 {name:"Demon Castle", difficulty:"Insane+", length:14000, enemies:57, coins:7},
 {name:"Ultimate Kingdom", difficulty:"Final", length:14400, enemies:60, coins:5}
];
let unlockedLevels=Number(localStorage.getItem("threeDoUnlockedLevels")||1);
let completedLevels=JSON.parse(localStorage.getItem("threeDoCompletedLevels")||"[]");
let selectedLevel=1;
let gameRAF=null, keys={left:false,right:false};
let G=null;

function renderLevelMenu(){
 const box=document.getElementById("levelButtons"); if(!box)return;
 box.innerHTML="";
 LEVELS.forEach((l,i)=>{
  const n=i+1, unlocked=n<=unlockedLevels, done=completedLevels.includes(n);
  const b=document.createElement("button");
  b.className="level-button "+(done?"done ":"")+(unlocked?"":"locked");
  b.innerHTML=`${done?"🏆":"🎮"} Level ${n}<small>${l.name} • ${l.difficulty} ${unlocked?"":"• 🔒 Locked"}</small>`;
  b.disabled=!unlocked;
  if(unlocked)b.onclick=()=>startLevel(n);
  box.appendChild(b);
 });
}
const gameMusic=new Audio();
gameMusic.preload="auto";
gameMusic.loop=true;
gameMusic.volume=0.32;
let musicMuted=false;
let musicReady=false;
async function loadGameMusic(){
 // The uploaded Sonic Adventure track is bundled directly with the game.
 // No server request is required, so it also works when index.html is opened directly.
 gameMusic.src="assets/sonic_adventure.mp3";
 gameMusic.load();
 musicReady=true;
 return true;
}

async function startGameMusic(){
 gameMusic.muted=musicMuted;
 try{
   if(!musicReady){
     const ok=await loadGameMusic();
     if(!ok)return;
   }
   await gameMusic.play();
 }catch(e){
   // Browsers may delay playback until another user gesture; the level button is a user gesture.
 }
}

loadGameMusic();
function stopGameMusic(){gameMusic.pause();gameMusic.currentTime=0;}
function toggleGameMusic(){musicMuted=!musicMuted;gameMusic.muted=musicMuted;const b=document.getElementById("musicBtn");if(b)b.textContent=musicMuted?"🔇":"🎵";}
function startLevel(n){
 selectedLevel=n;
 document.getElementById("levelMenu").classList.add("hidden");
 document.getElementById("gameStage").classList.remove("hidden");
 document.getElementById("stageTitle").textContent=`Level ${n} — ${LEVELS[n-1].name}`;
 document.getElementById("stageStatus").textContent=`Defeat the boss 👹 then reach the end • ${characterHearts[state.selectedCharacter||0]} HP`;
 document.getElementById("gameMessage").textContent="";
 document.getElementById("gameMessage").className="game-message";
 initGame(n);
 startGameMusic();
}
function backToLevels(){
 const hs=document.getElementById("heartShop"); if(hs)hs.classList.add("hidden");
 const stage=document.getElementById("gameStage"); if(stage)stage.classList.add("hidden");
 const menu=document.getElementById("levelMenu"); if(menu)menu.classList.remove("hidden");
 stopGameMusic();
 G=null;
 render();
}
function makePlatforms(level){
 const w=LEVELS[level-1].length, p=[];
 p.push({x:0,y:430,w:620,h:90});
 let x=680;
 let i=0;
 const difficulty=Math.max(0,level-1);
 while(x<w-420){
  const gap=Math.min(240,95+Math.floor(difficulty*4)+(i%4)*15);
  const width=Math.max(185,270-Math.floor(difficulty*2)+(i%3)*35);
  const height=(i%5===0 && level>4?80:90);
  p.push({x,y:430,w:width,h:height});
  if(level>=3 && i%2===1)p.push({x:x+65,y:330,w:125,h:20});
  if(level>=5 && i%4===2)p.push({x:x+170,y:265,w:120,h:20});
  x+=width+gap;i++;
 }
 p.push({x:w-420,y:430,w:420,h:90});
 return p;
}
function makeCoins(level, platforms){
 const out=[]; const target=LEVELS[level-1].coins;
 let i=0;
 for(const p of platforms){
  if(p.w<100)continue;
  const count=Math.min(3,Math.max(1,Math.floor(p.w/125)));
  for(let k=0;k<count && out.length<target;k++){
   out.push({x:p.x+45+k*70,y:p.y-38,r:11,got:false});
  }
  if(out.length>=target)break;i++;
 }
 return out;
}
function makeEnemies(level, platforms){
 const target=LEVELS[level-1].enemies, out=[];
 const types=["walker","walker","fast","jumper","flying","armored"];
 for(let i=1;i<platforms.length && out.length<target;i++){
  const p=platforms[i];
  if(p.w<130)continue;
  const type=types[out.length%types.length];
  if(type==="flying"){
   out.push({type,x:p.x+p.w*.55,y:p.y-150,w:34,h:30,vx:1.4,min:p.x+20,max:p.x+p.w-50,baseY:p.y-150,phase:out.length,alive:true,frozen:0,attackTimer:70+out.length*10,damage:1+Math.floor((level-1)/12),hp:2+Math.floor((level-1)/10),maxHp:2+Math.floor((level-1)/10)});
  }else{
   out.push({type,x:p.x+p.w*.55,y:p.y-30,w:type==="armored"?34:28,h:type==="armored"?34:30,
     vx:(out.length%2?1:-1)*(type==="fast"?2.1:1.25),min:p.x+15,max:p.x+p.w-43,
     alive:true,frozen:0,jumpTimer:60+(out.length*17)%90,hp:(type==="armored"?3:2)+Math.floor((level-1)/8),maxHp:(type==="armored"?3:2)+Math.floor((level-1)/8),damage:type==="armored"?2:1+Math.floor((level-1)/15)});
  }
 }
 return out;
}

const BOSS_TYPES=[
 {name:"Stone Golem",icon:"👹",color:"#6b6874",baseHp:18,weapon:"Stone Cannon",attack:"stone"},
 {name:"Fire Beast",icon:"🐲",color:"#d94b38",baseHp:24,weapon:"Fireball",attack:"fire"},
 {name:"Ice Titan",icon:"👾",color:"#58b9e8",baseHp:30,weapon:"Ice Shards",attack:"ice"},
 {name:"Dark Dragon",icon:"🐉",color:"#7d55b8",baseHp:38,weapon:"Dark Triple Shot",attack:"dark"},
 {name:"Lava King",icon:"🔥",color:"#e46a28",baseHp:46,weapon:"Lava Bomb",attack:"lava"},
 {name:"Sky Demon",icon:"😈",color:"#596fd6",baseHp:55,weapon:"Sky Rain",attack:"sky"},
 {name:"Crystal Monster",icon:"💎",color:"#35bca8",baseHp:64,weapon:"Crystal Beam",attack:"crystal"},
 {name:"Shadow Beast",icon:"👿",color:"#44364f",baseHp:74,weapon:"Shadow Burst",attack:"shadow"},
 {name:"Ancient Dragon",icon:"🐲",color:"#ad6a3a",baseHp:86,weapon:"Dragon Barrage",attack:"dragon"},
 {name:"Volcano Lord",icon:"🌋",color:"#c94d31",baseHp:100,weapon:"Volcano Bombs",attack:"volcano"},
 {name:"Nightmare King",icon:"☠️",color:"#31333d",baseHp:115,weapon:"Nightmare Homing",attack:"nightmare"},
 {name:"Ultimate Boss",icon:"👺",color:"#9b3157",baseHp:135,weapon:"Ultimate Cannon",attack:"ultimate"}
];

const HAZARD_TYPES=[
 {type:"spikes",icon:"🔺",w:42,h:28,damage:2},
 {type:"fire",icon:"🔥",w:46,h:38,damage:2},
 {type:"pit",icon:"🕳️",w:100,h:25,damage:3},
 {type:"smallFire",icon:"🔥",w:34,h:24,damage:1}
];
function makeHazards(level){
 // No fire, spikes, pits, or other ground hazards.
 return [];
}

function makeBoss(level){
 const p=G ? G.platforms[G.platforms.length-1] : null;
 const b=BOSS_TYPES[(level-1)%BOSS_TYPES.length];
 return {
  type:"boss",name:b.name,icon:b.icon,color:b.color,
  x:LEVELS[level-1].length-300,y:350,w:80,h:80,
  min:LEVELS[level-1].length-390,max:LEVELS[level-1].length-110,
  vx:1.15+(level*.025),alive:true,
  maxHp:Math.max(8,Math.floor(b.baseHp*0.55)+(level-1)*4),hp:Math.max(8,Math.floor(b.baseHp*0.55)+(level-1)*4),
  attackTimer:0,attackCooldown:70,jumpTimer:100,phase:level,weapon:b.weapon,attack:b.attack
 };
}

function initGame(level,preserveLives=null){
 const canvas=document.getElementById("platformer"),ctx=canvas.getContext("2d");
 const L=LEVELS[level-1], platforms=makePlatforms(level);
 const fullLives=characterHearts[state.selectedCharacter||0]||1;
 const startLives=preserveLives===null?fullLives:Math.min(fullLives,Math.max(0,preserveLives));
 G={level,ctx,canvas,width:L.length,height:520,x:80,y:360,vx:0,vy:0,w:34,h:52,onGround:false,camera:0,lives:startLives,maxLives:fullLives,coins:makeCoins(level,platforms),enemies:makeEnemies(level,platforms),platforms,won:false,dead:startLives<=0,inv:0,projectiles:[],enemyProjectiles:[],explosions:[],hazards:makeHazards(level),airThreats:[],airSpawnTimer:120,lastShot:0,boss:null,bossSpawned:false};
 updateGameHud(); updatePlayerCharacter();
 if(gameRAF)cancelAnimationFrame(gameRAF);
 gameLoop();
}
function updateGameHud(){
 if(!G)return;
 document.getElementById("lives").textContent=`${"❤️".repeat(Math.max(0,G.lives))} ${G.lives}/${G.maxLives||G.lives}`;
 document.getElementById("gameCoins").textContent=G.coins.filter(c=>c.got).length;
 document.getElementById("levelPoints").textContent=state.points;
}
function updatePlayerCharacter(){
 if(!G)return;
 // Character is rendered by the engine using the selected avatar.
}
function collidePlayer(){
 G.onGround=false;
 const oldBottom=G.y+G.h-G.vy;
 for(const p of G.platforms){
  if(G.x+G.w>p.x && G.x<p.x+p.w && G.y+G.h>=p.y && oldBottom<=p.y+5 && G.vy>=0){
   G.y=p.y-G.h;G.vy=0;G.onGround=true;return;
  }
 }
}
function respawn(){
 G.lives--; updateGameHud();
 if(G.lives<=0){
  G.lives=0; G.dead=true; showGameMessage("💀 Game Over — buy hearts with points to refill and restart automatically.",true); showHeartShop(); return;
 }
 G.x=80;G.y=300;G.vx=0;G.vy=0;G.inv=100;
 showGameMessage("Oops! You lost a life.",true);
}

function restartLevel(){
 if(!G)return;
 const lvl=G.level;
 const currentLives=Math.max(0,G.lives);
 const hs=document.getElementById("heartShop"); if(hs)hs.classList.add("hidden");
 const complete=document.getElementById("levelComplete"); if(complete)complete.classList.add("hidden");
 G=null;
 initGame(lvl,currentLives);
 const stage=document.getElementById("gameStage"); if(stage)stage.classList.remove("hidden");
 if(currentLives<=0){
   G.dead=true;
   showGameMessage("💔 You have 0 hearts. Buy the full refill to restart automatically.",true);
   showHeartShop();
 }
}
function nextLevel(){
 if(!G||!G.won)return;
 const next=Math.min(30,G.level+1);
 if(state.currentLevel<next) state.currentLevel=next;
 save(); render();
 const hs=document.getElementById("heartShop"); if(hs)hs.classList.add("hidden");
 G=null;
 initGame(next);
 const stage=document.getElementById("gameStage"); if(stage)stage.classList.remove("hidden");
 showGameMessage(`🚀 Level ${next} — good luck!`,true);
}

const HEART_PRICE=5;
function showHeartShop(){
 let box=document.getElementById("heartShop"); if(!box){box=document.createElement("div");box.id="heartShop";box.className="heart-shop";document.getElementById("gameStage").appendChild(box);}
 box.classList.remove("hidden"); updateHeartShop();
}
function updateHeartShop(){
 const box=document.getElementById("heartShop"); if(!box||!G)return;
 box.innerHTML=`<h3>💔 Out of Hearts</h3><p>Buy a full refill with your points. <b>${HEART_PRICE} points = all ${G.maxLives} hearts</b>.</p><p>⭐ ${state.points} points &nbsp; ❤️ ${G.lives}/${G.maxLives}</p><button onclick="buyHeart()" ${state.points<HEART_PRICE||G.lives>=G.maxLives?'disabled':''}>❤️ Refill All ${G.maxLives} Hearts — ${HEART_PRICE} Points</button> <button class="secondary" onclick="backToLevels()">← Levels</button>`;
}
function buyHeart(){
 if(!G||G.lives>=G.maxLives)return;
 if(state.points<HEART_PRICE){toast("Not enough points.");return;}
 state.points-=HEART_PRICE;
 const lvl=G.level;
 save();
 const hs=document.getElementById("heartShop"); if(hs)hs.classList.add("hidden");
 const complete=document.getElementById("levelComplete"); if(complete)complete.classList.add("hidden");
 G=null;
 initGame(lvl); // automatic restart with a full heart bar
 showGameMessage(`❤️ All ${characterHearts[state.selectedCharacter||0]} hearts restored! Level restarted.`);
}
let levelCompleteTimer=null;
function showLevelComplete(){
 let box=document.getElementById("levelComplete"); if(!box){box=document.createElement("div");box.id="levelComplete";box.className="level-complete-overlay";document.body.appendChild(box);}
 if(levelCompleteTimer)clearTimeout(levelCompleteTimer);
 const level=G.level;
 box.innerHTML=`<div class="level-complete-card"><div class="complete-emoji">🏆</div><h2>Level ${level} Complete!</h2><p>${level<30?'Next level starting automatically…':'You finished all 30 levels!'}</p></div>`;
 box.classList.remove("hidden");
 levelCompleteTimer=setTimeout(()=>{
   const current=document.getElementById("levelComplete");
   if(current)current.classList.add("hidden");
   if(G && G.won){
     if(level<30) nextLevel();
     else showGameMessage("🏆 All 30 levels complete!",true);
   }
 },1800);
}

let gameMessageTimer=null;
function showGameMessage(t,danger=false,sticky=false){
 const el=document.getElementById("gameMessage");
 if(!el)return;
 el.textContent=t;el.className="game-message "+(danger?"danger":"");
 if(gameMessageTimer)clearTimeout(gameMessageTimer);
 if(!sticky){
   gameMessageTimer=setTimeout(()=>{
     const current=document.getElementById("gameMessage");
     if(current){current.textContent="";current.className="game-message";}
   },2200);
 }
}
function finishLevel(){
 if(!G||G.won)return;
 G.won=true;
 const completed=G.level;
 state.completedLevels=Math.max(state.completedLevels||0,completed);
 state.currentLevel=Math.min(30,completed+1);
 save();render();
 showGameMessage(`🏆 Level ${completed} complete!`,true);
 showLevelComplete();
}
function jumpPlayer(){
 if(!G||G.dead||G.won)return;
 if(G.onGround){G.vy=-17.5;G.onGround=false}
}

function shootWeapon(){
 if(!G||G.dead||G.won)return;
 const now=performance.now(), w=WEAPONS[state.equippedWeapon]||WEAPONS.pistol;
 if(now-G.lastShot<w.cooldown)return;
 G.lastShot=now;
 const dir=keys.left?-1:1;
 for(let i=0;i<w.shots;i++){
  const angle=(i-(w.shots-1)/2)*w.spread;
  G.projectiles.push({x:G.x+(dir>0?G.w:0),y:G.y+G.h*.45,vx:dir*Math.cos(angle)*10,vy:-Math.sin(angle)*10,life:w.id==="rocket"?130:75,weapon:state.equippedWeapon,damage:w.damage,returning:false,originX:G.x});
 }
}
function applyWeaponHit(e,p){
 const id=p.weapon;
 if(id==="freeze"){e.frozen=110;return true}
 if(id==="rocket"){
   e.hp=(e.hp||1)-p.damage;
   G.enemies.forEach(o=>{if(o!==e&&o.alive&&Math.abs(o.x-e.x)<95)o.hp=(o.hp||1)-Math.max(1,Math.floor(p.damage/2))});
 }else e.hp=(e.hp||1)-p.damage;
 return e.hp<=0;
}
function spawnBulletExplosion(x,y){
 if(!G.explosions)G.explosions=[];
 G.explosions.push({x,y,life:18,maxLife:18});
}
function updateExplosions(){
 if(!G||!G.explosions)return;
 for(let i=G.explosions.length-1;i>=0;i--){
  G.explosions[i].life--;
  if(G.explosions[i].life<=0)G.explosions.splice(i,1);
 }
}
function updateProjectiles(){
 for(let i=G.projectiles.length-1;i>=0;i--){
  const p=G.projectiles[i];
  if(p.weapon==="boomerang" && p.life<40){p.returning=true;p.vx*=.98}
  p.x+=p.vx;p.y+=p.vy;p.life--;
  let remove=p.life<=0;

  // Player bullets can destroy enemy bullets on contact.
  // The enemy shot disappears and a small explosion is shown at the collision point.
  for(let j=G.enemyProjectiles.length-1;j>=0&&!remove;j--){
   const ep=G.enemyProjectiles[j];
   const er=ep.r||7;
   if(Math.abs(p.x-ep.x)<12+er && Math.abs(p.y-ep.y)<8+er){
    spawnBulletExplosion(ep.x,ep.y);
    G.enemyProjectiles.splice(j,1);
    remove=true;
    showGameMessage("💥 Bullet blocked!");
   }
  }
  if(G.boss && G.boss.alive && p.x<G.boss.x+G.boss.w&&p.x+10>G.boss.x&&p.y<G.boss.y+G.boss.h&&p.y+10>G.boss.y){
    const dmg=(WEAPONS[p.weapon]||WEAPONS.pistol).damage;
    G.boss.hp=Math.max(0,G.boss.hp-dmg);
    if(p.weapon!=="boomerang")remove=true;
    showGameMessage(`Boss HP: ${G.boss.hp}/${G.boss.maxHp}`);
    if(G.boss.hp<=0){G.boss.alive=false;showGameMessage(`🏆 ${G.boss.name} defeated! Reach the end!`);}
  }
  for(const e of G.enemies){
   if(!e.alive)continue;
   if(p.x<e.x+e.w&&p.x+10>e.x&&p.y<e.y+e.h&&p.y+10>e.y){
    const dead=applyWeaponHit(e,p);
    if(dead){e.alive=false;showGameMessage(`${WEAPONS[p.weapon].name}: enemy defeated!`)}
    else if(p.weapon==="freeze")e.frozen=110;
    if(p.weapon!=="boomerang")remove=true;
    break;
   }
  }
  if(p.x<0||p.x>G.width||p.y<0||p.y>G.height)remove=true;
  if(remove)G.projectiles.splice(i,1);
 }
}


function spawnBoss(){
 if(G.bossSpawned)return;
 G.bossSpawned=true;
 G.boss=makeBoss(G.level);
 showGameMessage(`⚠️ BOSS: ${G.boss.name} — ${G.boss.weapon}!`,true,true);
}
function updateBoss(){
 const b=G.boss;
 if(!b||!b.alive)return;
 if(G.x>G.width-720)spawnBoss();
 if(!b.alive)return;
 b.x+=b.vx;
 if(b.x<b.min||b.x>b.max)b.vx*=-1;
 b.attackTimer++;
 b.jumpTimer--;
 if(b.jumpTimer<=0){
   b.jumpTimer=95;
   // Boss hops toward the player.
   if(G.x<b.x)b.vx=-Math.abs(b.vx);else b.vx=Math.abs(b.vx);
 }
 if(G.inv<=0 && G.x<b.x+b.w&&G.x+G.w>b.x&&G.y<b.y+b.h&&G.y+G.h>b.y){
   const stomp=G.vy>0&&G.y+G.h-b.y<22;
   if(stomp){
     b.hp=Math.max(0,b.hp-1);
     G.vy=-13;
     showGameMessage(`Boss HP: ${b.hp}/${b.maxHp}`);
     if(b.hp<=0){b.alive=false;showGameMessage(`🏆 ${b.name} defeated! Reach the end!`);}
   }else respawn();
 }
}



function updateEnemyAttacks(){
 if(!G||G.dead||G.won)return;
 for(const e of G.enemies){
  if(!e.alive)continue;
  if(e.attackTimer===undefined)e.attackTimer=90+Math.random()*90;
  e.attackTimer--;
  if(e.attackTimer<=0 && Math.abs(G.x-e.x)<560){
   const dx=(G.x+G.w/2)-(e.x+e.w/2),dy=(G.y+G.h/2)-(e.y+e.h/2),len=Math.max(1,Math.hypot(dx,dy));
   G.enemyProjectiles.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:dx/len*5.5,vy:dy/len*5.5,r:6,damage:e.damage||1,life:140,color:e.type==="flying"?"#9b6cff":"#e74c3c"});
   e.attackTimer=e.type==="flying"?70:120;
  }
 }

 // Every boss has a distinct weapon/attack pattern.
 if(G.boss&&G.boss.alive){
   const b=G.boss;
   b.attackCooldown=(b.attackCooldown||70)-1;
   if(b.attackCooldown<=0 && Math.abs(G.x-b.x)<820){
     const px=G.x+G.w/2, py=G.y+G.h/2;
     const bx=b.x+b.w/2, by=b.y+b.h*.45;
     const dx=px-bx, dy=py-by, len=Math.max(1,Math.hypot(dx,dy));
     const speed=5.4+G.level*.035;
     const damage=Math.min(4,1+Math.floor((G.level-1)/6));
     const addShot=(vx,vy,extra={})=>G.enemyProjectiles.push({x:bx,y:by,vx,vy,r:extra.r||8,damage:extra.damage||damage,life:extra.life||170,color:extra.color||b.color,boss:true,weapon:b.weapon,homing:extra.homing!==undefined?!!extra.homing:true,bomb:!!extra.bomb});
     switch(b.attack){
       case "stone":
         addShot(dx/len*speed,dy/len*speed,{color:"#8b8b8b",damage:damage+1,r:11}); break;
       case "fire":
         addShot(dx/len*(speed+1),dy/len*(speed+1),{color:"#ff4b25",damage:damage+1,r:10}); break;
       case "ice":
         for(const spread of [-0.18,0,0.18]){
           const a=Math.atan2(dy,dx)+spread; addShot(Math.cos(a)*speed,Math.sin(a)*speed,{color:"#7edcff",damage:damage,r:7});
         } break;
       case "dark":
         for(const spread of [-0.24,0,0.24]){
           const a=Math.atan2(dy,dx)+spread; addShot(Math.cos(a)*(speed+1),Math.sin(a)*(speed+1),{color:"#9a55ff",damage:damage+1,r:8});
         } break;
       case "lava":
         addShot(dx/len*(speed*.82),dy/len*(speed*.82),{color:"#ff6a21",damage:damage+1,r:13,life:190,bomb:true}); break;
       case "sky":
         // Sky Demon also aims at the player's current position instead of firing straight down.
         for(const spread of [-0.16,0,0.16]){
           const a=Math.atan2(dy,dx)+spread;
           addShot(Math.cos(a)*speed,Math.sin(a)*speed,{color:"#5e7cff",damage:damage,r:9,life:170});
         } break;
       case "crystal":
         addShot(dx/len*(speed+2),dy/len*(speed+2),{color:"#35e0c4",damage:damage+1,r:6}); break;
       case "shadow":
         for(let k=0;k<2;k++){ const a=Math.atan2(dy,dx)+(k?0.13:-0.13); addShot(Math.cos(a)*(speed+1.5),Math.sin(a)*(speed+1.5),{color:"#5b3b78",damage:damage+1,r:8}); } break;
       case "dragon":
         for(const spread of [-0.3,-0.15,0,0.15,0.3]){ const a=Math.atan2(dy,dx)+spread; addShot(Math.cos(a)*speed,Math.sin(a)*speed,{color:"#e36d32",damage:damage,r:7}); } break;
       case "volcano":
         for(let k=0;k<2;k++) addShot(dx/len*(speed*.75)+(k?1:-1),dy/len*(speed*.75)-3,{color:"#ff4a1f",damage:damage+1,r:12,life:180,bomb:true}); break;
       case "nightmare":
         addShot(dx/len*(speed*.9),dy/len*(speed*.9),{color:"#d04cff",damage:damage+1,r:9,homing:true}); break;
       default:
         for(const spread of [-0.12,0,0.12]){ const a=Math.atan2(dy,dx)+spread; addShot(Math.cos(a)*(speed+1.2),Math.sin(a)*(speed+1.2),{color:"#ff3155",damage:damage+1,r:9}); }
     }
     b.attackCooldown=Math.max(42,105-Math.floor(G.level*1.3));
     showGameMessage(`⚔️ ${b.name}: ${b.weapon}!`,true);
   }
 }

 for(let i=G.enemyProjectiles.length-1;i>=0;i--){
  const p=G.enemyProjectiles[i];
  if(p.homing&&G&&!G.dead){
    const tx=G.x+G.w/2,ty=G.y+G.h/2,dx=tx-p.x,dy=ty-p.y,len=Math.max(1,Math.hypot(dx,dy));
    const sp=Math.max(4.5,Math.hypot(p.vx,p.vy));
    p.vx=p.vx*.94+(dx/len*sp)*.06; p.vy=p.vy*.94+(dy/len*sp)*.06;
  }
  p.x+=p.vx;p.y+=p.vy;p.life--;
  if(G.inv<=0&&p.x<G.x+G.w&&p.x+p.r>G.x&&p.y<G.y+G.h&&p.y+p.r>G.y){
   G.lives=Math.max(0,G.lives-(p.damage||1));G.inv=80;G.enemyProjectiles.splice(i,1);updateGameHud();
   if(G.lives<=0){respawn();return;}
   }else if(p.life<=0||p.x<-80||p.x>G.width+80||p.y<-120||p.y>G.height+160)G.enemyProjectiles.splice(i,1);
 }
}
function updateAirThreats(){
 if(!G||G.dead||G.won)return;
 if(!G.airThreats)G.airThreats=[];
 if(!G.airSpawnTimer)G.airSpawnTimer=160;
 G.airSpawnTimer--;
 if(G.airSpawnTimer<=0){
   // Fewer flying birds/bats: never stack more than one at a time.
   G.airSpawnTimer=Math.max(180,300-Math.floor(G.level*2));
   if(G.airThreats.length<1){
     const x=Math.min(G.width-120,G.x+260+Math.random()*360);
     G.airThreats.push({x,y:70+Math.random()*95,w:48,h:32,vx:-1.2-(G.level*.015),drop:95+Math.random()*100,life:420});
   }
 }
 for(const a of G.airThreats){
   a.x+=a.vx;a.life--;a.drop--;
   if(a.drop<=0){
     a.drop=110-Math.min(40,G.level);
     G.enemyProjectiles.push({x:a.x+a.w/2,y:a.y+a.h,vx:-.5,vy:5.5+G.level*.04,r:9,damage:2,color:"#ff5b35",life:140,bomb:true});
   }
 }
 G.airThreats=G.airThreats.filter(a=>a.life>0&&a.x>-100&&a.x<G.width+100);
}

function updateHazards(){
 if(!G||G.dead||G.won)return;
 for(const h of G.hazards||[]){
   if(!h.active)continue;
   const hit=G.x<h.x+h.w&&G.x+G.w>h.x&&G.y<h.y+h.h&&G.y+G.h>h.y;
   if(!hit||G.inv>0)continue;
   // Spikes and fire require a jump; pits remain hazards.
   const jumpingOver=(h.requiresJump && G.y+G.h < h.y+12);
   const ducking=(h.requiresDuck && G.y+G.h > h.y+h.h-18);
   if((h.requiresJump&&!jumpingOver)||(h.requiresDuck&&!ducking)||(!h.requiresJump&&!h.requiresDuck)){
     G.lives=Math.max(0,G.lives-h.damage);
     G.inv=95;
     updateGameHud();
     showGameMessage(`${h.icon} Hazard! -${h.damage} ❤️`,true);
     if(G.lives<=0){respawn();return;}
   }
 }
}

function updatePhysics(){
 if(!G||G.dead||G.won)return;
 const speed=4.8;
 if(keys.left)G.vx=-speed; else if(keys.right)G.vx=speed; else G.vx*=.78;
 G.vy+=0.72;
 G.x+=G.vx;G.y+=G.vy;
 if(G.x<0)G.x=0;
 collidePlayer();
 if(G.y>G.canvas.height+100){respawn();return}
 // enemies: walkers, fast enemies, jumpers, flying enemies and armored enemies
 for(const e of G.enemies){
  if(!e.alive)continue;
  if(e.frozen>0){e.frozen--;continue}
  if(e.type==="flying"){
   e.x+=e.vx;
   e.y=e.baseY+Math.sin((performance.now()/280)+e.phase)*35;
   if(e.x<e.min||e.x>e.max)e.vx*=-1;
  }else{
   e.x+=e.vx;
   if(e.x<e.min||e.x>e.max)e.vx*=-1;
   if(e.type==="jumper"){
    e.jumpTimer--;
    if(e.jumpTimer<=0 && e.y+e.h>=430-3){e.vy=-10;e.jumpTimer=95}
    if(e.vy!==undefined){e.vy+=.55;e.y+=e.vy;if(e.y>430-e.h)e.y=430-e.h}
   }
  }
  if(G.inv>0)continue;
  const hit=G.x<e.x+e.w&&G.x+G.w>e.x&&G.y<e.y+e.h&&G.y+G.h>e.y;
  if(hit){
   const stomp=G.vy>0 && G.y+G.h-e.y<18 && e.type!=="flying";
   if(stomp){e.hp=(e.hp||1)-1;G.vy=-10;if(e.hp<=0)e.alive=false;showGameMessage(e.hp>0?"Armored enemy hit!":"Enemy defeated!")}
   else {respawn();return}
  }
 }
 // coins
 for(const c of G.coins){
  if(c.got)continue;
  if(G.x<c.x+c.r&&G.x+G.w>c.x-c.r&&G.y<c.y+c.r&&G.y+G.h>c.y-c.r){
   c.got=true;state.points++;save();updateGameHud();toast("Your parents sent you this point");
  }
 }
 if(G.inv>0)G.inv--;
 updateExplosions();
 updateProjectiles();
 updateBoss();
 updateAirThreats();
 updateEnemyAttacks();
 updateHazards();
 if(G.x>G.width-720)spawnBoss();
 if(G.x>G.width-160 && G.boss && !G.boss.alive)finishLevel();
 G.camera=Math.max(0,Math.min(G.width-G.canvas.width,G.x-G.canvas.width*.35));
}
function drawGame(){
 if(!G)return;
 const c=G.ctx,W=G.canvas.width,H=G.canvas.height;
 c.clearRect(0,0,W,H);
 // sky
 const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#72c9f4");grad.addColorStop(.72,"#dff6ff");grad.addColorStop(1,"#9bd78e");
 c.fillStyle=grad;c.fillRect(0,0,W,H);
 // clouds
 c.fillStyle="#fff";for(let i=0;i<9;i++){let x=(i*430-G.camera*.25)%5000;if(x<-100)x+=5000;c.beginPath();c.arc(x,85+(i%3)*45,22,0,Math.PI*2);c.arc(x+28,85+(i%3)*45,30,0,Math.PI*2);c.arc(x+60,90+(i%3)*45,20,0,Math.PI*2);c.fill()}
 c.save();c.translate(-G.camera,0);
 // distant hills
 c.fillStyle="#75bf76";for(let i=0;i<20;i++){c.beginPath();c.arc(i*330,440,140,Math.PI,0);c.fill()}
 // platforms
 for(const p of G.platforms){
  c.fillStyle="#6e4b2b";c.fillRect(p.x,p.y,p.w,p.h);
  c.fillStyle="#4eaf55";c.fillRect(p.x,p.y,p.w,12);
  for(let x=p.x+15;x<p.x+p.w;x+=35){c.fillStyle="#795632";c.fillRect(x,p.y+18,20,7)}
 }
 // coins
 for(const coin of G.coins)if(!coin.got){
  c.fillStyle="#ffd83d";c.beginPath();c.arc(coin.x,coin.y,coin.r,0,Math.PI*2);c.fill();
  c.strokeStyle="#d69d17";c.lineWidth=3;c.stroke();c.fillStyle="#fff2a2";c.fillRect(coin.x-2,coin.y-7,4,14)
 }
 // enemies
 for(const e of G.enemies)if(e.alive){
  if(e.type==="flying"){
   c.font="30px Arial";c.fillText("🦇",e.x,e.y+25);
  }else if(e.type==="armored"){
   c.fillStyle=e.frozen>0?"#76d8ff":"#65727f";c.fillRect(e.x,e.y,e.w,e.h);
   c.fillStyle="#26323b";c.fillRect(e.x+5,e.y+7,e.w-10,8);c.fillStyle="#fff";c.fillRect(e.x+7,e.y+18,5,5);c.fillRect(e.x+22,e.y+18,5,5);
  }else if(e.type==="jumper"){
   c.font="29px Arial";c.fillText("🐸",e.x,e.y+27);
  }else{
   c.fillStyle=e.frozen>0?"#76d8ff":(e.type==="fast"?"#d15b48":"#7b3f2b");
   c.beginPath();c.arc(e.x+14,e.y+15,14,Math.PI,0);c.fill();c.fillRect(e.x,e.y+15,e.w,15);
   c.fillStyle="#fff";c.fillRect(e.x+6,e.y+13,5,6);c.fillRect(e.x+18,e.y+13,5,6);
  }
 }

 // environmental hazards
 for(const h of G.hazards||[]){
   c.save();
   c.globalAlpha=.98;
   if(h.type==="spikes"){
     c.fillStyle="#d8dce5";
     for(let x=h.x;x<h.x+h.w;x+=14){c.beginPath();c.moveTo(x,h.y+h.h);c.lineTo(x+7,h.y);c.lineTo(x+14,h.y+h.h);c.closePath();c.fill();}
   }else if(h.type==="smallFire"||h.type==="fire"||h.type==="lava"){
     c.fillStyle=h.type==="lava"?"#ef4a2f":"#ff9f2f";
     c.beginPath();c.ellipse(h.x+h.w/2,h.y+h.h/2,h.w/2,h.h/2,0,0,Math.PI*2);c.fill();
     c.font="24px Arial";c.fillText("🔥",h.x+8,h.y+27);
   }else if(h.type==="pit"){
     c.fillStyle="#111827";c.fillRect(h.x,h.y,h.w,h.h);
     c.font="25px Arial";c.fillText("🕳️",h.x+25,h.y+23);
   }
   c.restore();
 }


 // flying bomb-droppers
 for(const a of G.airThreats||[]){
   c.font="38px Arial";c.fillText("🦇",a.x,a.y+30);
   c.fillStyle="#ffcc33";c.fillRect(a.x+19,a.y+34,10,4);
 }

 // HP bars for regular enemies
 for(const e of G.enemies)if(e.alive){
   const max=e.maxHp||e.hp||1;
   const ratio=Math.max(0,e.hp/max);
   const bw=Math.max(30,e.w+8);
   c.fillStyle="#1d2630";c.fillRect(e.x-4,e.y-12,bw,6);
   c.fillStyle="#49c86a";c.fillRect(e.x-4,e.y-12,bw*ratio,6);
 }
 // Boss with large HP bar and level-specific appearance
 if(G.boss&&G.boss.alive){
   const b=G.boss;
   c.font="46px Arial";c.fillText(b.icon,b.x+b.w/2,b.y+b.h-4);
   c.fillStyle="#171b22";c.fillRect(b.x-10,b.y-30,b.w+20,12);
   c.fillStyle="#35c95f";c.fillRect(b.x-10,b.y-30,(b.w+20)*(b.hp/b.maxHp),12);
   c.fillStyle="#fff";c.font="bold 13px Arial";c.textAlign="center";c.fillText(`${b.name}  ${b.hp}/${b.maxHp}`,b.x+b.w/2,b.y-36);c.font="12px Arial";c.fillText(`⚔ ${b.weapon}`,b.x+b.w/2,b.y-52);c.textAlign="left";
 }
 // bullet-vs-bullet explosions
 for(const ex of G.explosions||[]){
   c.save();
   const t=1-(ex.life/ex.maxLife);
   const r=6+24*t;
   c.globalAlpha=Math.max(0,1-t);
   c.fillStyle="#ff9f1c";
   c.shadowBlur=18;c.shadowColor="#ff5b35";
   c.beginPath();c.arc(ex.x,ex.y,r,0,Math.PI*2);c.fill();
   c.fillStyle="#fff3a3";
   c.beginPath();c.arc(ex.x,ex.y,r*.42,0,Math.PI*2);c.fill();
   c.restore();
 }

 // enemy projectiles / falling bombs — deliberately large and visible
 for(const p of G.enemyProjectiles||[]){
   c.save();
   const ang=Math.atan2(p.vy||1,p.vx||0);
   c.translate(p.x,p.y);
   if(p.bomb){
     c.fillStyle="#ff6b35";
     c.shadowBlur=16;c.shadowColor="#ff3b20";
     c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();
     c.fillStyle="#ffd166";
     c.beginPath();c.arc(-3,-3,4,0,Math.PI*2);c.fill();
     c.fillStyle="#ff3b20";c.fillRect(-2,-18,4,7);
   }else{
     c.rotate(ang);
     c.fillStyle=p.color||"#ff3b3b";
     c.shadowBlur=14;c.shadowColor=p.color||"#ff3b3b";
     c.fillRect(-12,-5,24,10);
     c.fillStyle="#fff";
     c.fillRect(-7,-3,10,6);
   }
   c.restore();
 }

 // player projectiles — bright visible bullets/tracers
 for(const p of G.projectiles||[]){
   c.save();
   c.translate(p.x,p.y);
   const ang=Math.atan2(p.vy||0,p.vx||1);
   c.rotate(ang);
   c.fillStyle=p.color||"#ffe45c";
   c.shadowBlur=10;c.shadowColor=p.color||"#ffe45c";
   c.fillRect(-12,-3,24,6);
   c.fillStyle="#fff";
   c.fillRect(-7,-2,10,4);
   c.restore();
 }
 // Finish flag at the end of every level — kept as the level goal.
 const flagX=G.width-105;
 c.fillStyle="#f2f2f2";c.fillRect(flagX,315,7,115);
 c.fillStyle="#e53935";
 c.beginPath();c.moveTo(flagX+7,318);c.lineTo(flagX+58,330);c.lineTo(flagX+7,343);c.closePath();c.fill();
 c.fillStyle="#fff";c.font="bold 13px Arial";c.fillText("FINISH",flagX-10,305);
 // player
 if(G.inv%6<3){
  const avatar=avatars[state.selectedCharacter||0]||"🧑‍🚀";
  c.font="42px Arial";c.textAlign="center";c.fillText(avatar,G.x+G.w/2,G.y+G.h-4);
 }
 c.restore();
}
function gameLoop(){
 updatePhysics();drawGame();
 if(G)gameRAF=requestAnimationFrame(gameLoop);
}
function bindGameControls(){
 const l=document.getElementById("leftBtn"),r=document.getElementById("rightBtn"),j=document.getElementById("jumpBtn"),f=document.getElementById("fireBtn");
 const press=(el,key)=>{el.addEventListener("pointerdown",e=>{e.preventDefault();keys[key]=true});["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,()=>keys[key]=false))};
 press(l,"left");press(r,"right");j.addEventListener("pointerdown",e=>{e.preventDefault();jumpPlayer()});f.addEventListener("pointerdown",e=>{e.preventDefault();shootWeapon()});
 document.addEventListener("keydown",e=>{
  const target=e.target;
  const typing=target && (
    target.tagName==="INPUT" ||
    target.tagName==="TEXTAREA" ||
    target.tagName==="SELECT" ||
    target.isContentEditable
  );
  // Never hijack keyboard input while the user is typing a task/name.
  if(typing)return;

  if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A")keys.left=true;
  if(e.key==="ArrowRight"||e.key==="d"||e.key==="D")keys.right=true;
  if(e.key==="ArrowUp"||e.key===" "||e.key==="w"||e.key==="W"){e.preventDefault();jumpPlayer()}
  if(e.key==="f"||e.key==="F"||e.key==="j"||e.key==="J"||e.key==="Enter"){e.preventDefault();shootWeapon()}
 });
 document.addEventListener("keyup",e=>{
  const target=e.target;
  const typing=target && (
    target.tagName==="INPUT" ||
    target.tagName==="TEXTAREA" ||
    target.tagName==="SELECT" ||
    target.isContentEditable
  );
  if(typing)return;
  if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A")keys.left=false;
  if(e.key==="ArrowRight"||e.key==="d"||e.key==="D")keys.right=false;
 });
}
function showGameTabInit(){renderLevelMenu();bindGameControls()}

load();
if(!Array.isArray(state.characters))state.characters=[0];
if(!state.characters.includes(0))state.characters.unshift(0);
if(!Array.isArray(state.weapons)||!state.weapons.includes("pistol"))state.weapons=["pistol"];
if(typeof state.selectedCharacter!=="number"||state.selectedCharacter<0||state.selectedCharacter>14)state.selectedCharacter=0;
if(!WEAPONS[state.equippedWeapon]||!state.weapons.includes(state.equippedWeapon))state.equippedWeapon="pistol";
setTimeout(showGameTabInit,80);
if(state.username){document.getElementById("home").classList.add("hidden");document.getElementById("app").classList.remove("hidden");document.getElementById("welcome").textContent=`Hi, ${state.username}`;render();setTimeout(showGameTabInit,50)}

