(() => {
  "use strict";

  const canvas = document.querySelector("#love-canvas");
  const context = canvas.getContext("2d");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, active: false };

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];
  let ripples = [];
  let animationFrame = 0;

  const random = (minimum, maximum) => Math.random() * (maximum - minimum) + minimum;

  function createParticle(initial = false) {
    const isHeart = Math.random() > 0.82;

    return {
      x: random(0, width),
      y: initial ? random(0, height) : height + random(10, 100),
      size: isHeart ? random(2.5, 6.5) : random(0.7, 2.2),
      speed: random(0.08, 0.34),
      drift: random(-0.1, 0.1),
      alpha: random(0.12, 0.65),
      pulse: random(0, Math.PI * 2),
      heart: isHeart
    };
  }

  function setCanvasSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particleCount = Math.min(150, Math.max(55, Math.round((width * height) / 9500)));
    particles = Array.from({ length: particleCount }, () => createParticle(true));
    drawScene(0);
  }

  function drawBackground() {
    const gradient = context.createRadialGradient(
      width * 0.5,
      height * 0.44,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.76
    );

    gradient.addColorStop(0, "#392037");
    gradient.addColorStop(0.36, "#28162c");
    gradient.addColorStop(0.72, "#180f22");
    gradient.addColorStop(1, "#0d0914");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(
      width * 0.5 + (pointer.active ? (pointer.x - width * 0.5) * 0.04 : 0),
      height * 0.47 + (pointer.active ? (pointer.y - height * 0.5) * 0.04 : 0),
      0,
      width * 0.5,
      height * 0.47,
      Math.min(width, height) * 0.48
    );
    glow.addColorStop(0, "rgba(242, 147, 167, 0.11)");
    glow.addColorStop(0.55, "rgba(175, 74, 116, 0.035)");
    glow.addColorStop(1, "rgba(90, 30, 70, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  function drawHeart(x, y, size, alpha) {
    context.save();
    context.translate(x, y);
    context.scale(size / 16, size / 16);
    context.beginPath();
    context.moveTo(0, 4);
    context.bezierCurveTo(-8, -3, -9, 7, 0, 13);
    context.bezierCurveTo(9, 7, 8, -3, 0, 4);
    context.fillStyle = `rgba(255, 201, 211, ${alpha})`;
    context.shadowColor = "rgba(255, 150, 175, 0.45)";
    context.shadowBlur = 8;
    context.fill();
    context.restore();
  }

  function drawParticles(time) {
    particles.forEach((particle, index) => {
      const flicker = 0.68 + Math.sin(time * 0.0012 + particle.pulse) * 0.32;
      const pointerDistance = Math.hypot(pointer.x - particle.x, pointer.y - particle.y);
      const pointerLift = pointer.active && pointerDistance < 130 ? (130 - pointerDistance) * 0.0008 : 0;

      if (!motionQuery.matches) {
        particle.y -= particle.speed + pointerLift;
        particle.x += particle.drift + Math.sin(time * 0.00045 + particle.pulse) * 0.035;
      }

      if (particle.y < -20 || particle.x < -20 || particle.x > width + 20) {
        particles[index] = createParticle();
        return;
      }

      if (particle.heart) {
        drawHeart(particle.x, particle.y, particle.size, particle.alpha * flicker * 0.58);
        return;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 229, 229, ${particle.alpha * flicker})`;
      context.shadowColor = "rgba(255, 193, 208, 0.7)";
      context.shadowBlur = particle.size * 5;
      context.fill();
      context.shadowBlur = 0;
    });
  }

  function drawRipples() {
    ripples = ripples.filter((ripple) => ripple.alpha > 0.01);
    ripples.forEach((ripple) => {
      ripple.radius += 0.85;
      ripple.alpha *= 0.975;
      context.beginPath();
      context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      context.strokeStyle = `rgba(255, 198, 210, ${ripple.alpha})`;
      context.lineWidth = 0.7;
      context.stroke();
    });
  }

  function drawScene(time) {
    context.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(time);
    drawRipples();
  }

  function animate(time) {
    drawScene(time);
    animationFrame = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", setCanvasSize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  window.addEventListener("pointerdown", (event) => {
    ripples.push({ x: event.clientX, y: event.clientY, radius: 5, alpha: 0.45 });
    drawHeart(event.clientX, event.clientY - 4, 9, 0.7);
  }, { passive: true });
  motionQuery.addEventListener("change", startAnimation);

  setCanvasSize();
  startAnimation();
})();
