(function(){
"use strict";
var q=function(s){return document.querySelector(s)};
var qa=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var RM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function safe(f){try{f()}catch(e){if(window.console)console.warn('suraj:',e)}}

/* ---------- Smooth in-page scrolling + scroll progress ---------- */
safe(function(){
  var links=qa('a[href^="#"]');
  var header=q('.site-header');
  var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var activeAnimation=0;

  function scrollTarget(target){
    var headerHeight=header ? header.getBoundingClientRect().height : 0;
    var destination=window.scrollY+target.getBoundingClientRect().top-headerHeight-18;
    var maxScroll=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    destination=Math.max(0,Math.min(maxScroll,destination));

    if(reduceMotion.matches){
      window.scrollTo(0,destination);
      return;
    }

    if(activeAnimation)cancelAnimationFrame(activeAnimation);
    var startY=window.scrollY;
    var distance=destination-startY;
    if(Math.abs(distance)<2){window.scrollTo(0,destination);return;}

    /* Longer jumps get a little more time, with a firm limit to keep navigation snappy. */
    var duration=Math.min(1050,Math.max(480,Math.abs(distance)*0.48));
    var startedAt=0;
    function ease(t){return t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;}
    function frame(now){
      if(!startedAt)startedAt=now;
      var progress=Math.min(1,(now-startedAt)/duration);
      window.scrollTo(0,startY+distance*ease(progress));
      if(progress<1)activeAnimation=requestAnimationFrame(frame);
      else activeAnimation=0;
    }
    activeAnimation=requestAnimationFrame(frame);
  }

  function cancelScroll(){
    if(activeAnimation){
      cancelAnimationFrame(activeAnimation);
      activeAnimation=0;
    }
  }
  ['wheel','touchstart','pointerdown'].forEach(function(type){
    addEventListener(type,cancelScroll,{passive:true});
  });
  addEventListener('keydown',function(e){
    if(/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key))cancelScroll();
  });

  links.forEach(function(link){
    link.addEventListener('click',function(e){
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var href=this.getAttribute('href');
      if(!href||href==='#')return;
      var target=document.getElementById(decodeURIComponent(href.slice(1)));
      if(!target)return;
      e.preventDefault();
      cancelScroll();
      scrollTarget(target);
      if(window.history&&window.history.pushState&&window.location.hash!==href){
        history.pushState(null,'',href);
      }
    });
  });

  /* Lightweight reading-progress indicator; it does not capture pointer input. */
  var progress=document.createElement('div');
  progress.className='scroll-progress';
  progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  var ticking=false;
  function updateProgress(){
    ticking=false;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    var amount=max>0?Math.max(0,Math.min(1,window.scrollY/max)):0;
    progress.style.transform='scaleX('+amount+')';
  }
  function queueProgress(){
    if(!ticking){ticking=true;requestAnimationFrame(updateProgress);}
  }
  addEventListener('scroll',queueProgress,{passive:true});
  addEventListener('resize',queueProgress,{passive:true});
  updateProgress();
});
 
/* ---------- FX helpers (lightweight, no libs) ---------- */
var fx=q('#fx');
function pop(x,y,sak){
  if(RM||!fx)return;
  for(var i=0;i<14;i++){
    var d=document.createElement('span');
    var ang=(Math.PI*2*i)/14+Math.random()*0.4;
    var dist=42+Math.random()*70;
    d.style.cssText='position:absolute;left:'+x+'px;top:'+y+'px;width:'+(5+Math.random()*6)+'px;height:'+(5+Math.random()*6)+'px;background:'+(sak?'#f4b8c8':(i%3?'#e9b84c':'#7ec9dc'))+';border-radius:50%;pointer-events:none;box-shadow:0 0 10px rgba(255,255,255,.15)';
    fx.appendChild(d);
    var tx=Math.cos(ang)*dist, ty=Math.sin(ang)*dist;
    d.animate(
      [{transform:'translate(-50%,-50%) scale(1)',opacity:1},
       {transform:'translate(calc(-50% + '+tx+'px),calc(-50% + '+ty+'px)) scale(0)',opacity:0}],
      {duration:700+Math.random()*500,easing:'cubic-bezier(.2,.7,.2,1)'}
    ).onfinish=(function(el){return function(){el.remove()}})(d);
  }
}

/* ---------- Animated flat-mesh background (canvas) ---------- */
safe(function(){
  var cv=q('#fss');if(!cv)return;
  var c=cv.getContext('2d'),L={x:.72,y:.3},W=0,H=0,T=[];
  var RM2=RM;
  function mesh(){
    W=cv.width=cv.clientWidth;H=cv.height=cv.clientHeight;T=[];
    var n=Math.max(2,Math.ceil(W/150)),m=Math.max(2,Math.ceil(H/150)),P=[];
    for(var j=0;j<=m;j++){P[j]=[];for(var i=0;i<=n;i++){P[j][i]=[i*W/n+(Math.random()-.5)*70,j*H/m+(Math.random()-.5)*70]}}
    for(var j2=0;j2<m;j2++)for(var i2=0;i2<n;i2++){
      var a=P[j2][i2],b=P[j2][i2+1],d=P[j2+1][i2],e=P[j2+1][i2+1];
      T.push([a,b,d],[b,e,d]);
    }
    T.forEach(function(t){t.cx=(t[0][0]+t[1][0]+t[2][0])/3;t.cy=(t[0][1]+t[1][1]+t[2][1])/3;t.ph=Math.random()*6.28});
  }
  function draw(tm){
    c.clearRect(0,0,W,H);
    for(var i=0;i<T.length;i++){
      var t=T[i];
      var k=Math.max(0,1-Math.hypot(t.cx-L.x*W,t.cy-L.y*H)/(W*.55));
      var w=.5+.5*Math.sin(tm/1700+t.ph);
      c.fillStyle=c.strokeStyle='hsl('+(214+k*34)+','+(28+k*30)+'%,'+(8+k*20+w*5)+'%)';
      c.beginPath();c.moveTo(t[0][0],t[0][1]);c.lineTo(t[1][0],t[1][1]);c.lineTo(t[2][0],t[2][1]);c.closePath();
      c.fill();c.stroke();
    }
    if(!RM2)requestAnimationFrame(draw);
  }
  mesh();requestAnimationFrame(draw);
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(mesh,180)});
  addEventListener('pointermove',function(e){L.x=e.clientX/window.innerWidth;L.y=Math.min(1,e.clientY/H)},{passive:true});
});

