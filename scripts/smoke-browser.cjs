'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const chrome = process.env.CHROME_BIN || ['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(name=>spawnSync('which',[name],{stdio:'ignore'}).status===0);
if (!chrome) throw new Error('Chrome is required for the thumbnail smoke test');
const fixtures = {
  'ui.js': 'window.JBSUI={bindPresetSelect(s,cb){s.addEventListener("change",()=>{const v=s.value;if(v){s.value="";cb(v);}})},showButtonFeedback(){}};',
  'brand.js': 'window.JBSBrand={load:async()=>{},getTournaments:()=>[{id:"japan-championship",name:"日本選手権",nameEn:"JAPAN OPEN",edition:"JBS 第54回",color:"#3C3C3C",subColor:"#7A7A7A"}],getMatchRounds:()=>[{name:"決勝",nameEn:"FINAL"}]};',
  'members.js':'window.JBSMembers={load:async()=>[],photoUrl:()=>""};',
  'naming.js':'window.JBSNaming={makeFileName:()=>"test.png",formatSavedLabel:()=>"test"};'
};
const probe = '<script>(async()=>{try{const sleep=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<200&&document.querySelector("aside").inert;i++)await sleep(50);const q=id=>document.getElementById(id);if(!q("canvas")||q("canvas").width!==1920||q("canvas").height!==1080)throw Error("canvas dimensions");if(q("series").value!=="日本選手権")throw Error("initial title");q("stage").value="準決勝";q("stage").dispatchEvent(new Event("input",{bubbles:true}));await sleep(500);if(q("stage").value!=="準決勝")throw Error("late reset");const png=q("canvas").toDataURL("image/png");if(!png.startsWith("data:image/png;base64,")||png.length<1000)throw Error("PNG output");const saved=JSON.parse(localStorage.getItem("jbs-thumbnail-workspace")||"null");document.documentElement.setAttribute("data-smoke","success");}catch(e){document.documentElement.setAttribute("data-smoke",String(e.message));}})();</script>';
const page=fs.readFileSync('index.html','utf8')
  .replace(/<link\b[^>]*href="https:\/\/[^"]+"[^>]*>/gi,'')
  .replace(/https:\/\/jbsbackgammon\.github\.io\/common\/([^"?]+)(?:\?v=\d+)?/g,'/common/$1')
  .replace(/https:\/\/jbsbackgammon\.github\.io\/overlay\/assets\/dummy\.png/g,'/dummy.png')
  .replace('</body>',probe+'</body>');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(page);}
 if(url.pathname.startsWith('/common/')){res.setHeader('Content-Type','application/javascript');return res.end(fixtures[url.pathname.split('/').pop()]||'');}
 res.writeHead(404);res.end();
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--virtual-time-budget=20000','--dump-dom','http://127.0.0.1:'+server.address().port+'/']);
  let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Chrome timeout '+stderr.slice(-500)));},60000);
  child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
  child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(Error(stderr.slice(-1500)));});
 });
 assert.equal(result.match(/data-smoke="([^"]+)"/)?.[1],'success');
 console.log('Thumbnail real-browser preview and PNG smoke passed.');
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
