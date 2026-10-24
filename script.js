(() => {
  'use strict';
  const config = window.BIRTHDAY_CONFIG || {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stages = Object.fromEntries(['welcome','letter','wishes','countdown','celebration','final'].map(id => [id, document.getElementById(id)]));
  const soundToggle = document.getElementById('sound-toggle');
  const soundLabel = document.getElementById('sound-label');
  const countNumber = document.getElementById('count-number');
  const countdownTitle = document.getElementById('countdown-title');
  const ringProgress = document.getElementById('ring-progress');
  const grandCountdown = document.getElementById('grand-countdown');
  const grandCountNumber = document.getElementById('grand-count-number');
  const bookBursts = document.getElementById('book-bursts');
  const toast = document.getElementById('toast');

  const replace = (value, fallback = '') => String(value == null ? fallback : value);
  const birthdayName = replace(config.birthdayName, 'MARIYAMMMMMMM');
  const sender = replace(config.senderName, 'MD');
  const nickname = replace(config.senderNickname, 'Makkar MD');
  document.title = `HAPPIEST BIRTHDAY ${birthdayName} ✦`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `A beautiful birthday universe, made with love by ${sender} (${nickname}).`;

  let activeStage = 'welcome';
  let timers = new Set();
  let countdownRunning = false;
  let finaleRunning = false;
  let soundEnabled = Boolean(config.soundEnabledByDefault);
  let audioContext = null;
  let toastTimer = null;
  let rafId = 0;
  const totalBursts = 10; // Exactly ten individually scheduled book-burst events.
  const countdownSeconds = Math.max(1, Number(config.countdownSeconds) || 10);

  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? 'Disable sound effects' : 'Enable sound effects');
  soundLabel.textContent = soundEnabled ? 'Sound on' : 'Sound off';

  function later(fn, delay) {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, delay);
    timers.add(id); return id;
  }
  function every(fn, delay) { const id = window.setInterval(fn, delay); timers.add(id); return id; }
  function clearTimer(id) { if (id == null) return; window.clearTimeout(id); window.clearInterval(id); timers.delete(id); }
  function clearTimers() { for (const id of timers) { clearTimeout(id); clearInterval(id); } timers.clear(); }
  function setStage(name) {
    if (!stages[name]) return;
    for (const [key, node] of Object.entries(stages)) {
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle('is-active', active);
    }
    activeStage = name;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  function showToast(message) {
    toast.textContent = message; toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function ensureAudio() {
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioContext = new Ctx();
    }
    if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  function tone(frequency, duration = .16, volume = .025, wave = 'sine', delay = 0) {
    if (!soundEnabled) return;
    const ctx = ensureAudio(); if (!ctx) return;
    const start = ctx.currentTime + delay; const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(volume,.0002), start + .02); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start); oscillator.stop(start + duration + .025);
  }
  function chime() { tone(587.33,.22,.025,'sine',0); tone(739.99,.27,.022,'sine',.09); tone(880,.34,.02,'sine',.19); }
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled)); soundToggle.setAttribute('aria-label', soundEnabled ? 'Disable sound effects' : 'Enable sound effects'); soundLabel.textContent = soundEnabled ? 'Sound on' : 'Sound off';
    if (soundEnabled) { ensureAudio(); tone(659.25,.15,.025); later(() => tone(783.99,.2,.022), 90); showToast('Gentle chimes are on ✦'); }
    else showToast('Sound is off — enjoy the quiet magic');
  });

  document.getElementById('open-surprise').addEventListener('click', () => { tone(659.25,.14,.022); later(() => tone(783.99,.17,.02),75); setStage('letter'); });
  document.getElementById('to-wishes').addEventListener('click', () => setStage('wishes'));
  document.getElementById('to-countdown').addEventListener('click', beginCountdown);
  document.getElementById('skip-countdown').addEventListener('click', () => {
    if (!countdownRunning) return;
    countdownRunning = false; clearTimers(); beginGrandCountdown();
  });
  document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', resetExperience));
  document.getElementById('replay').addEventListener('click', resetExperience);

  const wishes = {
    peace: ['A little more peace', 'May you find quiet moments where your shoulders can soften and your heart can rest.'],
    laughter: ['Real, unplanned laughter', 'May the kind of laughter that makes your cheeks hurt find you often.'],
    kindness: ['People who feel like sunshine', 'May kind people meet you with the same warmth you give to the world.'],
    surprises: ['Beautiful surprises', 'May ordinary days bring you little things you never knew you needed.'],
    dreams: ['New dreams', 'May you always have something lovely to imagine and something exciting to look forward to.'],
    belief: ['A quiet belief in yourself', 'May you see in yourself the good that other people are lucky enough to see in you.'],
    freedom: ['Freedom to be yourself', 'May you feel free to grow, change, choose, and be fully yourself.'],
    gentle: ['Gentle days', 'May not every day ask so much of you; may some days simply be kind.'],
    joy: ['Unexpected joy', 'May happiness catch you by surprise—in a song, a message, a memory, or a silly little moment.'],
    own: ['A life that feels like your own', 'May your choices, dreams, and everyday happiness feel more and more like you.']
  };
  const wishTitle = document.getElementById('wish-reveal-title');
  const wishCopy = document.getElementById('wish-reveal-copy');
  document.querySelectorAll('[data-wish]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-wish]').forEach(item => item.classList.toggle('is-selected', item === button));
    const [title, copy] = wishes[button.dataset.wish] || ['A little wish for you', 'May something good find you today.'];
    wishTitle.textContent = title; wishCopy.textContent = copy; tone(720,.14,.018,'sine');
  }));

  const countdownMessages = {
    10: 'A little wish for your happiness…',
    9: 'For the small joys that mean so much…',
    8: 'For all the dreams that still await you…',
    7: 'For the little minds you inspire…',
    6: 'For kind people and gentler days…',
    5: 'For laughter you never saw coming…',
    4: 'For memories still waiting to happen…',
    3: 'For every beautiful thing still to come…',
    2: 'One more breath, one more wish…',
    1: 'MARIYAM, THIS MOMENT IS YOURS! ✨'
  };
  function paintCountdown(value) {
    countNumber.textContent = String(value); countNumber.classList.remove('tick'); void countNumber.offsetWidth; countNumber.classList.add('tick');
    countdownTitle.textContent = countdownMessages[value] || 'Your little universe is almost ready…';
    const percent = Math.max(1, ((countdownSeconds - value + 1) / countdownSeconds) * 100);
    ringProgress.style.background = `conic-gradient(from -90deg, #efd6a2 0%, #d9baff ${percent}%, rgba(255,255,255,.035) ${percent}% 100%)`;
    tone(value <= 3 ? 620 : 430,.075,.016,'sine');
    if (!reducedMotion && value <= 5) {
      const rect = document.getElementById('count-ring').getBoundingClientRect();
      launchFirework(rect.left + rect.width/2, rect.top + rect.height*.32, ['#efd6a2','#d5c3ff','#f4c7d9'], 20, .68);
    }
  }
  function beginCountdown() {
    if (countdownRunning || finaleRunning) return;
    clearTimers(); countdownRunning = true; setStage('countdown');
    let count = countdownSeconds; paintCountdown(count);
    const id = every(() => {
      if (!countdownRunning) return;
      if (count > 1) { count -= 1; paintCountdown(count); }
      else { clearTimer(id); countdownRunning = false; later(beginGrandCountdown, 400); }
    },1000);
  }
  function beginGrandCountdown() {
    clearTimers(); countdownRunning = false; finaleRunning = true; setStage('celebration'); bookBursts.innerHTML = ''; grandCountdown.hidden = false;
    let digit = 3; paintGrandDigit(digit); tone(520,.12,.018);
    const id = every(() => {
      if (digit > 1) { digit -= 1; paintGrandDigit(digit); tone(digit === 1 ? 700 : 540,.12,.018); }
      else { clearTimer(id); later(() => { grandCountdown.hidden = true; startBookFinale(); }, 430); }
    }, 720);
  }
  function paintGrandDigit(digit) { grandCountNumber.textContent = String(digit); grandCountNumber.style.animation = 'none'; void grandCountNumber.offsetWidth; grandCountNumber.style.animation = ''; }

  const burstPositions = [
    {x:12,y:25,rotate:-22,color:'#e7c48f',scale:.83,end:-26,dx:-50,dy:-64},
    {x:84,y:25,rotate:17,color:'#d7bdf7',scale:.9,end:18,dx:52,dy:-56},
    {x:20,y:70,rotate:13,color:'#efb9d3',scale:.84,end:36,dx:-58,dy:33},
    {x:80,y:68,rotate:-15,color:'#a8c9ed',scale:.9,end:-22,dx:62,dy:28},
    {x:50,y:15,rotate:8,color:'#efd9a5',scale:.77,end:32,dx:-5,dy:-72},
    {x:8,y:49,rotate:-10,color:'#c5b7f0',scale:.8,end:-38,dx:-68,dy:-8},
    {x:91,y:48,rotate:20,color:'#e9b3d0',scale:.84,end:34,dx:68,dy:-13},
    {x:34,y:83,rotate:10,color:'#e9cf9f',scale:.78,end:28,dx:-34,dy:55},
    {x:68,y:82,rotate:-19,color:'#b9d8ed',scale:.83,end:-31,dx:38,dy:54},
    {x:50,y:66,rotate:4,color:'#e5bce8',scale:1.03,end:42,dx:0,dy:-75}
  ];
  const accentColors = ['#fff1d1','#fbe5f2','#e6deff','#f4e7c5','#dceeff'];
  function lighten(hex, amount) {
    const number = parseInt(hex.slice(1),16); const r = Math.min(255,((number>>16)&255)+amount); const g = Math.min(255,((number>>8)&255)+amount); const b = Math.min(255,(number&255)+amount);
    return `#${[r,g,b].map(value=>value.toString(16).padStart(2,'0')).join('')}`;
  }
  function bookSvg(index,color) {
    const accent = accentColors[index % accentColors.length]; const light = lighten(color,25); const grad = `burst-grad-${index}`;
    return `<svg viewBox="0 0 100 105" aria-hidden="true" focusable="false"><defs><linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><g stroke-linejoin="round"><path d="M10 27 Q30 17 49 31 V86 Q28 70 10 78Z" fill="${color}" stroke="rgba(255,255,255,.7)" stroke-width="1.4"/><path d="M51 31 Q70 17 90 27 V78 Q71 70 51 86Z" fill="${light}" stroke="rgba(255,255,255,.7)" stroke-width="1.4"/><path d="M15 24 Q32 18 47 31 V79 Q31 67 15 72Z" fill="url(#${grad})" stroke="rgba(255,255,255,.55)"/><path d="M53 31 Q69 18 85 24 V72 Q68 67 53 79Z" fill="${light}" stroke="rgba(255,255,255,.6)"/><path d="M50 31V85" stroke="${accent}" stroke-width="2.2"/><g fill="none" stroke="rgba(255,255,255,.8)" stroke-linecap="round" stroke-width="1.5"><path d="M22 38l18-3M22 45l18-3M22 52l18-3M61 35l17 3M61 42l17 3M61 49l17 3"/></g><path d="M50 7l3.2 6.7 7.4 1.1-5.3 5.1 1.3 7.3-6.6-3.5-6.6 3.5 1.3-7.3-5.3-5.1 7.4-1.1Z" fill="${accent}" stroke="rgba(255,255,255,.85)" stroke-width=".8"/></g></svg>`;
  }
  function createBookBurst(index,position) {
    const burst = document.createElement('div'); burst.className = 'book-burst'; burst.dataset.burstIndex = String(index+1);
    burst.style.left = `${position.x}%`; burst.style.top = `${position.y}%`; burst.style.setProperty('--book-color',position.color); burst.style.setProperty('--end-rotate',`${position.end}deg`); burst.style.scale = String(position.scale); burst.style.transform = `translate(-50%,-50%) rotate(${position.rotate}deg)`;
    burst.innerHTML = `<span class="book-glow"></span>${bookSvg(index,position.color)}`;
    const pages = [
      {x:-42,y:-48,r:-42},{x:43,y:-49,r:60},{x:56,y:22,r:115},{x:-53,y:29,r:-100},
      {x:-5,y:-65,r:19},{x:13,y:52,r:-18},{x:-30,y:9,r:40},{x:34,y:-12,r:-48}
    ];
    pages.forEach((page,i)=>{const fragment=document.createElement('span');fragment.className='page-fragment';fragment.style.setProperty('--dx',`${page.x+position.dx*.4}px`);fragment.style.setProperty('--dy',`${page.y+position.dy*.4}px`);fragment.style.setProperty('--r',`${page.r+position.rotate}deg`);fragment.style.setProperty('--delay',`${.08+i*.025}s`);fragment.style.background=`linear-gradient(145deg,#fff9eb,${position.color})`;burst.appendChild(fragment);});
    bookBursts.appendChild(burst); later(()=>burst.remove(),2100);
  }
  function startBookFinale() {
    if (!finaleRunning) return;
    bookBursts.innerHTML='';
    const positions = Array.from({length:totalBursts},(_,index)=>burstPositions[index % burstPositions.length]);
    const interval = reducedMotion ? 100 : 360;
    positions.forEach((position,index)=>later(()=>{
      if (!finaleRunning) return;
      createBookBurst(index,position);
      const x=window.innerWidth*position.x/100; const y=window.innerHeight*position.y/100;
      if (!reducedMotion) launchFirework(x,y,[position.color,'#f9e9c8','#d9c9ff','#fff3e7'],index===positions.length-1?76:38,index===positions.length-1?1.45:1.05);
      if (index%2===0) tone(650+index*19,.1,.013);
    },index*interval));
    if (!reducedMotion) {
      const fireId=every(()=>{if(!finaleRunning||activeStage!=='celebration')return;launchFirework(window.innerWidth*(.12+Math.random()*.76),window.innerHeight*(.1+Math.random()*.38),['#efd6a2','#d5c3ff','#f4c7d9','#c4ddf7'],29,.86);},620);
      later(()=>clearTimer(fireId),Math.max(3500,positions.length*interval+500));
    }
    later(()=>{if(!finaleRunning)return;finaleRunning=false;clearTimers();chime();setStage('final');},Math.max(2900,(positions.length-1)*interval+2200));
  }

  document.getElementById('replay').addEventListener('click',resetExperience);
  function resetExperience(){clearTimers();countdownRunning=false;finaleRunning=false;bookBursts.innerHTML='';grandCountdown.hidden=true;particles.length=0;document.querySelectorAll('[data-wish]').forEach(item=>item.classList.remove('is-selected'));wishTitle.textContent='A little wish for you';wishCopy.textContent='Pick any star above and let a good thing find you.';setStage('welcome');}

  // Lightweight ambient sky and canvas fireworks.
  const canvas=document.getElementById('sky-canvas'); const ctx=canvas.getContext('2d',{alpha:true});
  let width=window.innerWidth,height=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,2),stars=[],particles=[],frame=0,lastFrame=0,skyPaused=document.hidden;
  function resizeCanvas(){width=window.innerWidth;height=window.innerHeight;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx.setTransform(dpr,0,0,dpr,0,0);const count=reducedMotion?35:Math.max(42,Math.min(100,Math.floor(width*height/15000)));stars=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,r:.3+Math.random()*1.2,a:.15+Math.random()*.5,p:Math.random()*Math.PI*2,s:.12+Math.random()*.45,drift:(Math.random()-.5)*.1}));}
  function launchFirework(x,y,palette=['#efd6a2','#d5c3ff','#f4c7d9'],amount=40,power=1){if(reducedMotion)return;const count=Math.min(amount,82);for(let i=0;i<count;i++){const angle=(Math.PI*2*i/count)+(Math.random()-.5)*.09;const speed=(.8+Math.random()*2.8)*power;particles.push({x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:50+Math.random()*30,max:80,r:.7+Math.random()*1.8,color:palette[Math.floor(Math.random()*palette.length)],drag:.982,gravity:.018+Math.random()*.025});}if(particles.length>650)particles.splice(0,particles.length-650);}
  function drawSky(time){if(skyPaused)return;const delta=Math.min(32,(time-lastFrame||16.67)/16.67);lastFrame=time;ctx.clearRect(0,0,width,height);for(const star of stars){star.p+=.008*star.s*delta;star.x+=star.drift*delta;if(star.x<-3)star.x=width+3;if(star.x>width+3)star.x=-3;const alpha=star.a*(.65+.35*Math.sin(star.p));ctx.beginPath();ctx.fillStyle=`rgba(245,232,255,${alpha})`;ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();}for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.px=p.x;p.py=p.y;p.x+=p.vx*delta;p.y+=p.vy*delta;p.vx*=Math.pow(p.drag,delta);p.vy=p.vy*Math.pow(p.drag,delta)+p.gravity*delta;p.life-=delta;if(p.life<=0){particles.splice(i,1);continue;}const alpha=Math.min(1,p.life/18)*(p.life/p.max);ctx.beginPath();ctx.strokeStyle=p.color;ctx.globalAlpha=alpha;ctx.lineWidth=p.r;ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.globalAlpha=1;}frame=requestAnimationFrame(drawSky);}
  function startSky(){if(!frame&&!skyPaused)frame=requestAnimationFrame(drawSky)}function stopSky(){skyPaused=true;if(frame)cancelAnimationFrame(frame);frame=0;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSky();else{skyPaused=false;lastFrame=0;startSky()}});window.addEventListener('resize',resizeCanvas,{passive:true});
  if(hoverCapable){let pointerTask=0;window.addEventListener('pointermove',event=>{if(pointerTask)return;pointerTask=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--pointer-x',`${event.clientX}px`);document.documentElement.style.setProperty('--pointer-y',`${event.clientY}px`);pointerTask=0;});},{passive:true});}
  window.addEventListener('pagehide',()=>{clearTimers();stopSky();if(audioContext&&audioContext.state!=='closed')audioContext.close().catch(()=>{});});
  resizeCanvas();startSky();
})();