/* ---------- Falling petals ---------- */
safe(function(){
  var p=q('.petals');if(!p||RM)return;
  for(var i=0;i<14;i++){
    var el=document.createElement('i');
    el.style.left=Math.random()*100+'%';
    el.style.animation='petal '+(8+Math.random()*6).toFixed(1)+'s linear '+(-Math.random()*8).toFixed(1)+'s infinite';
    el.style.setProperty('--dx',(Math.random()*160-70)+'px');
    el.style.setProperty('--rot',(180+Math.random()*360)+'deg');
    p.appendChild(el);
  }
  var st=document.createElement('style');
  st.textContent='@keyframes petal{0%{transform:translate(0,-30px) rotate(0);opacity:0}10%{opacity:.85}90%{opacity:.5}100%{transform:translate(var(--dx),95vh) rotate(var(--rot));opacity:0}}';
  document.head.appendChild(st);
});

/* ---------- Scroll reveal ---------- */
safe(function(){
  var els=qa('.reveal-up');
  if(RM||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('is-visible')});return}
  var io=new IntersectionObserver(function(es,o){
    es.forEach(function(e){
      if(e.isIntersecting){
        var sibs=Array.prototype.slice.call(e.target.parentNode.children).indexOf(e.target);
        e.target.style.transitionDelay=Math.min(sibs,4)*70+'ms';
        e.target.classList.add('is-visible');
        o.unobserve(e.target);
      }
    });
  },{threshold:.18,rootMargin:'0px 0px -40px 0px'});
  els.forEach(function(e){io.observe(e)});
});

