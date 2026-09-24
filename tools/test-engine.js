'use strict';
/* اختبار سريع للمحرك: يبني المراحل الـ100 ويشغّل لاعباً آلياً بسيطاً ويتأكد من عدم وجود أخطاء أو قيم NaN */
const E=require('../www/engine.js');
let bad=0;
const fail=m=>{console.error('FAIL:',m);bad++;};

function bot(S){
  const L=S.L,p=S.p,inp={dir:1,jump:false,roll:false};
  const ahead=(dx)=>E.groundAt(L,p.x+dx);
  // قفز عند اقتراب حفرة أو أشواك أو عدو
  let danger=false;
  for(const dx of [40,70,100,130]){ if(ahead(dx)===Infinity)danger=true; }
  for(const s of L.spikes){ if(s.x-p.x>0&&s.x-p.x<110)danger=true; }
  for(const e of L.enemies){ if(e.alive&&e.x-p.x>0&&e.x-p.x<90&&!e.spiky)inp.roll=true; else if(e.alive&&e.x-p.x>0&&e.x-p.x<110&&e.spiky)danger=true; }
  if(danger&&p.ground)inp.jump=true;else if(p.jumping&&p.vy<0)inp.jump=true;else if(danger&&!p.ground&&p.vy>=0&&p.plat===null&&false)inp.jump=false;
  if(p.ground&&p.plat===null&&ahead(60)<Infinity&&Math.abs(E.slopeAt(L,p.x))>.4)inp.jump=false;
  return inp;
}

let finished=0,progressSum=0,levels=0;
const t0=Date.now();
for(let n=1;n<=100;n++){
  const S=E.createState(n),L=S.L;
  if(!(L.goalX>2000))fail('goalX '+n);
  if(L.coins.length<40)fail('few coins '+n);
  if(isNaN(S.p.y)||S.p.y===Infinity)fail('start ground '+n);
  // كل الأعداء فوق أرض فعلية
  for(const e of L.enemies){ if(e.t==='walk'){ if(E.groundAt(L,e.x0)===Infinity||E.groundAt(L,e.x1)===Infinity)fail('walker off ground '+n); } }
  for(let f=0;f<60*180&&!S.done&&!S.over;f++){
    E.step(S,bot(S));
    S.ev.length=0;
    const p=S.p;
    if(isNaN(p.x)||isNaN(p.y)||isNaN(p.vx)||isNaN(p.vy)){fail('NaN at level '+n+' frame '+f);break;}
    if(S.boss&&S.locked&&!S.boss.dead){ // اللاعب الآلي يهاجم الزعيم
      // بسيط: يبقى يتحرك
    }
  }
  levels++;
  progressSum+=Math.min(1,S.p.x/L.goalX);
  if(S.done)finished++;
}
console.log(`levels built & simulated: ${levels}  |  bot finished: ${finished}  |  avg progress: ${(progressSum/levels*100).toFixed(1)}%  |  ${(Date.now()-t0)}ms`);

// اختبار الحتمية
const a=E.buildLevel(37),b=E.buildLevel(37);
if(a.coins.length!==b.coins.length||a.goalX!==b.goalX)fail('non-deterministic level');

// اختبار الدحرجة/القفز/الانطلاق
{
  const S=E.createState(1);
  for(let i=0;i<50;i++)E.step(S,{dir:1,jump:false,roll:false});
  if(!(S.p.vx>3))fail('player does not accelerate');
  E.step(S,{dir:1,jump:true,roll:false});E.step(S,{dir:1,jump:true,roll:false});
  if(S.p.ground)fail('jump did not leave ground');
  const S2=E.createState(1);
  for(let i=0;i<40;i++)E.step(S2,{dir:0,jump:false,roll:true});
  E.step(S2,{dir:0,jump:false,roll:false});
  if(!(S2.p.vx>6))fail('spin dash failed vx='+S2.p.vx);
}
console.log(bad?`${bad} FAILURES`:'ALL OK');
process.exit(bad?1:0);
