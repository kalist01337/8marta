const intro = document.getElementById("intro");
const startButton = document.getElementById("startExperience");
const bgVideo = document.getElementById("bgVideo");
const bgMusic = document.getElementById("bgMusic");
const revealElements = document.querySelectorAll(".reveal");
const petalsRoot = document.querySelector(".petals");
const sparklesRoot = document.querySelector(".sparkles");
const visualizerBars = document.querySelectorAll(".visualizer span");
const cardRainTargets = document.querySelectorAll(
  ".signature-card, .mini-card, .letter-shell, .promise-card"
);
const tiltCard = document.querySelector(".signature-card");
const isIOS =
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reducedMotion = prefersReducedMotion && !isIOS;
const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;
const MUSIC_VOLUME = 0.22;
const gsapLib = window.gsap;
const scrollTriggerLib = window.ScrollTrigger;
const hasGsap = Boolean(gsapLib && scrollTriggerLib);

document.body.classList.toggle("is-ios", isIOS);

let introDismissed = false;
let playHeroScene = () => {};
let visualizerTweens = [];
let experienceReady = false;
let particleEffectsReady = false;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function scheduleDeferredWork(callback) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback(), { timeout: 900 });
    return;
  }

  window.setTimeout(() => callback(), 180);
}

function setupBackgroundVideo() {
  if (!bgVideo) {
    return;
  }

  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const nextSource = isMobile ? "background-video-360.mp4" : "background-video-720.mp4";

  if (bgVideo.getAttribute("src") !== nextSource) {
    bgVideo.setAttribute("src", nextSource);
    bgVideo.load();
  }

  bgVideo.defaultPlaybackRate = 0.56;
  bgVideo.playbackRate = 0.56;
  bgVideo.play().catch(() => {});
}

function updateMusicButtons(isPlaying) {
  document.body.classList.toggle("music-on", isPlaying);

  if (visualizerTweens.length > 0) {
    visualizerTweens.forEach((tween) => {
      if (isPlaying) {
        tween.resume();
      } else {
        tween.pause();
      }
    });
  }
}

async function playMusic() {
  if (!bgMusic) {
    return false;
  }

  bgMusic.volume = MUSIC_VOLUME;

  try {
    await bgMusic.play();
    updateMusicButtons(true);
    return true;
  } catch (error) {
    updateMusicButtons(false);
    return false;
  }
}

function hideIntroImmediately() {
  if (!intro) {
    return;
  }

  intro.classList.add("is-hidden");
  intro.style.opacity = "0";
  intro.style.visibility = "hidden";
  intro.style.pointerEvents = "none";
}

function closeIntro() {
  if (!intro || introDismissed) {
    return Promise.resolve();
  }

  introDismissed = true;

  if (hasGsap && !reducedMotion) {
    return new Promise((resolve) => {
      gsapLib.to(intro, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          hideIntroImmediately();
          resolve();
        },
      });
    });
  }

  hideIntroImmediately();
  return Promise.resolve();
}