/* ---------- Animated counters ---------- */
safe(function(){
  var bs=qa('.stat b');if(!bs.length)return;
  function run(el){
    var to=+el.dataset.n,dur=1600,t0=performance.now();
    if(RM){el.textContent=to;return}
    (function step(t){
      var p=Math.min(1,(t-t0)/dur);
      el.textContent=Math.round(to*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(step);else el.textContent=to;
    })(t0);
  }
  if(!('IntersectionObserver' in window)){bs.forEach(run);return}
  var io=new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){o.unobserve(e.target);run(e.target)}})},{threshold:.5});
  bs.forEach(function(b){io.observe(b)});
});

/* ---------- Hand-drawn signature underline (SVG) ---------- */
safe(function(){
  var host=q('#sig');if(!host)return;
  var NS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 300 60');svg.setAttribute('width','100%');svg.setAttribute('height','100%');
  svg.setAttribute('preserveAspectRatio','none');
  var p=document.createElementNS(NS,'path');
  p.setAttribute('d','M5 40 C 40 5, 60 60, 100 30 S 170 5, 200 35 S 270 55, 295 20');
  p.setAttribute('fill','none');p.setAttribute('stroke','#e9b84c');
  p.setAttribute('stroke-width','4');p.setAttribute('stroke-linecap','round');
  svg.appendChild(p);host.appendChild(svg);
  var len=p.getTotalLength();
  p.style.strokeDasharray=len;p.style.strokeDashoffset=len;
  function drawIt(){
    p.style.transition='stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1)';
    p.style.strokeDashoffset=0;
  }
  if(RM){p.style.strokeDashoffset=0;return}
  if(!('IntersectionObserver' in window)){drawIt();return}
  var io=new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){o.disconnect();drawIt()}})},{threshold:.6});
  io.observe(host);
});

/* ---------- Marquee scroll-scrub (CSS transform, rAF) ---------- */
safe(function(){
  var mq=q('.marquee'),inner=mq&&mq.firstElementChild;
  if(!mq||!inner||RM)return;
  var ticking=false;
  function upd(){
    ticking=false;
    var r=mq.getBoundingClientRect(),vh=window.innerHeight;
    var prog=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));
    inner.style.transform='translateX('+(-prog*34)+'%)';
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(upd)}},{passive:true});
  upd();
});

/* ---------- Hero entrance ---------- */
safe(function(){
  var n=q('#name');
  if(n){
    var txt=n.textContent;
    n.innerHTML=txt.split('').map(function(ch){
      return ch===' '?' ':'<span class="ch">'+ch+'</span>';
    }).join('');
  }
  if(RM)return;
  var chs=qa('.ch');
  chs.forEach(function(el,i){
    el.style.transform='translateY(115%) rotate(8deg)';
    el.style.transition='transform 1s cubic-bezier(.2,.7,.2,1) '+(0.32+i*.055)+'s';
  });
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    chs.forEach(function(el){el.style.transform='none'});
  })});
  var card=q('.hero-card');
  if(card){
    card.style.clipPath='inset(100% 0 0 0)';
    card.style.transition='clip-path 1.1s cubic-bezier(.2,.7,.2,1) .45s';
    requestAnimationFrame(function(){requestAnimationFrame(function(){card.style.clipPath='inset(0 0 0 0)'})});
  }
});

/* ---------- Parallax on the portrait ---------- */
safe(function(){
  if(RM)return;
  var card=q('.hero-card');if(!card)return;
  addEventListener('pointermove',function(e){
    var x=e.clientX/window.innerWidth-.5,y=e.clientY/window.innerHeight-.5;
    card.style.transform='rotate(2deg) translate('+(x*8).toFixed(2)+'px,'+(y*8).toFixed(2)+'px)';
  },{passive:true});
});

