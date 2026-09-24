'use strict';
/* علّوش الرافدين v1.0.2 — engine.js
   محرك اللعبة: توليد المراحل، الفيزياء، الأعداء، الزعيم (منطق فقط بدون واجهة) */
const Engine = (() => {

const STEP = 8, GRAV = 0.46, JUMP = 9.4, ACC = 0.17, DEC = 0.45, FRIC = 0.12,
      MAXRUN = 7.6, MAXSPD = 14.5, AIRACC = 0.2, ROLLFRIC = 0.03,
      SLOPEF = 0.3, ROLLSLOPE = 0.5;

/* ---------- العوالم العشرة ---------- */
const THEMES = [
 {name:'بابل',   name_en:'Babylon',      sky:['#1f5fa8','#f0a961','#ffe3a3'], far:'#c48d58', mid:'#a4653a', top:'#e6bb6a', body:'#b97a40', dark:'#8a5228', land:'ziggurat', farType:'dunes',    decor:['palm','pot','banner','rock'],   night:false, key:0},
 {name:'أور',    name_en:'Ur',           sky:['#3d2a6b','#d9749a','#ffc48a'], far:'#8a5a7a', mid:'#6a3f5e', top:'#dba86c', body:'#a86a48', dark:'#7a4a34', land:'ziggurat', farType:'dunes',    decor:['palm','rock','banner','pot'],   night:false, key:3},
 {name:'الأهوار',name_en:'The Marshes',  sky:['#0f7c8a','#7fd3b5','#eaf7c9'], far:'#4c9a8a', mid:'#2f7a68', top:'#78b64c', body:'#5d7a3c', dark:'#3f5626', land:'hut',      farType:'marsh',    decor:['reed','reed','rock','pot'],     night:false, key:-2},
 {name:'بغداد',  name_en:'Baghdad',      sky:['#0a1030','#2b2a6a','#7a4b8f'], far:'#241d4a', mid:'#181238', top:'#d1a24a', body:'#6b4a3a', dark:'#42291f', land:'dome',     farType:'city',     decor:['lantern','palm','pot','banner'],night:true,  key:5},
 {name:'البصرة', name_en:'Basra',        sky:['#c2410c','#f59e0b','#fde68a'], far:'#3f5a2a', mid:'#2b4a20', top:'#63a53c', body:'#7a5a35', dark:'#523a20', land:'palm',     farType:'marsh',    decor:['palm','palm','reed','pot'],     night:false, key:2},
 {name:'سامراء', name_en:'Samarra',      sky:['#38a0d8','#f6d38a','#fff0c2'], far:'#d8a865', mid:'#c48a45', top:'#ecc57a', body:'#c4924e', dark:'#956a32', land:'spiral',   farType:'dunes',    decor:['rock','palm','banner','pot'],   night:false, key:-5},
 {name:'أربيل',  name_en:'Erbil',        sky:['#6aa9e8','#b9d8f5','#f3f9ff'], far:'#7b93b5', mid:'#5a7396', top:'#8fbf6a', body:'#8a6d52', dark:'#5f4a38', land:'citadel',  farType:'mountain', decor:['pine','rock','banner','pot'],   night:false, key:7},
 {name:'الحضر',  name_en:'Hatra',        sky:['#2b1b4d','#b04a7a','#ffb469'], far:'#5a3a6a', mid:'#3e2650', top:'#d8b06a', body:'#8a6244', dark:'#5d3f2b', land:'arches',   farType:'dunes',    decor:['column','rock','lantern','pot'],night:false, key:-3},
 {name:'السليمانية',name_en:'Sulaymaniyah',sky:['#3b6fb0','#a9cdea','#eef7ff'],far:'#9db4cf', mid:'#6f8db0', top:'#f3f7fb', body:'#7a8fa5', dark:'#4f6378', land:'mountain', farType:'mountain', decor:['pine','pine','rock','banner'],  night:false, key:1},
 {name:'الموصل', name_en:'Mosul',        sky:['#4a0f2e','#c2332f','#ffb03a'], far:'#4a1a2a', mid:'#30101e', top:'#d4a15a', body:'#6b3a2a', dark:'#3f1f16', land:'lean',     farType:'city',     decor:['lantern','palm','pot','banner'],night:true,  key:-1}
];
const themeName = (th, lang) => (lang === 'en' ? th.name_en : th.name);

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- الأرض ---------- */
function groundAt(L,x){
  const f=x/STEP,i=Math.floor(f);
  if(i<0)return L.hy[0];
  if(i>=L.hy.length-1)return Infinity;
  const a=L.hy[i],b=L.hy[i+1];
  if(a===Infinity||b===Infinity)return Infinity;
  return a+(b-a)*(f-i);
}
function slopeAt(L,x){
  const a=groundAt(L,x-4),b=groundAt(L,x+4);
  if(a<Infinity&&b<Infinity)return (b-a)/8;
  const c=groundAt(L,x);
  if(c===Infinity)return 0;
  if(b===Infinity&&a<Infinity)return (c-a)/4;
  if(a===Infinity&&b<Infinity)return (b-c)/4;
  return 0;
}

/* ---------- توليد المرحلة (حتمي: نفس الرقم = نفس المرحلة) ---------- */
function buildLevel(n){
  const rng=mulberry32(n*9973+17);
  const R=(a,b)=>a+rng()*(b-a), RI=(a,b)=>Math.floor(R(a,b+1)), pick=a=>a[Math.floor(rng()*a.length)];
  const snap=v=>Math.round(v/STEP)*STEP;
  const d=(n-1)/99, boss=(n%10===0), theme=Math.floor((n-1)/10);
  const mainLen=3000+n*72;
  const hy=new Float32Array(Math.ceil((mainLen+3200)/STEP)+8).fill(Infinity);
  const L={n,theme,boss,hy,coins:[],enemies:[],spikes:[],springs:[],pads:[],plats:[],flags:[],decor:[],hints:[],goalX:0,arenaX0:0,arenaX1:0,par:0,maxY:0,len:0};
  let x=0,y=300;
  const fill=(x0,x1,fn)=>{const a=Math.round(x0/STEP),b=Math.round(x1/STEP);for(let i=a;i<=b;i++)hy[i]=fn((i-a)/Math.max(1,b-a));};
  const ga=px=>groundAt(L,px);
  const flat=len=>{len=snap(len);fill(x,x+len,()=>y);x+=len;};
  const coinLine=(x0,x1,off,gap)=>{gap=gap||28;for(let cx=x0;cx<=x1;cx+=gap){const g=ga(cx);if(g<Infinity)L.coins.push({x:cx,y:g-off,got:false});}};
  const coinArc=(x0,x1,by,h)=>{const k=Math.max(3,Math.round((x1-x0)/30));for(let i=0;i<=k;i++){const t=i/k;L.coins.push({x:x0+(x1-x0)*t,y:by-h*4*t*(1-t),got:false});}};
  const walker=(x0,x1,spiky)=>L.enemies.push({t:'walk',x:(x0+x1)/2,y:y,x0,x1,dir:rng()<.5?-1:1,sp:.55+d*1.3+rng()*.35,alive:true,ph:rng()*6,spiky:!!spiky});
  const bat=(cx,cy)=>L.enemies.push({t:'bat',x:cx,y:cy,cx,cy,rng:RI(50,120),sp:.018+d*.02,alive:true,ph:rng()*6,spiky:false});
  const plat=(cx,py,moving)=>L.plats.push({x:cx-48,y:py,ox:cx-48,oy:py,w:96,h:14,mx:moving&&rng()<.6?R(25,55):0,my:moving?R(0,35):0,sp:.02+d*.02+rng()*.01,ph:rng()*6,t:0,dx:0,dy:0});

  const kinds={
    flat(){const x0=x;flat(R(160,340));coinLine(x0+24,x-24,24);if(rng()<.3+.35*d)walker(x0+40,x-40,rng()<d*.45);},
    hump(){
      let h=Math.min(R(30,70+40*d),y-200);
      if(h<20){flat(160);return;}
      const len=snap(Math.max(R(240,420),h*3.6)),x0=x,y0=y;
      if(rng()<.3)L.pads.push({x:x0-26,y:y0,dir:1,cd:0});
      fill(x,x+len,t=>y0-h*(1-Math.cos(2*Math.PI*t))/2);x+=len;
      coinLine(x0+30,x-30,26,32);
    },
    valley(){
      const h=Math.min(R(30,70),340-y);
      if(h<20){flat(160);return;}
      const len=snap(Math.max(R(240,420),h*3.6)),x0=x,y0=y;
      fill(x,x+len,t=>y0+h*(1-Math.cos(2*Math.PI*t))/2);x+=len;
      coinLine(x0+30,x-30,26,32);
    },
    stairs(){
      let dy=(rng()<.5?-1:1)*R(30,70);
      const y1=Math.max(200,Math.min(340,y+dy));dy=y1-y;
      if(Math.abs(dy)<15){flat(160);return;}
      const len=snap(Math.max(R(180,280),Math.abs(dy)*3.6)),x0=x,y0=y;
      fill(x,x+len,t=>y0+(y1-y0)*(1-Math.cos(Math.PI*t))/2);x+=len;y=y1;
      coinLine(x0+20,x-20,26,30);
    },
    pit(){
      flat(140);
      const w=snap(R(70,110+d*95)),x0=x;
      x+=w;
      coinArc(x0-16,x+16,y-24,40+w*.1);
      flat(100);
    },
    spikes(){
      flat(120);
      const len=snap(R(220,320)),x0=x;
      flat(len);
      const k=1+Math.floor(d*2.2)+(rng()<.4?1:0);
      for(let i=0;i<k;i++){
        const m=RI(2,3+(d>.5?1:0)),gx=x0+(i+1)*len/(k+1)-m*11;
        L.spikes.push({x:gx,w:m*22,y:y});
        coinArc(gx-20,gx+m*22+20,y-24,50);
      }
      flat(60);
    },
    gauntlet(){
      const len=snap(R(320,520)),x0=x;
      flat(len);
      const cnt=2+Math.round(d*3);
      for(let i=0;i<cnt;i++){
        const px=x0+(i+1)*len/(cnt+1);
        if(rng()<.5||d<.2)walker(px-40,px+40,rng()<d*.5);else bat(px,y-44);
      }
      coinLine(x0+20,x-20,24,36);
    },
    plats(){
      flat(140);
      const w=snap(R(250,340+d*140)),x0=x,k=Math.ceil(w/150),sp=w/k;
      for(let i=0;i<k;i++){
        const cx=x0+(i+.5)*sp,py=y-(i%2?R(25,60):R(0,25));
        plat(cx,py,rng()<d*.9&&n>8);
        L.coins.push({x:cx,y:py-40,got:false});
      }
      x+=w;flat(120);
    },
    ramp(){
      flat(300);
      const x0=x;
      L.pads.push({x:x0-230,y:y,dir:1,cd:0});
      const h=52;
      fill(x,x+64,t=>y-h*t);x+=64;
      const w=snap(R(200,260));
      coinArc(x,x+w,y-60,70);
      x+=w;
      flat(420);
    },
    bats(){
      const len=snap(R(300,460)),x0=x;
      flat(len);
      const cnt=2+Math.round(d*2);
      for(let i=0;i<cnt;i++)bat(x0+(i+1)*len/(cnt+1),y-RI(40,70));
      coinLine(x0+20,x-20,24,36);
    },
    upper(){
      const len=snap(R(320,440)),x0=x;
      flat(len);
      L.springs.push({x:x0+60,y:y,anim:0});
      const cnt=2+(rng()<.5?1:0);
      for(let j=0;j<cnt;j++){
        const cx=x0+150+j*100,py=y-135-R(-8,10);
        plat(cx,py,false);
        L.coins.push({x:cx,y:py-40,got:false});
      }
      coinLine(x0+100,x-20,24,40);
    }
  };
  const W=[['flat',1.6-d],['hump',2],['valley',1],['stairs',1.2],['pit',.6+1.6*d],
           ['spikes',n>2?.4+1.6*d:0],['gauntlet',n>1?.8+1.4*d:0],['plats',n>4?.3+1.6*d:0],
           ['ramp',n>12?.3+.9*d:0],['bats',n>3?.4+1.3*d:0],['upper',.9]];
  const totalW=W.reduce((s,a)=>s+a[1],0);
  const chooseKind=()=>{let r=rng()*totalW;for(const [k,w] of W){r-=w;if(r<=0)return k;}return 'flat';};

  /* البداية */
  flat(420);coinLine(60,400,24,34);
  let fi=0,prev='';
  while(x<mainLen){
    if(fi<3&&x>=mainLen*(fi+1)/4){flat(220);L.flags.push({x:x-110,y:y,on:false});fi++;continue;}
    let k=chooseKind();
    if(k===prev&&k!=='flat'&&k!=='hump')k='flat';
    kinds[k]();prev=k;
    flat(R(50,110));
  }
  flat(260);
  if(boss){L.arenaX0=x;flat(1000);L.arenaX1=x;L.goalX=x-140;flat(240);}
  else{flat(200);L.goalX=x;flat(300);}
  L.len=x;
  for(let i=0;i<hy.length;i++)if(hy[i]<Infinity&&hy[i]>L.maxY)L.maxY=hy[i];

  /* زينة */
  const dec=THEMES[theme].decor;
  for(let px=90;px<x-50;px+=R(110,260)){
    const g=ga(px);
    if(g<Infinity&&Math.abs(slopeAt(L,px))<.25)L.decor.push({x:px,t:pick(dec),s:R(.8,1.25),f:rng()<.5?1:-1});
  }
  /* إرشادات المراحل الأولى */
  if(n===1){L.hints=[{x:100,key:'hintMove'},{x:640,key:'hintJumpPit'},{x:1400,key:'hintRollKill'},{x:2300,key:'hintCoinsShield'}];}
  if(n===2){L.hints=[{x:160,key:'hintSpinDash'},{x:1100,key:'hintSpikes'}];}
  L.par=Math.round(L.goalX/255+(boss?30:0));
  return L;
}

/* ---------- الحالة ---------- */
function createState(n){
  const L=buildLevel(n);
  const p={x:80,y:groundAt(L,80),vx:0,vy:0,dir:1,ground:true,plat:null,roll:false,ball:false,jumping:false,charging:false,charge:0,
           inv:0,hurt:0,dead:false,deadT:0,jumpBuf:0,coyote:0};
  const hp=Math.min(12,3+Math.floor(n/10));
  return {n,L,p,t:0,frame:0,coins:0,collected:0,totalCoins:L.coins.length,kills:0,deaths:0,lives:3,
          checkpoint:{x:80,y:p.y},score:0,done:false,over:false,res:null,ev:[],pj:false,pr:false,locked:false,
          rng:mulberry32(n*31+7),
          boss:L.boss?{x:L.arenaX1-220,y:0,vy:0,vx:0,dir:-1,hp,maxhp:hp,inv:0,state:'walk',timer:90,next:'charge',active:false,dead:false}:null};
}

const pTop=p=>p.y-((p.ball||p.roll||p.charging)?24:38);

function hurt(S,srcx){
  const p=S.p;
  if(p.inv>0||p.dead)return;
  if(S.coins>0){
    S.ev.push({t:'lose',n:Math.min(S.coins,14),x:p.x,y:p.y-20});
    S.coins=0;p.inv=120;p.hurt=24;p.vy=-5;p.vx=(p.x<srcx?-1:1)*3.5;
    p.ground=false;p.plat=null;p.roll=false;p.ball=false;p.jumping=false;p.charging=false;
    S.ev.push({t:'hurt',x:p.x,y:p.y});
  }else die(S);
}
function die(S){
  const p=S.p;
  if(p.dead)return;
  p.dead=true;p.deadT=70;p.vy=-8;p.vx=0;S.lives--;S.deaths++;S.coins=0;
  p.charging=false;p.roll=false;p.ball=false;
  S.ev.push({t:'die',x:p.x,y:p.y});
}
function respawn(S){
  const p=S.p,L=S.L,c=S.checkpoint;
  const g=groundAt(L,c.x);
  p.x=c.x;p.y=g<Infinity?g:c.y;p.vx=0;p.vy=0;p.ground=true;p.plat=null;p.dead=false;
  p.inv=130;p.hurt=0;p.roll=false;p.ball=false;p.jumping=false;p.charging=false;p.jumpBuf=0;
  S.coins=0;S.pj=false;S.pr=false;
  if(S.boss&&!S.boss.dead){S.locked=false;S.boss.active=false;S.boss.state='walk';S.boss.timer=90;S.boss.x=L.arenaX1-220;S.boss.inv=0;}
  S.ev.push({t:'respawn',x:p.x,y:p.y});
}

/* ---------- اللاعب ---------- */
function playerStep(S,inp){
  const p=S.p,L=S.L;
  const jp=inp.jump&&!S.pj,rp=inp.roll&&!S.pr;
  S.pj=inp.jump;S.pr=inp.roll;
  if(p.inv>0)p.inv--;
  if(p.hurt>0)p.hurt--;
  if(jp)p.jumpBuf=7;else if(p.jumpBuf>0)p.jumpBuf--;
  const dir=p.hurt>0?0:inp.dir;

  const doJump=()=>{
    p.vy=-JUMP;p.ground=false;p.plat=null;p.ball=true;p.jumping=true;p.roll=false;p.jumpBuf=0;p.coyote=0;
    S.ev.push({t:'jump',x:p.x,y:p.y});
  };

  if(p.ground){
    p.coyote=6;
    if(p.charging){
      p.charge=Math.min(1,p.charge+0.028);p.vx*=0.85;
      if(!inp.roll){p.charging=false;p.roll=true;p.vx=p.dir*(6.5+7.5*p.charge);p.charge=0;S.ev.push({t:'dash',x:p.x,y:p.y});}
    }else{
      if(rp&&!p.roll){
        if(Math.abs(p.vx)>=1.5){p.roll=true;S.ev.push({t:'roll',x:p.x,y:p.y});}
        else{p.charging=true;p.charge=0.1;}
      }
      if(!p.charging){
        const tan=p.plat?0:slopeAt(L,p.x),sn=tan/Math.sqrt(1+tan*tan);
        if(p.roll){
          p.vx+=sn*ROLLSLOPE;
          p.vx-=Math.sign(p.vx)*Math.min(Math.abs(p.vx),ROLLFRIC);
          if(dir!==0&&dir!==Math.sign(p.vx))p.vx+=dir*0.12;
          if(Math.abs(p.vx)<0.7)p.roll=false;
        }else{
          p.vx+=sn*SLOPEF;
          if(dir!==0){
            p.dir=dir;
            if(p.vx*dir<0)p.vx+=dir*DEC;
            else if(Math.abs(p.vx)<MAXRUN)p.vx=Math.max(-MAXRUN,Math.min(MAXRUN,p.vx+dir*ACC));
            else p.vx-=dir*0.04;
          }else p.vx-=Math.sign(p.vx)*Math.min(Math.abs(p.vx),FRIC);
        }
        if(p.roll&&Math.abs(p.vx)>0.01)p.dir=Math.sign(p.vx);
      }
    }
    p.vx=Math.max(-MAXSPD,Math.min(MAXSPD,p.vx));
    if(p.jumpBuf>0&&!p.charging){doJump();}
    else{
      let nx=p.x+p.vx;
      if(p.plat){
        const pl=p.plat;nx+=pl.dx;
        if(nx<pl.x-6||nx>pl.x+pl.w+6){p.plat=null;p.ground=false;p.x=nx;p.vy=0;p.ball=p.roll||p.ball;p.roll=false;}
        else{p.x=nx;p.y=pl.y;}
      }else{
        const g=groundAt(L,nx),tn=slopeAt(L,p.x);
        if(nx<16){p.x=16;p.vx=Math.max(0,p.vx);}
        else if(g===Infinity||g-p.y>15){
          p.x=nx;p.ground=false;p.ball=p.roll||p.ball;p.roll=false;p.jumping=false;
          p.vy=Math.max(-12,Math.min(6,tn*p.vx));
        }else{p.x=nx;p.y=g;}
      }
    }
  }else{
    if(p.coyote>0)p.coyote--;
    if(p.jumpBuf>0&&p.coyote>0&&!p.jumping&&p.vy>=0){doJump();}
    if(dir!==0){p.dir=dir;if(p.vx*dir<MAXRUN)p.vx+=dir*AIRACC;}
    if(p.jumping&&!inp.jump&&p.vy<-3.6)p.vy=-3.6;
    p.vy=Math.min(p.vy+GRAV,14);
    p.vx=Math.max(-MAXSPD,Math.min(MAXSPD,p.vx));
    const nx=p.x+p.vx,ny=p.y+p.vy;
    let landed=false;
    if(p.vy>=0){
      for(const pl of L.plats){
        if(nx>pl.x-5&&nx<pl.x+pl.w+5&&p.y<=pl.y+8+Math.abs(pl.dy)&&ny>=pl.y){p.x=nx;p.y=pl.y;p.plat=pl;landed=true;break;}
      }
    }
    if(!landed){
      const g=groundAt(L,nx);
      if(g<Infinity&&ny>=g&&p.y<=g+12+Math.abs(p.vx)*1.15&&p.vy>=-2){p.x=nx;p.y=g;landed=true;p.plat=null;}
      else if(g<Infinity&&ny>g+2){p.vx=0;p.y=ny;}
      else{p.x=nx;p.y=ny;}
    }
    if(p.x<16){p.x=16;p.vx=Math.max(0,p.vx);}
    if(landed){
      p.ground=true;p.vy=0;p.ball=false;p.jumping=false;
      p.roll=!!(inp.roll&&Math.abs(p.vx)>=1.5);
      S.ev.push({t:'land',x:p.x,y:p.y});
    }
  }
  /* ساحة الزعيم */
  if(S.boss){
    if(!S.locked&&p.x>L.arenaX0+150){
      S.locked=true;S.boss.active=true;
      const g=groundAt(L,S.boss.x);S.boss.y=g<Infinity?g:S.boss.y;
      S.ev.push({t:'bossStart'});
    }
    if(S.locked&&!S.boss.dead)p.x=Math.max(L.arenaX0+30,Math.min(L.arenaX1-30,p.x));
  }
}

/* ---------- التفاعلات ---------- */
function interact(S){
  const p=S.p,L=S.L,top=pTop(p),cy=p.y-((p.ball||p.roll)?12:19);
  for(const c of L.coins){
    if(c.got)continue;
    const dx=c.x-p.x;
    if(dx>26||dx<-26)continue;
    const dy=c.y-cy;
    if(dx*dx+dy*dy<676){c.got=true;S.coins++;S.collected++;S.score+=10;S.ev.push({t:'coin',x:c.x,y:c.y});}
  }
  for(const s of L.springs){
    if(Math.abs(p.x-s.x)<18&&p.y>=s.y-8&&p.y<=s.y+12&&p.vy>=0){
      p.vy=-15.5;p.ground=false;p.plat=null;p.jumping=false;p.ball=false;p.roll=false;p.charging=false;
      s.anim=14;S.ev.push({t:'spring',x:s.x,y:s.y});
    }
  }
  for(const pd of L.pads){
    if(pd.cd>0)pd.cd--;
    if(p.ground&&pd.cd===0&&Math.abs(p.x-pd.x)<22){
      p.vx=pd.dir*Math.max(Math.abs(p.vx),12);p.dir=pd.dir;p.charging=false;pd.cd=25;
      S.ev.push({t:'boost',x:pd.x,y:pd.y});
    }
  }
  for(const s of L.spikes){
    if(p.x>s.x-6&&p.x<s.x+s.w+6&&p.y>s.y-16&&top<s.y)hurt(S,s.x+s.w/2);
  }
  for(const f of L.flags){
    if(!f.on&&p.x>=f.x){f.on=true;S.checkpoint={x:f.x,y:f.y};S.ev.push({t:'flag',x:f.x,y:f.y});}
  }
  if(p.x>=L.goalX&&(!L.boss||S.boss.dead)){S.done=true;S.res=results(S);S.ev.push({t:'win'});}
}

function enemyStep(S){
  const p=S.p,L=S.L,top=pTop(p);
  for(const e of L.enemies){
    if(!e.alive)continue;
    if(e.t==='walk'){
      e.x+=e.dir*e.sp;
      if(e.x<e.x0){e.x=e.x0;e.dir=1;}
      if(e.x>e.x1){e.x=e.x1;e.dir=-1;}
      const g=groundAt(L,e.x);if(g<Infinity)e.y=g;
      e.top=e.y-22;e.bot=e.y;
    }else{
      e.ph+=e.sp;e.x=e.cx+Math.sin(e.ph)*e.rng;e.y=e.cy+Math.sin(e.ph*2.3)*12;
      e.top=e.y-12;e.bot=e.y+12;
    }
    if(Math.abs(e.x-p.x)>60)continue;
    if(p.x+9>e.x-14&&p.x-9<e.x+14&&p.y>e.top&&top<e.bot){
      if((p.ball||p.roll)&&!e.spiky){
        e.alive=false;S.kills++;S.score+=100;
        S.ev.push({t:'stomp',x:e.x,y:(e.top+e.bot)/2});
        if(!p.ground&&p.vy>0)p.vy=-6.5;
      }else hurt(S,e.x);
    }
  }
}

function bossStep(S){
  const b=S.boss;
  if(!b||!b.active||b.dead||S.p.dead)return;
  const L=S.L,p=S.p,rn=S.rng;
  if(b.inv>0)b.inv--;
  const sp=1+(b.maxhp-b.hp)*0.10+L.n*0.004;
  const gy=groundAt(L,b.x),gnd=gy<Infinity?gy:b.y;
  switch(b.state){
    case 'walk':
      b.dir=p.x<b.x?-1:1;b.x+=b.dir*1.4*sp;
      if(--b.timer<=0){b.state='wind';b.timer=32;b.next=rn()<.5?'charge':'jump';b.dir=p.x<b.x?-1:1;}
      break;
    case 'wind':
      if(--b.timer<=0){
        if(b.next==='charge'){b.state='charge';b.timer=55;}
        else{b.state='jump';b.vy=-10.5;b.vx=(p.x-b.x)/45;}
      }
      break;
    case 'charge':
      b.x+=b.dir*4.2*sp;
      if(--b.timer<=0){b.state='walk';b.timer=70+Math.floor(rn()*50);}
      break;
    case 'jump':
      b.vy+=GRAV;b.y+=b.vy;b.x+=b.vx;
      if(b.y>=gnd&&b.vy>0){
        b.y=gnd;b.state='walk';b.timer=60+Math.floor(rn()*40);
        S.ev.push({t:'slam',x:b.x,y:b.y});
        if(p.ground&&Math.abs(p.x-b.x)<150)hurt(S,b.x);
      }
      break;
  }
  if(b.state!=='jump')b.y=gnd;
  b.x=Math.max(L.arenaX0+50,Math.min(L.arenaX1-50,b.x));
  const top=pTop(p);
  if(Math.abs(p.x-b.x)<44&&p.y>b.y-52&&top<b.y){
    if(p.ball||p.roll){
      if(b.inv===0){
        b.hp--;b.inv=80;S.score+=200;
        S.ev.push({t:'bossHit',x:b.x,y:b.y-30});
        const sd=p.x<b.x?-1:1;
        if(!p.ground){p.vy=-8;p.vx=sd*4;}else{p.vx=sd*6;p.roll=false;p.ball=false;}
        if(b.hp<=0){b.dead=true;S.score+=1500;S.ev.push({t:'bossDie',x:b.x,y:b.y-30});}
      }
    }else hurt(S,b.x);
  }
}

function results(S){
  const L=S.L,t=S.t,par=L.par,ratio=S.collected/Math.max(1,S.totalCoins);
  let stars=1;
  if(t<=par*1.25)stars++;
  if(ratio>=.75&&S.deaths===0)stars++;
  const rank=(stars===3&&t<=par*.95)?'S':stars===3?'A':stars===2?'B':'C';
  const timeBonus=Math.max(0,Math.round((par-t)*25));
  const score=S.score+timeBonus+(S.deaths===0?500:0)+stars*300;
  return {stars,rank,time:t,par,score,coins:S.collected,totalCoins:S.totalCoins,kills:S.kills,deaths:S.deaths,timeBonus};
}

function step(S,inp){
  if(S.done||S.over)return;
  const L=S.L,p=S.p;
  S.frame++;
  for(const pl of L.plats){
    if(pl.mx||pl.my){
      pl.t++;
      const nx=pl.ox+Math.sin(pl.t*pl.sp+pl.ph)*pl.mx,ny=pl.oy+Math.sin(pl.t*pl.sp*1.3+pl.ph)*pl.my;
      pl.dx=nx-pl.x;pl.dy=ny-pl.y;pl.x=nx;pl.y=ny;
    }
  }
  for(const s of L.springs)if(s.anim>0)s.anim--;
  if(p.dead){
    p.deadT--;p.vy=Math.min(p.vy+GRAV,12);p.y+=p.vy;
    if(p.deadT<=0){if(S.lives<=0){S.over=true;S.ev.push({t:'over'});}else respawn(S);}
    return;
  }
  S.t+=1/60;
  playerStep(S,inp);
  if(!p.dead)interact(S);
  if(!p.dead&&!S.done)enemyStep(S);
  if(!p.dead&&!S.done)bossStep(S);
  if(!p.dead&&p.y>L.maxY+260)die(S);
}

const api={STEP,THEMES,themeName,mulberry32,groundAt,slopeAt,buildLevel,createState,step,results,MAXRUN};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
return api;
})();