function setupFallbackReveals() {
  if ("IntersectionObserver" in window) {
    const revealList = Array.from(revealElements);
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    revealElements.forEach((element) => {
      const revealIndex = revealList.indexOf(element);
      element.style.setProperty("--reveal-delay", `${Math.min(revealIndex * 90, 420)}ms`);

      if (!element.classList.contains("is-visible")) {
        revealObserver.observe(element);
      }
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }
}

function createMotionGlows() {
  const glowTargets = document.querySelectorAll(
    ".intro-card, .signature-card, .quote-card, .music-card, .gallery-note-card, .gallery-feature-frame, .letter, .promise-card"
  );
  const glowPalettes = [
    "motion-glow--rose",
    "motion-glow--blush",
    "motion-glow--champagne",
  ];

  glowTargets.forEach((target, index) => {
    const hasDirectGlow = Array.from(target.children).some(
      (child) => child.classList && child.classList.contains("motion-glow")
    );

    if (hasDirectGlow) {
      return;
    }

    const glow = document.createElement("span");
    glow.className = `motion-glow ${glowPalettes[index % glowPalettes.length]}`;

    if (target.classList.contains("intro-card") || target.classList.contains("signature-card")) {
      glow.classList.add("motion-glow--hero");
    }

    if (
      target.classList.contains("quote-card") ||
      target.classList.contains("music-card") ||
      target.classList.contains("promise-card")
    ) {
      glow.classList.add("motion-glow--edge");
    }

    if (target.classList.contains("gallery-feature-frame")) {
      glow.classList.add("motion-glow--compact");
    }

    target.prepend(glow);
  });
}

function createLightSweeps() {
  const sweepTargets = document.querySelectorAll(
    ".signature-card, .quote-card, .music-card, .gallery-note-card, .gallery-feature-frame, .letter, .promise-card"
  );
  const sweepPalettes = [
    "light-sweep--rose",
    "light-sweep--gold",
    "light-sweep--blush",
  ];

  sweepTargets.forEach((target, index) => {
    const hasSweep = Array.from(target.children).some(
      (child) => child.classList && child.classList.contains("light-sweep")
    );

    if (hasSweep) {
      return;
    }

    const sweep = document.createElement("span");
    sweep.className = `light-sweep ${sweepPalettes[index % sweepPalettes.length]}`;
    target.prepend(sweep);
  });
}

function createBackgroundPetals() {
  if (!petalsRoot || reducedMotion) {
    return;
  }

  const petalCount = window.matchMedia("(max-width: 720px)").matches
    ? isIOS
      ? 24
      : 30
    : 56;
  const petalStyles = [
    "petal--rose",
    "petal--blush",
    "petal--champagne",
  ];

  const animatePetalWithGsap = (petal) => {
    const loop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const startX = randomBetween(-0.08, 1.04) * width;
      const startY = randomBetween(-0.28, -0.08) * height;
      const swayOne = randomBetween(24, 96) * (Math.random() > 0.5 ? 1 : -1);
      const swayTwo = randomBetween(56, 168) * (Math.random() > 0.5 ? 1 : -1);
      const duration = randomBetween(11.5, 19.5);
      const startRotate = randomBetween(-80, 70);
      const scale = randomBetween(0.72, 1.28);
      const opacityPeak = randomBetween(0.5, 0.92);

      gsapLib.set(petal, {
        x: startX,
        y: startY,
        scale,
        rotation: startRotate,
        opacity: 0,
      });

      gsapLib
        .timeline({
          delay: randomBetween(0, 2.2),
          onComplete: loop,
        })
        .to(petal, {
          opacity: opacityPeak,
          duration: duration * 0.12,
          ease: "sine.out",
        })
        .to(
          petal,
          {
            x: startX + swayOne,
            y: height * 0.34,
            rotation: startRotate + randomBetween(80, 150),
            duration: duration * 0.3,
            ease: "sine.inOut",
          },
          "<"
        )
        .to(petal, {
          x: startX + swayTwo,
          y: height * 0.72,
          rotation: startRotate + randomBetween(210, 320),
          opacity: randomBetween(0.34, 0.82),
          duration: duration * 0.32,
          ease: "sine.inOut",
        })
        .to(petal, {
          x: startX + swayTwo + randomBetween(-96, 96),
          y: height + randomBetween(80, 180),
          rotation: startRotate + randomBetween(360, 520),
          opacity: 0,
          duration: duration * 0.26,
          ease: "none",
        });
    };

    loop();
  };

  for (let index = 0; index < petalCount; index += 1) {
    const petal = document.createElement("span");
    const size = randomBetween(0.72, 1.26);
    const depthClass = Math.random() > 0.58 ? " petal--near" : " petal--far";

    petal.className = `petal ${pick(petalStyles)}${depthClass}`;
    petal.style.width = `${0.9 * size}rem`;
    petal.style.height = `${1.42 * size}rem`;

    if (hasGsap) {
      animatePetalWithGsap(petal);
    } else {
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDelay = `${Math.random() * 10}s`;
      petal.style.animationDuration = `${7 + Math.random() * 15}s`;
    }

    petalsRoot.appendChild(petal);
  }
}

function createCardRain() {
  if (cardRainTargets.length === 0 || reducedMotion || isIOS) {
    return;
  }

  const mobile = window.matchMedia("(max-width: 720px)").matches;

  cardRainTargets.forEach((card) => {
    const rain = document.createElement("div");
    const count = card.classList.contains("signature-card")
      ? mobile
        ? 4
        : 8
      : mobile
        ? 2
        : 5;

    rain.className = "card-rain";
    card.appendChild(rain);

    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement("span");
      const left = Math.random() * 100;
      const duration = 5.8 + Math.random() * 4.8;
      const scale = 0.72 + Math.random() * 0.68;
      const drift = 10 + Math.random() * 18;

      petal.className = `card-rain-petal${index % 2 === 0 ? " is-alt" : ""}`;
      petal.style.left = `${left}%`;
      petal.style.animationDelay = `${Math.random() * 6}s`;
      petal.style.setProperty("--petal-duration", `${duration}s`);
      petal.style.setProperty("--petal-scale", `${scale}`);
      petal.style.setProperty("--petal-rotate", `${10 + Math.random() * 70}deg`);
      petal.style.setProperty(
        "--petal-drift",
        `${Math.random() > 0.5 ? drift : -drift}px`
      );
      rain.appendChild(petal);

      if (hasGsap) {
        const animateCardPetalWithGsap = () => {
          const bounds = rain.getBoundingClientRect();
          const startX = (left / 100) * Math.max(bounds.width, card.clientWidth, 1);
          const startY = -randomBetween(16, 56);
          const midpointX = startX + randomBetween(-24, 24);
          const endX = midpointX + randomBetween(-18, 18);
          const endY = Math.max(bounds.height, card.clientHeight, 1) + randomBetween(22, 50);
          const baseRotate = randomBetween(-40, 40);
          const opacityPeak = randomBetween(0.18, 0.42);
          const stepDuration = mobile ? randomBetween(5.6, 8.1) : randomBetween(6.2, 9.2);

          gsapLib.set(petal, {
            x: startX,
            y: startY,
            scale,
            rotation: baseRotate,
            opacity: 0,
            force3D: true,
          });

          gsapLib
            .timeline({
              delay: randomBetween(0, 3.2),
              onComplete: animateCardPetalWithGsap,
            })
            .to(petal, {
              opacity: opacityPeak,
              duration: stepDuration * 0.15,
              ease: "sine.out",
            })
            .to(
              petal,
              {
                x: midpointX,
                y: endY * 0.52,
                rotation: baseRotate + randomBetween(120, 190),
                duration: stepDuration * 0.48,
                ease: "sine.inOut",
              },
              "<"
            )
            .to(petal, {
              x: endX,
              y: endY,
              rotation: baseRotate + randomBetween(240, 340),
              opacity: 0,
              duration: stepDuration * 0.37,
              ease: "none",
            });
        };

        animateCardPetalWithGsap();
      }
    }

  });
}

function createSparkles() {
  if (!sparklesRoot || reducedMotion) {
    return;
  }

  const mobile = window.matchMedia("(max-width: 720px)").matches;
  const sparkleCount = mobile ? (isIOS ? 12 : 16) : 26;
  const extraHeartCount = mobile ? (isIOS ? 6 : 8) : 14;
  const sparkleTypes = [
    "sparkle--star",
    "sparkle--star",
    "sparkle--glow",
    "sparkle--glow",
    "sparkle--dust",
    "sparkle--dust",
    "sparkle--dust",
    "sparkle--heart",
    "sparkle--heart",
    "sparkle--heart",
  ];

  const animateSparkleWithGsap = (sparkle, type) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const originX = randomBetween(-0.04, 1.02) * width;
    const originY = randomBetween(-0.02, 1.04) * height;
    const driftRange =
      type === "sparkle--glow" ? 42 : type === "sparkle--heart" ? 20 : 28;
    const baseScale =
      type === "sparkle--glow"
        ? randomBetween(0.9, 1.5)
        : type === "sparkle--heart"
          ? randomBetween(0.82, 1.14)
          : randomBetween(0.8, 1.25);

    gsapLib.set(sparkle, {
      x: originX,
      y: originY,
      scale: baseScale,
      rotation: type === "sparkle--heart" ? randomBetween(-12, 12) : 0,
      opacity:
        type === "sparkle--glow"
          ? randomBetween(0.18, 0.42)
          : type === "sparkle--heart"
            ? randomBetween(0.48, 0.68)
            : randomBetween(0.3, 0.75),
    });

    gsapLib.to(sparkle, {
      x: originX + randomBetween(-driftRange, driftRange),
      y: originY + randomBetween(-driftRange, driftRange),
      duration: randomBetween(4.8, 8.8),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
    });

    if (type === "sparkle--heart") {
      gsapLib.to(sparkle, {
        rotation: () => randomBetween(-18, 18),
        duration: randomBetween(6.2, 9.4),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
      });
    }

    gsapLib.to(sparkle, {
      opacity:
        type === "sparkle--star"
          ? randomBetween(0.58, 1)
          : type === "sparkle--glow"
            ? randomBetween(0.22, 0.56)
            : type === "sparkle--heart"
              ? randomBetween(0.62, 0.88)
              : randomBetween(0.34, 0.84),
      scale:
        type === "sparkle--star"
          ? baseScale * randomBetween(1.08, 1.55)
          : type === "sparkle--heart"
            ? baseScale * randomBetween(1.06, 1.3)
          : baseScale * randomBetween(0.92, 1.2),
      duration: randomBetween(1.8, 4.6),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      delay: randomBetween(0, 1.8),
    });
  };

  for (let index = 0; index < sparkleCount; index += 1) {
    const sparkle = document.createElement("span");
    const type = pick(sparkleTypes);

    sparkle.className = `sparkle ${type}`;

    if (hasGsap) {
      animateSparkleWithGsap(sparkle, type);
    } else {
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.animationDelay = `${Math.random() * 4}s`;
      sparkle.style.animationDuration = `${2.5 + Math.random() * 3}s`;
    }

    sparklesRoot.appendChild(sparkle);
  }

  for (let index = 0; index < extraHeartCount; index += 1) {
    const heart = document.createElement("span");

    heart.className = "sparkle sparkle--heart";

    if (hasGsap) {
      animateSparkleWithGsap(heart, "sparkle--heart");
    } else {
      heart.style.top = `${Math.random() * 100}%`;
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.animationDelay = `${Math.random() * 4}s`;
      heart.style.animationDuration = `${2.8 + Math.random() * 3.4}s`;
    }

    (petalsRoot || sparklesRoot).appendChild(heart);
  }
}