/* ---------- PAPA RULES (vanilla, was React+Framer) ---------- */
safe(function(){
  var root=q('#rules-root');if(!root)return;
  var rules=[
    ['Be there','Show up for the small stuff: homework, cricket, silly voices. The small stuff is the big stuff.'],
    ['Say yes to silly','If Rishab wants a pillow fort at 9 pm, the fort gets built.'],
    ['Teach by doing','Kids copy what we do, not what we say. So do the right thing even when no one is watching.'],
    ['Stay calm, carry on','A samurai doesn\u2019t shout. He breathes, smiles and tries again.']
  ];
  var grid=document.createElement('div');grid.className='rules-grid';
  rules.forEach(function(r,i){
    var card=document.createElement('article');
    card.className='rule reveal-up';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-expanded','false');
    card.innerHTML='<span class="rule-num">RULE 0'+(i+1)+'</span>'+ 
                   '<span class="rule-plus" aria-hidden="true">+</span>'+ 
                   '<h3>'+r[0]+'</h3>'+ 
                   '<p class="rule-body" hidden>'+r[1]+'</p>';
    var plus=card.querySelector('.rule-plus'),body=card.querySelector('.rule-body');
    function settleClosed(el){
      el.hidden=true;el.style.height='';el.style.overflow='';el.style.opacity='';
    }
    function toggle(open){
      var isOpen=open===undefined?!card.classList.contains('open'):open;
      card.classList.toggle('open',isOpen);
      card.setAttribute('aria-expanded',String(isOpen));
      plus.textContent=isOpen?'\u2013':'+';
      if(!body.animate||RM){
        if(isOpen){body.hidden=false;body.style.height='';body.style.overflow='';body.style.opacity='';}
        else settleClosed(body);
        return;
      }
      if(isOpen){
        body.hidden=false;
        body.style.height='';body.style.overflow='';body.style.opacity='';
        var h=body.offsetHeight;
        body.style.height='0';body.style.overflow='hidden';body.style.opacity='0';
        var a=body.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
        a.onfinish=function(){body.style.height='';body.style.overflow='';body.style.opacity=''};
      }else{
        var h2=body.offsetHeight;
        var b=body.animate([{height:h2+'px',opacity:1},{height:'0px',opacity:0}],{duration:200,easing:'cubic-bezier(.2,.7,.2,1)'});
        b.onfinish=function(){settleClosed(body)};
      }
    }
    card.addEventListener('click',function(){toggle()});
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}
    });
    grid.appendChild(card);
  });
  root.appendChild(grid);
  qa('.rule.reveal-up').forEach(function(el){
    if(RM||!('IntersectionObserver' in window)){el.classList.add('is-visible');return}
    var io=new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){
      var i=Array.prototype.indexOf.call(el.parentNode.children,el);
      el.style.transitionDelay=(i*80)+'ms';el.classList.add('is-visible');o.unobserve(e.target);
    }})},{threshold:.15});
    io.observe(el);
  });
});

/* ---------- ENERGY METER (vanilla, was React Motion spring) ---------- */
safe(function(){
  var root=q('#en-root');if(!root)return;
  var opts=[['After chai',100],['Monday morning',28],['Weekend cricket',92],['Past Rishab\u2019s bedtime',12]];
  var val=70,cur=70,target=70,raf=null;
  var meter=document.createElement('div');meter.className='meter';
  var fill=document.createElement('div');fill.className='meter-fill';fill.style.width='70%';
  meter.appendChild(fill);
  var pct=document.createElement('p');pct.className='pct';
  var optsWrap=document.createElement('div');optsWrap.className='energy-opts';
  function render(){pct.innerHTML=Math.round(cur)+'%<small>papa energy</small>';fill.style.width=cur+'%'}
  function animateTo(v){
    target=v;
    if(RM){cur=v;render();return}
    if(raf)cancelAnimationFrame(raf);
    var vel=0;
    (function spring(){
      var k=0.09,damp=0.78;
      vel=(vel+(target-cur)*k)*damp;
      cur+=vel;
      if(Math.abs(vel)<0.05&&Math.abs(target-cur)<0.1){cur=target;render();raf=null;return}
      render();raf=requestAnimationFrame(spring);
    })();
  }
  var btns=opts.map(function(o){
    var b=document.createElement('button');
    b.type='button';b.className='btn ghost';b.textContent=o[0];
    b.addEventListener('click',function(){
      btns.forEach(function(x){x.classList.remove('on')});
      b.classList.add('on');animateTo(o[1]);
    });
    optsWrap.appendChild(b);return b;
  });
  render();
  root.appendChild(meter);root.appendChild(pct);root.appendChild(optsWrap);
  animateTo(70);
});

