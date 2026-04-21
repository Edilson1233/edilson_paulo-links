 (() => {
    'use strict';
 
    /* ════════════════════════════════════════════════
       A) CURSOR PERSONALIZADO
       O anel (#cursor) segue o rato com leve atraso
       lerp (linear interpolation), criando um efeito
       de "suavidade magnética".
       ════════════════════════════════════════════════ */
    const cursorRing = document.getElementById('cursor');
    const cursorDot  = document.getElementById('cursor-dot');
 
    let mouseX = 0, mouseY = 0; // posição real do rato
    let ringX  = 0, ringY  = 0; // posição interpolada do anel
 
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // O ponto central segue exatamente
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    });
 
    /* Loop de animação: interpola a posição do anel */
    const animateCursor = () => {
      // lerp: move 14% da distância restante a cada frame
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top  = ringY + 'px';
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
 
    /* Expande o anel ao passar em cima de elementos interativos */
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
 
 
    /* ════════════════════════════════════════════════
       B) CANVAS — REDE DE PARTÍCULAS
       Algoritmo:
       1. Criar N partículas com posição e velocidade aleatórias.
       2. A cada frame, mover cada partícula.
       3. Ao atingir a borda, inverter a velocidade.
       4. Desenhar linha entre dois nós se a distância
          deles for menor que MAX_DIST; a opacidade
          da linha é proporcional à proximidade.
       ════════════════════════════════════════════════ */
    const canvas = document.getElementById('bg-canvas');
    const ctx    = canvas.getContext('2d');
 
    /* Cores das partículas (brand TechVerse) */
    const COLORS  = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981'];
    const MAX_DIST = 150;  /* distância máxima para desenhar linha */
    let   particles = [];
 
    /* Ajusta o canvas ao tamanho da janela */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', () => { resize(); initParticles(); });
 
    /* Cria as partículas — quantidade adaptada ao tamanho do ecrã */
    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 14000);
      const n     = Math.max(30, Math.min(count, 90)); // entre 30 e 90
      particles   = [];
      for (let i = 0; i < n; i++) {
        const speed = 0.2 + Math.random() * 0.3;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x:      Math.random() * canvas.width,
          y:      Math.random() * canvas.height,
          vx:     Math.cos(angle) * speed,
          vy:     Math.sin(angle) * speed,
          radius: 1.2 + Math.random() * 1.6,
          color:  COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha:  0.4 + Math.random() * 0.5,
        });
      }
    };
    initParticles();
 
    /* Helper: converte cor hex em rgba com opacidade */
    const hexToRgba = (hex, a) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };
 
    /* Loop de renderização */
    const renderCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
 
      /* Atualizar e desenhar cada partícula */
      particles.forEach(p => {
        // Movimento
        p.x += p.vx;
        p.y += p.vy;
        // Rebote nas bordas
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
 
        // Ponto da partícula
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(p.color, p.alpha);
        ctx.fill();
      });
 
      /* Desenhar linhas de conexão */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx   = a.x - b.x;
          const dy   = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
 
          if (dist < MAX_DIST) {
            // Opacidade cresce quanto mais próximos os nós
            const opacity = (1 - dist / MAX_DIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = hexToRgba(a.color, opacity);
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }
 
      requestAnimationFrame(renderCanvas);
    };
    renderCanvas();
 
 
    /* ════════════════════════════════════════════════
       C) TYPEWRITER — EFEITO DE DIGITAÇÃO
       Recebe um array de frases. Digita a frase atual
       caractere a caractere, espera, apaga, e passa
       para a próxima. Um cursor piscante é inserido
       no final do texto.
       ════════════════════════════════════════════════ */
    const typeTarget = document.getElementById('typewriter-target');
 
    const PHRASES = [
      'Estudante de Eng. Informática',
      'Desenvolvedor Full-Stack',
      'Trader · TechVerse Digital',
    ];
 
    let phraseIdx  = 0;   // índice da frase atual
    let charIdx    = 0;   // posição do caractere atual
    let isDeleting = false;
 
    const SPEED_TYPE   = 65;   // ms por caractere ao digitar
    const SPEED_DELETE = 35;   // ms por caractere ao apagar
    const PAUSE_END    = 1800; // ms de pausa no fim da frase
    const PAUSE_START  = 400;  // ms de pausa antes de começar a digitar
 
    /* Injeta o cursor piscante */
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.setAttribute('aria-hidden', 'true');
 
    const typewriterTick = () => {
      const currentPhrase = PHRASES[phraseIdx];
 
      if (!isDeleting) {
        // Está a digitar: acrescenta mais um caractere
        charIdx++;
        typeTarget.textContent = currentPhrase.slice(0, charIdx);
        typeTarget.appendChild(cursor);
 
        if (charIdx === currentPhrase.length) {
          // Frase completa: pausa antes de apagar
          isDeleting = true;
          setTimeout(typewriterTick, PAUSE_END);
          return;
        }
      } else {
        // Está a apagar: remove um caractere
        charIdx--;
        typeTarget.textContent = currentPhrase.slice(0, charIdx);
        typeTarget.appendChild(cursor);
 
        if (charIdx === 0) {
          // Frase apagada: passa para a próxima
          isDeleting = false;
          phraseIdx  = (phraseIdx + 1) % PHRASES.length;
          setTimeout(typewriterTick, PAUSE_START);
          return;
        }
      }
 
      setTimeout(typewriterTick, isDeleting ? SPEED_DELETE : SPEED_TYPE);
    };
 
    setTimeout(typewriterTick, 800); // inicia após a animação de entrada
 
 
    /* ════════════════════════════════════════════════
       D) CONTADOR DE VISITAS
       Usa localStorage para persistir o contador
       entre sessões no mesmo browser.
       Exibe o número com uma animação de contagem.
       ════════════════════════════════════════════════ */
    const visitNumEl = document.getElementById('visit-num');
    const STORAGE_KEY = 'tv_visit_count';
 
    /* Lê o valor atual (ou 0 se nunca visitou) e incrementa */
    const rawCount  = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const newCount  = rawCount + 1;
    localStorage.setItem(STORAGE_KEY, String(newCount));
 
    /*
     * Animação de contagem: parte de max(0, newCount-50)
     * e incrementa até newCount ao longo de ~1 segundo.
     * Dá a sensação de um "odômetro" a girar.
     */
    const animateCount = (target) => {
      const start    = Math.max(0, target - 50);
      const duration = 1000; // ms
      const startTime = performance.now();
 
      const step = (now) => {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing out-quart para desacelerar no final
        const eased    = 1 - Math.pow(1 - progress, 4);
        const current  = Math.round(start + (target - start) * eased);
        visitNumEl.textContent = current.toLocaleString('pt-PT');
        if (progress < 1) requestAnimationFrame(step);
      };
 
      requestAnimationFrame(step);
    };
 
    animateCount(newCount);
 
 
    /* ════════════════════════════════════════════════
       E) COPIAR LINK — Clipboard API
       Ao clicar no botão, copia a URL atual.
       Mostra o toast de confirmação por 2,5 s.
       ════════════════════════════════════════════════ */
    const copyBtn   = document.getElementById('copy-btn');
    const copyLabel = document.getElementById('copy-label');
    const copyIcon  = document.getElementById('copy-icon');
    const toast     = document.getElementById('toast');
    let   toastTimer;
 
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast();
      } catch {
        /* Fallback para browsers sem Clipboard API */
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast();
      }
    });
 
    const showToast = () => {
      /* Atualiza o visual do botão */
      copyBtn.classList.add('copied');
      copyLabel.textContent = 'Copiado!';
      copyIcon.className    = 'fa-solid fa-check';
 
      /* Mostra o toast */
      clearTimeout(toastTimer);
      toast.classList.add('show');
 
      /* Reverte após 2,5 s */
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyLabel.textContent = 'Copiar Link';
          copyIcon.className    = 'fa-regular fa-copy';
        }, 400);
      }, 2500);
    };
 
 
    /* ════════════════════════════════════════════════
       F) RIPPLE NOS BOTÕES DE LINK
       Efeito de ondulação no ponto de clique.
       Mesmo padrão da versão anterior, mas aplicado
       apenas aos .link-btn (não ao copy-btn).
       ════════════════════════════════════════════════ */
    document.querySelectorAll('.link-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const old = this.querySelector('.ripple');
        if (old) old.remove();
 
        const rect  = this.getBoundingClientRect();
        const size  = Math.max(rect.width, rect.height);
        const x     = e.clientX - rect.left - size / 2;
        const y     = e.clientY - rect.top  - size / 2;
 
        const rip = document.createElement('span');
        rip.className = 'ripple';
        Object.assign(rip.style, {
          position: 'absolute',
          width: size + 'px', height: size + 'px',
          left: x + 'px', top: y + 'px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          transform: 'scale(0)',
          animation: 'rippleAnim 0.6s ease-out forwards',
          pointerEvents: 'none',
        });
        this.appendChild(rip);
        rip.addEventListener('animationend', () => rip.remove());
      });
    });
 
  })(); // IIFE — encapsula tudo num escopo privado