function setupParticleParallax() {
  if (!hasGsap || reducedMotion || !petalsRoot || !sparklesRoot) {
    return;
  }

  gsapLib.to(petalsRoot, {
    yPercent: 10,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1,
    },
  });

  gsapLib.to(sparklesRoot, {
    yPercent: -8,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.9,
    },
  });
}

function setupCardTilt() {
  if (!tiltCard || reducedMotion || !prefersFinePointer) {
    return;
  }

  tiltCard.addEventListener("pointermove", (event) => {
    const bounds = tiltCard.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const rotateY = ((event.clientX - centerX) / bounds.width) * 8;
    const rotateX = ((centerY - event.clientY) / bounds.height) * 8;

    tiltCard.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    tiltCard.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
  });

  tiltCard.addEventListener("pointerleave", () => {
    tiltCard.style.setProperty("--tilt-x", "0deg");
    tiltCard.style.setProperty("--tilt-y", "0deg");
  });
}

function createFloatTween(target, vars) {
  if (!target || isIOS) {
    return null;
  }

  return gsapLib.to(target, {
    x: vars.x ?? 0,
    y: vars.y,
    rotation: vars.rotation ?? 0,
    scale: vars.scale ?? 1,
    opacity: vars.opacity,
    duration: vars.duration ?? 8.6,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: true,
    transformOrigin: "50% 50%",
    force3D: vars.force3D ?? false,
    autoRound: true,
    overwrite: "auto",
  });
}

function createGlowTween(target, vars = {}) {
  if (!target || isIOS) {
    return null;
  }

  return gsapLib.to(target, {
    xPercent: vars.xPercent ?? 14,
    yPercent: vars.yPercent ?? -10,
    rotation: vars.rotation ?? 0,
    scale: vars.scale ?? 1.08,
    opacity: vars.opacity ?? 0.34,
    duration: vars.duration ?? 10.8,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    paused: true,
    transformOrigin: "50% 50%",
    force3D: false,
    autoRound: true,
    repeatRefresh: true,
  });
}