/* ---------- Say hi ---------- */
safe(function(){
  var heartHost=q('#heart'),btn=q('#love'),msg=q('#msg');
  var NS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 100 90');svg.setAttribute('width','100%');svg.setAttribute('height','100%');
  var path=document.createElementNS(NS,'path');
  path.setAttribute('d','M50 86 C 12 60, 2 38, 12 22 C 22 6, 42 8, 50 24 C 58 8, 78 6, 88 22 C 98 38, 88 60, 50 86 Z');
  path.setAttribute('fill','#f4b8c8');path.setAttribute('stroke','#050b15');path.setAttribute('stroke-width','4');
  path.setAttribute('stroke-linejoin','round');
  svg.appendChild(path);heartHost.appendChild(svg);

  if(!RM){
    var beatT=0;
    (function beat(){
      beatT+=0.035;
      var s=1+Math.sin(beatT)*0.045+Math.sin(beatT*2)*0.02;
      svg.style.transform='scale('+s.toFixed(3)+')';
      requestAnimationFrame(beat);
    })();
  }
  var msgs=['Delivered. Rishab\u2019s papa just smiled.','Received with a very big hug.','Papa says: thank you, beta.','Samurai approved. Love sent back.'];
  var mi=0;
  function send(e){
    var x=(e&&e.clientX)||(heartHost.getBoundingClientRect().left+79);
    var y=(e&&e.clientY)||(heartHost.getBoundingClientRect().top+79);
    pop(x,y,true);
    if(btn&&btn.animate&&!RM){
      heartHost.animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-40px) scale(1.22)'},{transform:'translateY(0) scale(1)'}],{duration:1100,easing:'cubic-bezier(.2,.7,.2,1)'});
    }
    if(msg)msg.textContent=msgs[mi++%msgs.length];
  }
  heartHost.addEventListener('click',send);
  heartHost.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();send(e)}
  });
  if(btn)btn.addEventListener('click',send);

  /* Share works with the native share sheet where available and falls back to copying. */
  var share=q('#share');
  function showShareMessage(text){if(msg)msg.textContent=text}
  function copyLink(url){
    if(navigator.clipboard&&navigator.clipboard.writeText&&window.isSecureContext){
      navigator.clipboard.writeText(url).then(function(){
        showShareMessage('Page link copied. Send it to someone who knows Suraj!');
      }).catch(function(){fallbackCopy(url)});
      return;
    }
    fallbackCopy(url);
  }
  function fallbackCopy(url){
    var field=document.createElement('textarea');
    field.value=url;
    field.setAttribute('readonly','');
    field.style.position='fixed';
    field.style.opacity='0';
    field.style.pointerEvents='none';
    document.body.appendChild(field);
    field.select();
    var copied=false;
    try{copied=document.execCommand('copy')}catch(e){}
    field.remove();
    showShareMessage(copied?'Page link copied. Send it to someone who knows Suraj!':'Copy this link to share: '+url);
  }
  if(share)share.addEventListener('click',function(){
    var url=window.location.href;
    var payload={title:document.title,text:'Meet Suraj — Rishab ka papa.',url:url};
    if(navigator.share){
      navigator.share(payload).then(function(){
        showShareMessage('Thanks for sharing Suraj’s page!');
      }).catch(function(error){
        if(error&&error.name==='AbortError')return;
        copyLink(url);
      });
    }else{
      copyLink(url);
    }
  });

  var burst=q('#burst');
  if(burst)burst.addEventListener('click',function(e){pop(e.clientX,e.clientY)});
});

