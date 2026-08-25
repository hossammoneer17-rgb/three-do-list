require("dotenv").config();
const express = require("express");
const app = express();

// Optional CORS for a GitHub Pages frontend talking to this backend.
// Set FRONTEND_ORIGIN in the backend environment to the exact GitHub Pages URL.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
if (FRONTEND_ORIGIN) {
  app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if(req.method==="OPTIONS") return res.sendStatus(204);
    next();
  });
}
app.use(express.json({limit:"15mb"}));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna";

const RULES = {
  homework: {
    label: "Homework / Study",
    positive: "Clearly visible homework or study evidence: handwritten/printed school papers, worksheet, notebook with schoolwork, textbook pages, or a study desk with school material.",
    negative: "A selfie, person's face, empty desk, blank paper, or unrelated object is not enough."
  },
  hangout: {
    label: "Hang Out",
    positive: "Clearly visible outdoor/public/social environment such as a street, sidewalk, park, café/outdoor seating, mall/public place, or another obvious place someone could be hanging out.",
    negative: "A selfie or a close-up of a person with no recognizable environment is not enough."
  },
  nap: {
    label: "Take a Nap",
    positive: "A clearly visible bed or sleeping/resting setup: bed, mattress, pillow, blanket, bedroom sleeping area, or someone visibly lying/resting in a bed.",
    negative: "A person's face alone, a couch that does not clearly look like a sleeping setup, or an unrelated room is not enough."
  },
  workout: {
    label: "Workout",
    positive: "A clearly visible gym/exercise environment: recognizable gym machines, weights, treadmill, benches, workout floor, or visible exercise activity.",
    negative: "A selfie alone, a bedroom, or an unrelated room is not enough."
  }
};

function extractJSON(text){
  try{return JSON.parse(text)}catch{}
  const m=String(text||"").match(/\{[\s\S]*\}/);
  if(m){try{return JSON.parse(m[0])}catch{}}
  return null;
}

app.get("/api/health",(req,res)=>res.json({ok:true,aiConfigured:Boolean(API_KEY),model:MODEL}));
app.get("/api/music",(req,res)=>{
  const fs=require("fs");
  const path=require("path");
  const dir=path.join(__dirname,"assets");
  try{
    const files=fs.readdirSync(dir).filter(f=>/\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(f));
    files.sort((a,b)=>{
      const score=f=>/(sonic|adventure|music|song|theme)/i.test(f)?0:1;
      return score(a)-score(b) || a.localeCompare(b);
    });
    res.json({ok:true,file:files[0]?`assets/${encodeURIComponent(files[0])}`:null});
  }catch(e){res.json({ok:true,file:null});}
});

app.post("/api/verify-task",async(req,res)=>{
  try{
    if(!API_KEY)return res.status(500).json({ok:false,message:"AI key missing. Put OPENAI_API_KEY in a .env file, then restart npm start."});
    const {category,taskText,image}=req.body||{};
    if(!RULES[category])return res.status(400).json({ok:false,message:"Unknown task category."});
    if(typeof image!=="string"||!/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i.test(image))return res.status(400).json({ok:false,message:"Please upload a JPG, PNG, GIF, or WebP image."});

    const rule=RULES[category];
    const prompt=`You are an accurate visual verifier for a family productivity app.\n\nTASK: ${rule.label}\nUSER TASK TEXT: ${String(taskText||"").slice(0,300)}\n\nACCEPT IF THE IMAGE CLEARLY SHOWS:\n${rule.positive}\n\nREJECT IF:\n${rule.negative}\n\nImportant: judge the image itself. Do not require a perfect photo or readable text if the visual evidence is obvious. For example, a clear photo of a bed should pass the Take a Nap task even if nobody is in the bed. A clear gym interior should pass Workout even if nobody is exercising. A clear street/outdoor scene should pass Hang Out. Visible homework papers/notebook/textbook should pass Homework.\n\nReturn ONLY valid JSON with exactly these keys:\n{"verified":true,"confidence":0.0,"reason":"short reason"}\nconfidence is 0 to 1. Set verified=true when the requested visual evidence is reasonably clear; set false only when the evidence is absent, contradictory, or genuinely too ambiguous. Do not demand the person to appear in the image when the task can be proved by the environment/object itself.`;

    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${API_KEY}`},
      body:JSON.stringify({
        model:MODEL,
        input:[{role:"user",content:[
          {type:"input_text",text:prompt},
          {type:"input_image",image_url:image,detail:"high"}
        ]}],
        max_output_tokens:220,
        temperature:0
      })
    });
    const raw=await response.text();
    if(!response.ok){
      let msg=raw;try{msg=JSON.parse(raw).error?.message||raw}catch{}
      return res.status(502).json({ok:false,message:`AI request failed: ${msg}`});
    }
    const data=JSON.parse(raw);
    const outputText=data.output_text || (data.output||[]).filter(x=>x.type==="message").flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
    const parsed=extractJSON(outputText);
    if(!parsed||typeof parsed.verified!=="boolean")return res.status(502).json({ok:false,message:"AI returned an invalid verification result. Try the photo again."});
    res.json({ok:true,verified:parsed.verified,confidence:Number(parsed.confidence||0),reason:parsed.reason||"The image was checked."});
  }catch(err){res.status(500).json({ok:false,message:err.message||"Server error"})}
});

app.listen(PORT,()=>console.log(`Three Do List running at http://localhost:${PORT} | AI model: ${MODEL}`));