function createSweepTween(target, vars = {}) {
  if (!target || isIOS) {
    return null;
  }

  const duration = vars.duration ?? 2.8;
  const fadeIn = vars.fadeIn ?? 0.42;
  const fadeOut = vars.fadeOut ?? 0.52;
  const overlap = Math.min(duration * 0.24, 0.7);

  gsapLib.set(target, {
    xPercent: -168,
    yPercent: vars.yPercent ?? 0,
    rotation: vars.rotation ?? 14,
    opacity: 0,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  const timeline = gsapLib.timeline({
    paused: true,
    repeat: -1,
    repeatDelay: vars.repeatDelay ?? 6.2,
  });

  timeline.to(target, {
    opacity: vars.opacity ?? 0.7,
    duration: fadeIn,
    ease: "sine.out",
  });

  timeline.to(
    target,
    {
      xPercent: vars.xPercent ?? 176,
      opacity: vars.opacity ?? 0.7,
      duration,
      ease: "power1.inOut",
    },
    0
  );

  timeline.to(
    target,
    {
      opacity: 0,
      duration: fadeOut,
      ease: "sine.in",
    },
    duration - overlap
  );

  return timeline;
}

function setupBackgroundBreathing(mobile) {
  if (!hasGsap || reducedMotion || isIOS) {
    return [];
  }

  const loops = [];
  const videoOverlay = document.querySelector(".bg-video-overlay");

  if (bgVideo) {
    loops.push(
      gsapLib.to(bgVideo, {
        scale: mobile ? 1.1 : 1.12,
        duration: mobile ? 12.6 : 14.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
        transformOrigin: "50% 50%",
        overwrite: "auto",
      })
    );
  }

  if (videoOverlay) {
    loops.push(
      gsapLib.to(videoOverlay, {
        opacity: mobile ? 0.92 : 0.84,
        duration: mobile ? 8.4 : 10.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
        overwrite: "auto",
      })
    );
  }

  loops.push(
    createGlowTween(document.querySelector(".blob-left"), {
      xPercent: mobile ? -6 : -10,
      yPercent: mobile ? 4 : 6,
      scale: mobile ? 1.04 : 1.08,
      opacity: mobile ? 0.22 : 0.28,
      duration: mobile ? 11.8 : 14.2,
    })
  );

  loops.push(
    createGlowTween(document.querySelector(".blob-right"), {
      xPercent: mobile ? 6 : 10,
      yPercent: mobile ? -4 : -6,
      scale: mobile ? 1.03 : 1.06,
      opacity: mobile ? 0.2 : 0.26,
      duration: mobile ? 12.4 : 15.2,
    })
  );

  return loops.filter(Boolean);
}

function setupHeroParallax(mobile) {
  if (!hasGsap || reducedMotion) {
    return;
  }

  const heroSection = document.querySelector("#top");
  const videoOverlay = document.querySelector(".bg-video-overlay");
  const heroContent = document.querySelector(".signature-card__content");
  const portrait = document.querySelector(".signature-portrait");
  const memory = document.querySelector(".signature-memory");
  const shine = document.querySelector(".signature-card__shine");

  if (!heroSection) {
    return;
  }

  const baseScrollTrigger = {
    trigger: heroSection,
    start: "top top",
    end: "bottom top",
    scrub: mobile ? 1.15 : 1.45,
  };

  if (bgVideo) {
    gsapLib.to(bgVideo, {
      yPercent: mobile ? 4 : 7,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }

  if (videoOverlay) {
    gsapLib.to(videoOverlay, {
      yPercent: mobile ? -2 : -4,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }

  if (heroContent && !isIOS) {
    gsapLib.to(heroContent, {
      yPercent: mobile ? -2 : -5,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }

  if (portrait) {
    gsapLib.to(portrait, {
      yPercent: mobile ? -7 : -11,
      xPercent: mobile ? -1 : -2,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }

  if (memory) {
    gsapLib.to(memory, {
      yPercent: mobile ? 5 : 8,
      xPercent: mobile ? 2 : 4,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }

  if (shine && !isIOS) {
    gsapLib.to(shine, {
      xPercent: mobile ? 10 : 16,
      yPercent: mobile ? -3 : -6,
      ease: "none",
      scrollTrigger: { ...baseScrollTrigger },
    });
  }
}

function setupPhotoScrollMotion(mobile) {
  if (!hasGsap || reducedMotion) {
    return;
  }

  const photoTargets = gsapLib.utils.toArray(
    ".signature-portrait img, .signature-memory img, .gallery-side-shot img, .gallery-feature-frame img"
  );

  photoTargets.forEach((photo, index) => {
    const figure = photo.closest("figure");
    const isHeroPhoto = figure && figure.closest("#top");
    const startY = isHeroPhoto
      ? index % 2 === 0
        ? 8
        : -8
      : index % 2 === 0
        ? 10
        : -10;
    const scrubY = isHeroPhoto
      ? index % 2 === 0
        ? -4
        : 4
      : index % 2 === 0
        ? -5
        : 5;

    gsapLib.fromTo(
      photo,
      {
        scale: mobile ? 1.12 : 1.16,
        yPercent: startY,
        transformOrigin: "50% 50%",
      },
      {
        scale: 1,
        yPercent: 0,
        duration: mobile ? 1.3 : 1.48,
        ease: "power2.out",
        scrollTrigger: {
          trigger: figure || photo,
          start: mobile ? "top 96%" : "top 92%",
          once: true,
        },
      }
    );

    gsapLib.to(photo, {
      yPercent: scrubY,
      scale: mobile ? 1.03 : 1.05,
      ease: "none",
      scrollTrigger: {
        trigger: figure || photo,
        start: "top bottom",
        end: "bottom top",
        scrub: mobile ? 1.05 : 1.25,
      },
    });
  });
}

function setupGalleryDepthMotion(mobile) {
  if (!hasGsap || reducedMotion) {
    return;
  }

  const galleryCard = document.querySelector(".gallery-card-story");
  const mainNote = galleryCard?.querySelector(".gallery-note-card--main");
  const closingNote = galleryCard?.querySelector(".gallery-note-card--closing");
  const featureFrame = galleryCard?.querySelector(".gallery-feature-frame");
  const topLeft = galleryCard?.querySelector(".gallery-band--top .gallery-side-shot--left");
  const topRight = galleryCard?.querySelector(".gallery-band--top .gallery-side-shot--right");
  const bottomLeft = galleryCard?.querySelector(".gallery-band--bottom .gallery-side-shot--left");
  const bottomRight = galleryCard?.querySelector(".gallery-band--bottom .gallery-side-shot--right");

  if (!galleryCard) {
    return;
  }

  const baseTrigger = {
    trigger: galleryCard,
    start: "top bottom",
    end: "bottom top",
    scrub: mobile ? 1.05 : 1.2,
  };

  if (mainNote && !isIOS) {
    gsapLib.to(mainNote, {
      yPercent: mobile ? -2 : -4,
      rotation: mobile ? -0.35 : -0.8,
      ease: "none",
      scrollTrigger: { ...baseTrigger },
    });
  }

  if (closingNote && !isIOS) {
    gsapLib.to(closingNote, {
      yPercent: mobile ? 2 : 4,
      rotation: mobile ? 0.35 : 0.75,
      ease: "none",
      scrollTrigger: { ...baseTrigger },
    });
  }

  if (featureFrame) {
    gsapLib.to(featureFrame, {
      yPercent: mobile ? -3 : -6,
      rotation: mobile ? -0.5 : -1.1,
      ease: "none",
      scrollTrigger: { ...baseTrigger },
    });
  }

  [
    [topLeft, mobile ? -2 : -4, mobile ? -2 : -4],
    [topRight, mobile ? -2 : -4, mobile ? 2 : 4],
    [bottomLeft, mobile ? 2 : 4, mobile ? -2 : -3],
    [bottomRight, mobile ? 2 : 4, mobile ? 2 : 3],
  ].forEach(([target, yPercent, xPercent]) => {
    if (!target) {
      return;
    }

    gsapLib.to(target, {
      yPercent,
      xPercent,
      ease: "none",
      scrollTrigger: { ...baseTrigger },
    });
  });
}

function setupTouchBlooms() {
  if (!hasGsap || reducedMotion) {
    return;
  }

  const touchTargets = document.querySelectorAll(
    ".signature-portrait, .signature-memory, .quote-card, .gallery-side-shot, .gallery-feature-frame, .gallery-note-card, .letter, .promise-card"
  );

  touchTargets.forEach((target) => {
    if (target.dataset.tapBloomBound === "true") {
      return;
    }

    target.dataset.tapBloomBound = "true";
    target.addEventListener(
      "pointerdown",
      (event) => {
        const bounds = target.getBoundingClientRect();
        const bloom = document.createElement("span");

        bloom.className = "tap-bloom";
        bloom.style.left = `${event.clientX - bounds.left}px`;
        bloom.style.top = `${event.clientY - bounds.top}px`;
        target.appendChild(bloom);

        gsapLib
          .timeline({
            onComplete: () => bloom.remove(),
          })
          .fromTo(
            bloom,
            {
              autoAlpha: 0,
              scale: 0.2,
            },
            {
              autoAlpha: 0.82,
              scale: 0.92,
              duration: 0.26,
              ease: "power2.out",
            }
          )
          .to(
            bloom,
            {
              autoAlpha: 0,
              scale: 1.36,
              duration: 0.56,
              ease: "power2.out",
            },
            0.12
          );
      },
      { passive: true }
    );
  });
}

function setupVisualizerAnimations() {
  if (!hasGsap || reducedMotion || visualizerBars.length === 0) {
    return;
  }

  visualizerTweens.forEach((tween) => tween.kill());
  visualizerTweens = Array.from(visualizerBars).map((bar, index) => {
    gsapLib.set(bar, {
      transformOrigin: "50% 100%",
      scaleY: randomBetween(0.5, 0.88),
      force3D: true,
    });

    return gsapLib.to(bar, {
      scaleY: () => randomBetween(0.52, 1.42),
      duration: () => randomBetween(0.84, 1.68),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      paused: true,
      delay: index * 0.05,
      force3D: true,
    });
  });

  updateMusicButtons(Boolean(bgMusic && !bgMusic.paused));
}

function createScrollTimeline(target, buildTimeline, options = {}) {
  if (!target) {
    return null;
  }

  const timeline = gsapLib.timeline({
    paused: true,
    defaults: { ease: "power3.out", immediateRender: false },
    onComplete: () => {
      (options.loops || []).filter(Boolean).forEach((tween) => tween.play());
    },
  });

  buildTimeline(timeline);

  const trigger = scrollTriggerLib.create({
    trigger: target,
    start: options.start,
    once: true,
    onEnter: () => timeline.play(0),
  });

  const initialThreshold = options.initialThreshold ?? 0.96;
  const targetTop = target.getBoundingClientRect().top;

  if (targetTop <= window.innerHeight * initialThreshold) {
    timeline.play(0);
    trigger.kill();
  }

  return timeline;
}

function setupGsapAnimations() {
  if (!hasGsap) {
    setupFallbackReveals();
    return;
  }

  document.body.classList.add("use-gsap");
  gsapLib.registerPlugin(scrollTriggerLib);

  gsapLib.matchMedia().add(
    {
      reduceMotion: "(prefers-reduced-motion: reduce)",
      mobile: "(max-width: 720px)",
      desktop: "(min-width: 721px)",
    },
    (context) => {
      const { reduceMotion: mediaReducedMotion, mobile } = context.conditions;
      const revealStart = mobile ? "top 92%" : "top 84%";
      const enterDistance = mobile ? 24 : 36;

      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      gsapLib.set(".reveal", { autoAlpha: 1, y: 0, scale: 1, clearProps: "transition" });
      gsapLib.set(
        [
          ".signature-portrait",
          ".signature-memory",
          ".signature-card__content > *",
          ".letter__body > *",
          ".floating-note",
          ".quote-mark",
          ".gallery-side-shot",
          ".gallery-feature-frame",
          ".gallery-note-card",
          ".intro-card",
          ".motion-glow",
        ],
        { autoAlpha: 1 }
      );

      if (isIOS) {
        gsapLib.set(
          [
            ".intro-card .eyebrow",
            ".intro-card h1",
            ".intro-copy",
            ".intro-button",
            ".chip",
            ".gallery-copy",
            ".gallery-whisper",
            ".gallery-note-copy",
            ".gallery-whisper--small",
          ],
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            clearProps: "opacity,visibility,transform",
          }
        );
      }

      if (mediaReducedMotion && !isIOS) {
        playHeroScene = () => {};
        if (intro && introDismissed) {
          hideIntroImmediately();
        }
        return () => {};
      }

      setupHeroParallax(mobile);
      setupPhotoScrollMotion(mobile);
      setupGalleryDepthMotion(mobile);
      const backgroundLoops = setupBackgroundBreathing(mobile);

      gsapLib.set(
        ".letter__body > *:not(.letter-signature)",
        isIOS
          ? {
              autoAlpha: 0,
              y: 18,
            }
          : {
              autoAlpha: 0,
              y: 18,
              clipPath: "inset(0 0 100% 0)",
              filter: "blur(8px)",
            }
      );
      gsapLib.set(".letter-signature", {
        autoAlpha: 0,
        y: 12,
        scale: 0.96,
        filter: isIOS ? "blur(0px)" : "blur(4px)",
      });

      const introTimeline = intro
        ? gsapLib.timeline({
            defaults: { ease: "power3.out" },
          })
        : null;

      if (introTimeline) {
        introTimeline
          .from(".intro-card .motion-glow", {
            autoAlpha: 0,
            scale: 0.84,
            duration: 1.45,
            ease: "sine.out",
          })
          .from(".intro-card", {
            autoAlpha: 0,
            y: 20,
            scale: 0.975,
            duration: 1.5,
            ease: "power2.out",
          }, 0.08);

        if (!isIOS) {
          introTimeline
            .from(".intro-card .eyebrow", {
              autoAlpha: 0,
              y: -8,
              duration: 0.74,
              ease: "sine.out",
            }, 0.24)
            .from(".intro-card h1", {
              autoAlpha: 0,
              y: 14,
              scale: 0.97,
              duration: 0.96,
              ease: "power2.out",
            }, 0.34)
            .from(".intro-copy", {
              autoAlpha: 0,
              y: 14,
              duration: 0.88,
              ease: "power2.out",
            }, 0.48)
            .from(".intro-button", {
              autoAlpha: 0,
              y: 12,
              scale: 0.96,
              duration: 0.82,
              ease: "power2.out",
            }, 0.62);
        }
      }

      const heroAmbientTweens = [
        ...backgroundLoops,
        createFloatTween(document.querySelector(".signature-portrait"), {
          y: mobile ? -5 : -8,
          rotation: mobile ? -0.32 : 0.52,
          duration: mobile ? 10.8 : 12.4,
        }),
        createFloatTween(document.querySelector(".signature-memory"), {
          y: mobile ? -4 : -7,
          rotation: mobile ? 7.2 : 9.6,
          duration: mobile ? 9.8 : 11.2,
        }),
        createFloatTween(document.querySelector(".signature-card__shine"), {
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 12.8,
        }),
        createGlowTween(document.querySelector("#top > .motion-glow"), {
          xPercent: mobile ? -8 : -12,
          yPercent: mobile ? 8 : 6,
          scale: mobile ? 1.08 : 1.14,
          opacity: mobile ? 0.22 : 0.28,
          duration: mobile ? 12.6 : 14.4,
        }),
        createSweepTween(document.querySelector("#top > .light-sweep"), {
          duration: mobile ? 2.5 : 2.9,
          repeatDelay: mobile ? 5.8 : 6.8,
          opacity: mobile ? 0.56 : 0.68,
        }),
      ].filter(Boolean);

      const shineTween = heroAmbientTweens[2];

      if (shineTween) {
        shineTween.kill();
        heroAmbientTweens[2] = gsapLib.to(".signature-card__shine", {
          xPercent: 12,
          yPercent: -2,
          opacity: 0.58,
          duration: 14.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });
      }

      const heroTimeline = gsapLib.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });

      heroTimeline
        .from("#top", {
          autoAlpha: 0,
          y: enterDistance,
          scale: 0.985,
          duration: 1.55,
          ease: "power2.out",
        })
        .from(
          "#top > .light-sweep",
          {
            autoAlpha: 0,
            duration: 0.84,
            ease: "sine.out",
          },
          0.04
        )
        .from(
          ".signature-card__shine",
          {
            autoAlpha: 0,
            xPercent: -10,
            duration: 1.4,
            ease: "sine.out",
          },
          0.08
        )
        .from(
          ".signature-portrait",
          {
            autoAlpha: 0,
            x: mobile ? 0 : -18,
            y: 16,
            rotate: -3,
            scale: 0.96,
            duration: 1.22,
            ease: "power2.out",
          },
          0.18
        )
        .from(
          ".signature-memory",
          {
            autoAlpha: 0,
            x: mobile ? 10 : 18,
            y: 14,
            rotate: 8,
            scale: 0.95,
            duration: 1.04,
            ease: "power2.out",
          },
          0.36
        )
        .from(
          ".signature-card__content > *:not(.chip-row):not(.signature-line)",
          {
            autoAlpha: 0,
            y: 12,
            stagger: 0.14,
            duration: 0.92,
            ease: "power2.out",
          },
          0.34
        );

      if (!isIOS) {
        heroTimeline.from(
          ".chip",
          {
            autoAlpha: 0,
            y: 10,
            scale: 0.96,
            stagger: 0.1,
            duration: 0.78,
            ease: "power2.out",
          },
          0.9
        );
      }

      heroTimeline.from(
          ".signature-line",
          {
            autoAlpha: 0,
            y: 10,
            scale: 0.98,
            duration: 0.84,
            ease: "power2.out",
          },
          1.08
        );

      playHeroScene = () => {
        heroTimeline.restart();
        heroAmbientTweens.forEach((tween) => tween.play());
      };

      if (introDismissed) {
        heroTimeline.progress(1);
        heroAmbientTweens.forEach((tween) => tween.play());
      }

      const quoteCard = document.querySelector(".quote-card");
      const musicCard = document.querySelector(".music-card");
      const galleryCard = document.querySelector(".gallery-card-story");
      const letterShell = document.querySelector(".letter-shell");
      const promiseSection = document.querySelector(".promise-strip");
      const footer = document.querySelector(".footer");

      const quoteLoops = [
        createGlowTween(quoteCard?.querySelector(".motion-glow"), {
          xPercent: mobile ? 8 : 10,
          yPercent: mobile ? -8 : -6,
          scale: mobile ? 1.02 : 1.05,
          opacity: mobile ? 0.18 : 0.24,
          duration: mobile ? 11.2 : 13.2,
        }),
        createSweepTween(quoteCard?.querySelector(".light-sweep"), {
          duration: mobile ? 2.4 : 2.7,
          repeatDelay: mobile ? 5.6 : 6.6,
          opacity: mobile ? 0.5 : 0.62,
        }),
      ].filter(Boolean);

      createScrollTimeline(
        quoteCard,
        (timeline) => {
          const q = gsapLib.utils.selector(quoteCard);
          timeline
            .from(q(".motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 1,
              ease: "sine.out",
            }, 0.04)
            .from(quoteCard, {
              autoAlpha: 0,
              y: enterDistance,
              scale: 0.985,
              duration: 1.28,
              ease: "power2.out",
            })
            .from(q(".eyebrow"), { autoAlpha: 0, x: -10, duration: 0.72, ease: "sine.out" }, 0.18)
            .from(q("h2"), { autoAlpha: 0, y: 12, scale: 0.985, duration: 0.92, ease: "power2.out" }, 0.32)
            .from(
              q(".quote-copy, .card-note"),
              { autoAlpha: 0, y: 10, stagger: 0.16, duration: 0.84, ease: "power2.out" },
              0.48
            );
        },
        { start: revealStart, loops: quoteLoops }
      );

      const musicLoops = [
        createGlowTween(musicCard?.querySelector(".motion-glow"), {
          xPercent: mobile ? -10 : -12,
          yPercent: mobile ? 8 : 10,
          scale: mobile ? 1.04 : 1.08,
          opacity: mobile ? 0.18 : 0.24,
          duration: mobile ? 11.4 : 13.4,
        }),
        createSweepTween(musicCard?.querySelector(".light-sweep"), {
          duration: mobile ? 2.35 : 2.6,
          repeatDelay: mobile ? 5.8 : 6.8,
          opacity: mobile ? 0.48 : 0.58,
        }),
      ].filter(Boolean);

      createScrollTimeline(
        musicCard,
        (timeline) => {
          const q = gsapLib.utils.selector(musicCard);
          timeline
            .from(q(".motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.94,
              ease: "sine.out",
            }, 0.04)
            .from(musicCard, {
              autoAlpha: 0,
              y: enterDistance,
              scale: 0.985,
              duration: 1.26,
              ease: "power2.out",
            })
            .from(q(".music-card__head h3"), {
              autoAlpha: 0,
              x: -10,
              duration: 0.84,
              ease: "power2.out",
            }, 0.24)
            .from(q(".visualizer span"), {
              autoAlpha: 0,
              scaleY: 0.4,
              stagger: 0.06,
              duration: 0.44,
              transformOrigin: "50% 100%",
              ease: "sine.out",
            }, 0.34)
            .from(q(".music-copy"), { autoAlpha: 0, y: 10, duration: 0.84, ease: "power2.out" }, 0.48);
        },
        { start: revealStart, loops: musicLoops }
      );

      const galleryLoops = [
        createFloatTween(galleryCard?.querySelector(".gallery-feature-frame"), {
          y: mobile ? -4 : -7,
          rotation: mobile ? 0.2 : -0.24,
          scale: mobile ? 1.01 : 1.018,
          duration: mobile ? 10.6 : 12.4,
        }),
        createFloatTween(galleryCard?.querySelector(".gallery-band--top .gallery-side-shot--left"), {
          y: mobile ? -5 : -8,
          rotation: mobile ? -5.2 : -7.4,
          duration: mobile ? 10.2 : 11.8,
        }),
        createFloatTween(galleryCard?.querySelector(".gallery-band--top .gallery-side-shot--right"), {
          y: mobile ? -5 : -8,
          rotation: mobile ? 5.2 : 7.4,
          duration: mobile ? 10.8 : 12.2,
        }),
        createFloatTween(galleryCard?.querySelector(".gallery-band--bottom .gallery-side-shot--left"), {
          y: mobile ? -4 : -7,
          rotation: mobile ? -4.2 : -6,
          duration: mobile ? 10.4 : 12,
        }),
        createFloatTween(galleryCard?.querySelector(".gallery-band--bottom .gallery-side-shot--right"), {
          y: mobile ? -4 : -7,
          rotation: mobile ? 4.2 : 6,
          duration: mobile ? 10.9 : 12.4,
        }),
        createGlowTween(galleryCard?.querySelector(".gallery-note-card--main .motion-glow"), {
          xPercent: mobile ? -8 : -10,
          yPercent: mobile ? 6 : 8,
          scale: mobile ? 1.03 : 1.06,
          opacity: mobile ? 0.16 : 0.22,
          duration: mobile ? 11.2 : 13.2,
        }),
        createGlowTween(galleryCard?.querySelector(".gallery-feature-frame .motion-glow"), {
          xPercent: mobile ? 6 : 10,
          yPercent: mobile ? -8 : -10,
          scale: mobile ? 1.04 : 1.08,
          opacity: mobile ? 0.16 : 0.24,
          duration: mobile ? 11.4 : 13.6,
        }),
        createGlowTween(galleryCard?.querySelector(".gallery-note-card--closing .motion-glow"), {
          xPercent: mobile ? 8 : 10,
          yPercent: mobile ? -6 : -8,
          scale: mobile ? 1.03 : 1.06,
          opacity: mobile ? 0.16 : 0.22,
          duration: mobile ? 11.6 : 13.8,
        }),
        createSweepTween(galleryCard?.querySelector(".gallery-note-card--main .light-sweep"), {
          duration: mobile ? 2.5 : 2.9,
          repeatDelay: mobile ? 5.6 : 6.8,
          opacity: mobile ? 0.46 : 0.56,
        }),
        createSweepTween(galleryCard?.querySelector(".gallery-feature-frame .light-sweep"), {
          duration: mobile ? 2.35 : 2.7,
          repeatDelay: mobile ? 5.4 : 6.2,
          opacity: mobile ? 0.48 : 0.58,
        }),
        createSweepTween(galleryCard?.querySelector(".gallery-note-card--closing .light-sweep"), {
          duration: mobile ? 2.45 : 2.85,
          repeatDelay: mobile ? 5.9 : 6.9,
          opacity: mobile ? 0.46 : 0.56,
        }),
      ].filter(Boolean);

      createScrollTimeline(
        galleryCard,
        (timeline) => {
          const q = gsapLib.utils.selector(galleryCard);
          timeline
            .from(galleryCard, {
              autoAlpha: 0,
              y: enterDistance,
              scale: 0.985,
              duration: 1.34,
              ease: "power2.out",
            })
            .from(q(".gallery-note-card--main .motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.92,
              ease: "sine.out",
            }, 0.08)
            .from(q(".gallery-note-card--main"), {
              autoAlpha: 0,
              y: 18,
              scale: 0.96,
              rotate: -2.8,
              duration: 1.04,
              ease: "power2.out",
            }, 0.22)
            .from(q(".gallery-note-card--main .light-sweep"), {
              autoAlpha: 0,
              duration: 0.76,
              ease: "sine.out",
            }, 0.24)
            .from(q(".gallery-band--top .gallery-side-shot--left"), {
              autoAlpha: 0,
              x: -26,
              y: 14,
              scale: 0.88,
              rotate: -12,
              duration: 1.02,
              ease: "power2.out",
            }, 0.32)
            .from(q(".gallery-band--top .gallery-side-shot--right"), {
              autoAlpha: 0,
              x: 26,
              y: 14,
              scale: 0.88,
              rotate: 12,
              duration: 1.02,
              ease: "power2.out",
            }, 0.36)
            .from(q(".gallery-feature-frame .motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.9,
              ease: "sine.out",
            }, 0.56)
            .from(q(".gallery-feature-frame"), {
              autoAlpha: 0,
              y: 22,
              scale: 0.92,
              rotate: -3.6,
              duration: 1.14,
              ease: "power2.out",
            }, 0.64)
            .from(q(".gallery-feature-frame .light-sweep"), {
              autoAlpha: 0,
              duration: 0.74,
              ease: "sine.out",
            }, 0.72)
            .from(q(".gallery-feature-frame figcaption"), {
              autoAlpha: 0,
              y: 10,
              duration: 0.74,
              ease: "power2.out",
            }, 0.82)
            .from(q(".gallery-note-card--closing .motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.9,
              ease: "sine.out",
            }, 0.86)
            .from(q(".gallery-note-card--closing"), {
              autoAlpha: 0,
              y: 18,
              scale: 0.96,
              rotate: 2.6,
              duration: 1.04,
              ease: "power2.out",
            }, 0.94)
            .from(q(".gallery-note-card--closing .light-sweep"), {
              autoAlpha: 0,
              duration: 0.74,
              ease: "sine.out",
            }, 0.98)
            .from(q(".gallery-band--bottom .gallery-side-shot--left"), {
              autoAlpha: 0,
              x: -24,
              y: 14,
              scale: 0.9,
              rotate: -10,
              duration: 0.98,
              ease: "power2.out",
            }, 1.04)
            .from(q(".gallery-band--bottom .gallery-side-shot--right"), {
              autoAlpha: 0,
              x: 24,
              y: 14,
              scale: 0.9,
              rotate: 10,
              duration: 0.98,
              ease: "power2.out",
            }, 1.18);

          if (!isIOS) {
            timeline
              .from(q(".gallery-copy, .gallery-band--top .gallery-whisper"), {
                autoAlpha: 0,
                y: 10,
                stagger: 0.14,
                duration: 0.82,
                ease: "power2.out",
              }, 0.5)
              .from(q(".gallery-note-copy, .gallery-whisper--small"), {
                autoAlpha: 0,
                y: 10,
                stagger: 0.14,
                duration: 0.82,
                ease: "power2.out",
              }, 1.18);
          }
        },
        { start: mobile ? "top 94%" : "top 82%", loops: galleryLoops }
      );

      const letterLoops = [
        createGlowTween(letterShell?.querySelector(".letter .motion-glow"), {
          xPercent: mobile ? -8 : -10,
          yPercent: mobile ? 6 : 8,
          scale: mobile ? 1.03 : 1.08,
          opacity: mobile ? 0.18 : 0.24,
          duration: mobile ? 11.8 : 13.8,
        }),
        createSweepTween(letterShell?.querySelector(".letter .light-sweep"), {
          duration: mobile ? 2.6 : 2.9,
          repeatDelay: mobile ? 5.8 : 6.8,
          opacity: mobile ? 0.52 : 0.64,
        }),
      ].filter(Boolean);

      createScrollTimeline(
        letterShell,
        (timeline) => {
          const q = gsapLib.utils.selector(letterShell);
          timeline
            .from(letterShell, {
              autoAlpha: 0,
              y: enterDistance,
              scale: 0.985,
              duration: 1.34,
              ease: "power2.out",
            })
            .from(q(".letter-header > div > *"), {
              autoAlpha: 0,
              y: 10,
              stagger: 0.14,
              duration: 0.84,
              ease: "power2.out",
            }, 0.24)
            .from(q(".letter .motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.92,
              ease: "sine.out",
            }, 0.3)
            .from(q(".letter .light-sweep"), {
              autoAlpha: 0,
              duration: 0.8,
              ease: "sine.out",
            }, 0.34)
            .from(q(".letter"), {
              autoAlpha: 0,
              y: 12,
              scale: 0.99,
              duration: 0.92,
              ease: "power2.out",
            }, 0.4);
        },
        { start: revealStart, loops: letterLoops }
      );

      const letterBody = letterShell?.querySelector(".letter");

      createScrollTimeline(
        letterBody,
        (timeline) => {
          const q = gsapLib.utils.selector(letterBody);
          const letterLines = q(".letter__body > *:not(.letter-signature)");

          timeline
            .to(letterLines, {
              autoAlpha: 1,
              y: 0,
              ...(isIOS ? {} : { clipPath: "inset(0 0 0% 0)", filter: "blur(0px)" }),
              stagger: 0.34,
              duration: 1.08,
              ease: "power2.out",
            })
            .to(q(".letter-signature"), {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              ...(isIOS ? {} : { filter: "blur(0px)" }),
              duration: 0.94,
              ease: "power2.out",
            }, ">-0.08");
        },
        { start: mobile ? "top 78%" : "top 72%", loops: [] }
      );

      const promiseCard = promiseSection?.querySelector(".promise-card");
      const promiseLoops = [
        createGlowTween(promiseCard?.querySelector(".motion-glow"), {
          xPercent: mobile ? -8 : -10,
          yPercent: mobile ? 8 : 10,
          scale: mobile ? 1.04 : 1.08,
          opacity: mobile ? 0.18 : 0.24,
          duration: mobile ? 12 : 14.2,
        }),
        createSweepTween(promiseCard?.querySelector(".light-sweep"), {
          duration: mobile ? 2.5 : 2.8,
          repeatDelay: mobile ? 5.9 : 6.9,
          opacity: mobile ? 0.5 : 0.6,
        }),
      ].filter(Boolean);

      createScrollTimeline(
        promiseSection,
        (timeline) => {
          const q = gsapLib.utils.selector(promiseSection);
          timeline
            .from(promiseSection, {
              autoAlpha: 0,
              y: enterDistance,
              duration: 1.18,
              ease: "power2.out",
            })
            .from(q(".motion-glow"), {
              autoAlpha: 0,
              scale: 0.84,
              duration: 0.92,
              ease: "sine.out",
            }, 0.08)
            .from(q(".promise-card"), {
              autoAlpha: 0,
              y: 12,
              scale: 0.99,
              duration: 0.94,
              ease: "power2.out",
            }, 0.22)
            .from(q(".promise-card > *:not(.card-rain):not(.motion-glow)"), {
              autoAlpha: 0,
              y: 8,
              stagger: 0.14,
              duration: 0.82,
              ease: "power2.out",
            }, 0.42);
        },
        { start: revealStart, loops: promiseLoops }
      );

      const footerLoops = [
        createGlowTween(footer?.querySelector(".motion-glow"), {
          xPercent: 0,
          yPercent: mobile ? -8 : -10,
          scale: mobile ? 1.08 : 1.14,
          opacity: mobile ? 0.2 : 0.28,
          duration: mobile ? 8.2 : 9.4,
        }),
        createSweepTween(footer?.querySelector(".light-sweep"), {
          duration: mobile ? 2.6 : 3,
          repeatDelay: mobile ? 6.8 : 7.8,
          opacity: mobile ? 0.46 : 0.56,
        }),
        footer?.querySelector("p")
          ? gsapLib.to(footer.querySelector("p"), {
              y: mobile ? -1.5 : -2.5,
              duration: mobile ? 4.8 : 5.6,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            })
          : null,
      ].filter(Boolean);

      createScrollTimeline(
        footer,
        (timeline) => {
          const q = gsapLib.utils.selector(footer);
          timeline
            .from(footer, {
              autoAlpha: 0,
              y: mobile ? 16 : 20,
              duration: 0.92,
              ease: "power2.out",
            })
            .from(q(".motion-glow"), {
              autoAlpha: 0,
              scale: 0.82,
              duration: 0.9,
              ease: "sine.out",
            }, 0.06)
            .from(q(".light-sweep"), {
              autoAlpha: 0,
              duration: 0.84,
              ease: "sine.out",
            }, 0.12)
            .from(q("p"), {
              autoAlpha: 0,
              y: mobile ? 14 : 18,
              scale: 0.96,
              filter: "blur(8px)",
              duration: 1.06,
              ease: "power2.out",
            }, 0.18);
        },
        { start: revealStart, loops: footerLoops }
      );

      scrollTriggerLib.refresh();

      return () => {
        playHeroScene = () => {};
      };
    }
  );
}

function initializeExperienceCore() {
  if (experienceReady) {
    return;
  }

  createMotionGlows();
  createLightSweeps();
  setupCardTilt();
  setupVisualizerAnimations();
  setupTouchBlooms();
  setupGsapAnimations();
  experienceReady = true;
}

function initializeParticleEffects() {
  if (particleEffectsReady) {
    return;
  }

  createBackgroundPetals();
  createCardRain();
  createSparkles();
  setupParticleParallax();
  particleEffectsReady = true;
}

function bootExperience(deferParticles = true) {
  initializeExperienceCore();

  if (deferParticles) {
    scheduleDeferredWork(initializeParticleEffects);
    return;
  }

  initializeParticleEffects();
}

if (startButton) {
  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    const musicPromise = playMusic();

    await closeIntro();
    bootExperience(true);

    window.requestAnimationFrame(() => {
      playHeroScene();
    });

    await musicPromise;
  });
}

if (bgVideo) {
  bgVideo.addEventListener("loadedmetadata", () => {
    bgVideo.defaultPlaybackRate = 0.56;
    bgVideo.playbackRate = 0.56;
  });
}

if (bgMusic) {
  bgMusic.volume = MUSIC_VOLUME;

  bgMusic.addEventListener("pause", () => {
    updateMusicButtons(false);
  });

  bgMusic.addEventListener("play", () => {
    updateMusicButtons(true);
  });

  bgMusic.addEventListener("loadedmetadata", () => {
    bgMusic.volume = MUSIC_VOLUME;
  });
}

setupBackgroundVideo();
window.addEventListener("resize", setupBackgroundVideo);
updateMusicButtons(false);

if (intro) {
  initializeExperienceCore();
  scheduleDeferredWork(initializeParticleEffects);
} else {
  bootExperience(true);
}