/* ---------- Reveal.js story deck (loads deferred, so wait for it) ---------- */
safe(function(){
  var deck=q('#deck');if(!deck)return;
  var reveal=null;
  function init(){
    if(!window.Reveal||reveal)return !!reveal;
    try{
      reveal=new Reveal(deck,{
        embedded:true,hash:false,controls:true,progress:true,
        width:960,height:420,margin:.06,transition:'slide',
        keyboard:false,
        keyboardCondition:null,
        touch:false,
        view:'slide',
        scrollActivationWidth:0,
        loop:true,slideNumber:false,history:false,
        respondToHashChanges:false
      });
      reveal.initialize();
      return true;
    }catch(e){reveal=null;return false}
  }
  var wired=false;
  function ready(){
    if(wired||!reveal)return;
    wired=true;
    hookKeys();
    hookSwipe();
    layoutFixups();
    if(deck)deck.classList.add('deck-ready');
  }

  function layoutFixups(){
    if(!reveal)return;
    var lastW=0,lastH=0,raf=null;
    function resync(){
      raf=null;
      var r=deck.getBoundingClientRect();
      var w=Math.round(r.width),h=Math.round(r.height);
      if(!w||!h||(w===lastW&&h===lastH))return;
      lastW=w;lastH=h;
      try{ reveal.layout(); reveal.sync() }catch(e){}
    }
    addEventListener('resize',function(){ if(!raf)raf=requestAnimationFrame(resync) },{passive:true});
    addEventListener('orientationchange',function(){ setTimeout(resync,220) });
    if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(resync) }
    setTimeout(resync,320);
    setTimeout(resync,900);
    resync();
  }
  if(!init()){
    var tries=0;
    var t=setInterval(function(){
      try{
        if(init()||++tries>40){clearInterval(t);ready()}
      }catch(e){clearInterval(t)}
    },50);
    addEventListener('load',function(){clearInterval(t);init();ready()});
  }else{
    ready();
  }

  function hookKeys(){
    if(!reveal)return;
    var story=q('#story'),active=false;
    if('IntersectionObserver' in window && story){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){active=e.isIntersecting});
      },{threshold:.35});
      io.observe(story);
    }else{active=true}
    document.addEventListener('keydown',function(e){
      if(!active)return;
      if(document.querySelector('dialog[open]'))return;
      var t=e.target;
      if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
      if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='PageDown'){
        e.preventDefault();reveal.next();
      }else if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='PageUp'){
        e.preventDefault();reveal.prev();
      }else if(e.key==='Home'){e.preventDefault();reveal.slide(0)}
      else if(e.key==='End'){e.preventDefault();reveal.slide(reveal.getTotalSlides()-1)}
    });
  }

  function hookSwipe(){
    if(!reveal)return;
    var sx=0,sy=0,tracking=false;
    deck.addEventListener('touchstart',function(e){
      if(e.touches.length!==1){tracking=false;return}
      sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
    },{passive:true,capture:true});
    deck.addEventListener('touchend',function(e){
      if(!tracking)return;tracking=false;
      var t=e.changedTouches&&e.changedTouches[0];if(!t)return;
      var dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.4)return;
      if(dx<0)reveal.next();else reveal.prev();
    },{passive:true,capture:true});
    deck.addEventListener('touchcancel',function(){tracking=false},{passive:true,capture:true});
  }
});

/* ---------- Music toggle ---------- */
safe(function(){
  var audio=q('#siteMusic'),btn=q('#musicToggle');
  if(!audio||!btn)return;
  var src=audio.getAttribute('data-src');
  if(src)audio.src=src;
  var hasSrc=!!(audio.currentSrc||audio.src);
  function setOn(on){
    btn.classList.toggle('is-off',!on);
    btn.classList.remove('is-waiting');
    btn.setAttribute('aria-pressed',String(on));
    var label=on?'Music is on. Click to turn it off':'Music is off. Click to turn it on';
    btn.setAttribute('aria-label',label);btn.title=label;
  }
  btn.addEventListener('click',function(){
    if(!hasSrc){
      btn.animate([{transform:'rotate(0)'},{transform:'rotate(-9deg)'},{transform:'rotate(9deg)'},{transform:'rotate(0)'}],{duration:420});
      return;
    }
    if(audio.paused){
      audio.play().then(function(){setOn(true)}).catch(function(){setOn(false)});
    }else{audio.pause();setOn(false)}
  });
  if(hasSrc){setOn(false)}else{setOn(false);btn.classList.add('is-waiting')}
});

/* ---------- Petal burst on load ---------- */
safe(function(){
  if(RM)return;
  setTimeout(function(){pop(window.innerWidth*0.72,window.innerHeight*0.34)},900);
});
})();
