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

/* ---------- Say hi ---------- */
safe(function(){
  var heartHost=q('#heart'),btn=q('#love'),msg=q('#msg');
  if(!heartHost)return;
  var NS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 100 90');svg.setAttribute('width','100%');svg.setAttribute('height','100%');
  var path=document.createElementNS(NS,'path');
  path.setAttribute('d','M50 86 C 12 60, 2 38, 12 22 C 22 6, 42 8, 50 24 C 58 8, 78 6, 88 22 C 98 38, 88 60, 50 86 Z');
  path.setAttribute('fill','#466b50');path.setAttribute('stroke','none');
  svg.appendChild(path);heartHost.appendChild(svg);

  var msgs=['Delivered. Rishab\u2019s papa just smiled.','Received with a very big hug.','Papa says: thank you, beta.','Samurai approved. Love sent back.'];
  var mi=0;
  function send(e){
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

});

})();
