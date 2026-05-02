// ============================================================
// 8th Wall AR Treasure Hunt - IKEA AR Modular Boot
// ============================================================

// ---- Global instances ----
const cluePool = new CluePool();
const dbService = new DatabaseService();
const game = new GameManager(cluePool, dbService);

// ---- DOM Helpers ----
const $ = (id) => document.getElementById(id);

// ---- UI Bindings ----
game.onClueUpdate = (clue, roundNum, total) => {
  $('clue-number').innerText = `Clue ${roundNum}/${total}`;
  $('clue-text').innerText = clue.text;
  $('clue-hint').innerText = clue.hint;
  $('clue-panel').classList.add('visible');
  $('clue-panel').classList.remove('collapsed');
  $('status-text').innerText = `Scanning for: ${clue.target.toUpperCase()}`;
  $('ar-status').classList.remove('found');
};

game.onSuccess = () => {
  $('ar-status').classList.add('found');
  $('status-text').innerText = `✅ TARGET FOUND!`;
  $('success-overlay').classList.add('visible');

  if (window.confetti) {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
  }

  setTimeout(() => {
    $('success-overlay').classList.remove('visible');
  }, 2000);
};

game.onGameComplete = (name, timeTaken, rewards) => {
  $('registration-overlay').classList.add('hidden'); // Ensure reg is hidden
  $('clue-panel').classList.remove('visible');
  $('ar-status').style.display = 'none';
  $('menu-btn').style.display = 'flex'; // KEEP MENU VISIBLE
  $('reward-screen').classList.add('visible');
  $('reward-player-name').innerText = `Well done, ${name}!`;

  // Custom message with time
  const rewardMsg = document.querySelector('#reward-screen p');
  if (rewardMsg) {
    rewardMsg.innerHTML = `You completed the hunt in <strong>${timeTaken}</strong>!<br>Show this to a staff member.`;
  }

  // Update profile menu rewards
  updateMenuRewards(rewards);

  if (window.confetti) {
    const end = Date.now() + 3000;
    const colors = ['#0051ba', '#ffda1a', '#ff6b6b', '#00ff88'];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }
};

// ---- Profile / Rewards UI ----
const updateMenuRewards = (rewards) => {
  const list = $('menu-reward-list');
  if (!rewards || rewards.length === 0) {
    list.innerHTML = '<p style="color: #999; font-style: italic; font-size: 0.9em;">No rewards found yet. Keep hunting!</p>';
    return;
  }

  list.innerHTML = rewards.map((r, i) => `
    <div class="menu-reward-item" id="reward-${i}">
      <span class="reward-type">${r.type === 'final' ? '🏆 FINAL REWARD' : '🎁 MILESTONE REWARD'}</span>
      <div class="reward-reveal-container">
        <span class="reward-barcode" id="barcode-${i}" style="display:none; font-family:monospace; background:#eee; padding:5px; border-radius:4px; font-weight:bold; margin:5px 0; text-align:center;">${r.barcode}</span>
        <button class="redeem-btn" id="redeem-${i}" onclick="redeemReward('${i}')" style="background:var(--ikea-blue); color:white; border:none; padding:8px; border-radius:4px; width:100%; font-weight:bold; cursor:pointer;">REDEEM</button>
      </div>
    </div>
  `).join('');
};

window.redeemReward = (index) => {
  const barcode = $(`barcode-${index}`);
  const btn = $(`redeem-${index}`);

  barcode.style.display = 'block';
  btn.style.display = 'none';

  let timeLeft = 15;
  const timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      barcode.style.display = 'none';
      btn.style.display = 'block';
      btn.innerText = 'REDEEM';
    } else {
      btn.innerText = `REDEEMING... (${timeLeft}s)`;
    }
  }, 1000);
};

// ---- Panel Toggle ----
const setupPanelToggle = () => {
  const toggle = () => {
    $('clue-panel').classList.toggle('collapsed');
    const isCollapsed = $('clue-panel').classList.contains('collapsed');
    $('cp-toggle-icon').innerText = isCollapsed ? '▲' : '▼';
  };
  $('cp-toggle-bar').onclick = toggle;
  $('cp-toggle-icon').onclick = toggle;
  $('cp-ok').onclick = () => {
    $('clue-panel').classList.add('collapsed');
    $('cp-toggle-icon').innerText = '▲';
  };
};

// ---- Side Menu ----
const setupSideMenu = () => {
  const toggleMenu = () => {
    $('side-menu').classList.toggle('open');
    $('side-menu-overlay').classList.toggle('visible');
  };
  $('menu-btn').onclick = toggleMenu;
  $('side-menu-overlay').onclick = toggleMenu;
  $('close-menu').onclick = toggleMenu;
};

// ---- Pipeline Module ----
const imageTargetPipelineModule = () => {
  const meshes = {};
  const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);

  const processTarget = ({ detail }) => {
    const { name, position, rotation, scale } = detail;
    const currentTarget = game.getCurrentTarget();

    if (!meshes[name]) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
      const mesh = new THREE.Mesh(geometry, mat);
      const { scene } = XR8.Threejs.xrScene();
      scene.add(mesh);
      meshes[name] = mesh;
    }

    const m = meshes[name];
    m.position.copy(position);
    m.quaternion.copy(rotation);
    m.scale.set(scale, scale, scale);
    m.visible = true;

    // Logic for correct target
    if (name === currentTarget) {
      game.handleTargetFound(name);
    }
  };

  return {
    name: 'image-target-logic',
    onStart: () => {
      const { scene } = XR8.Threejs.xrScene();
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
    },
    listeners: [
      { event: 'reality.imagefound', process: processTarget },
      { event: 'reality.imageupdated', process: processTarget },
      { event: 'reality.imagelost', process: ({ detail }) => { if (meshes[detail.name]) meshes[detail.name].visible = false; } },
    ],
  };
};

// ---- Registration ----
const setupRegistration = () => {
  const goToSignup = () => window.open('https://www.ikea.com/in/en/profile/signup/', '_blank');
  const goToStep = (step) => {
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    $(`step-${step}`).classList.add('active');

    // Toggle terms-specific layout
    const container = document.querySelector('.reg-container');
    if (step === 'terms') {
      container.classList.add('terms-layout');
    } else {
      container.classList.remove('terms-layout');
    }
  };

  $('btn-is-member').onclick = () => goToStep(2);
  $('btn-sign-up').onclick = goToSignup;
  $('link-sign-up').onclick = (e) => { e.preventDefault(); goToSignup(); };
  $('btn-back-1').onclick = () => goToStep(1);

  $('btn-continue-2').onclick = () => {
    const name = $('userNameInput').value.trim();
    const phone = $('membershipInput').value.trim();

    if (!name || !/^\d{10}$/.test(phone)) {
      $('codeErrorMsg').classList.add('visible');
      return;
    }

    $('codeErrorMsg').classList.remove('visible');
    goToStep('terms');
  };

  $('btn-continue-terms').onclick = () => {
    if (!$('terms-checkbox').checked) {
      $('termsErrorMsg').classList.add('visible');
      return;
    }
    $('termsErrorMsg').classList.remove('visible');
    goToStep(3);
  };

  $('btn-back-terms').onclick = () => goToStep(2);
  $('btn-back-2').onclick = () => goToStep('terms');

  $('startBtn').onclick = async () => {
    const name = $('userNameInput').value.trim();
    const phone = $('membershipInput').value.trim();

    $('registration-overlay').classList.add('hidden');
    $('ar-status').style.display = 'flex';
    $('menu-btn').style.display = 'flex';
    $('menu-player-name').innerText = name;
    $('menu-player-phone').innerText = phone;

    // Start Game & AR
    await game.start(name, phone);
    startAR();
  };
};

// ---- 8th Wall Boot ----
const startAR = () => {
  const onxrloaded = async () => {
const jsonFiles = ['image-targets/ikeaclock.json', 'image-targets/iglu.json', 'image-targets/studytablemat.json', 'image-targets/tigerpilow.json'];
    const imageTargetData = await Promise.all(jsonFiles.map(f => fetch(f).then(r => r.json())));
    XR8.XrController.configure({ imageTargetData });

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      XRExtras.AlmostThere.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      imageTargetPipelineModule(),
    ]);

    XR8.run({ canvas: $('camerafeed') });
  };

  window.XR8
    ? (window.XRExtras ? onxrloaded() : window.addEventListener('xrextrasloaded', onxrloaded))
    : window.addEventListener('xrloaded', () => {
      window.XRExtras ? onxrloaded() : window.addEventListener('xrextrasloaded', onxrloaded);
    });
};

// ---- Init ----
window.onload = () => {
  setupPanelToggle();
  setupSideMenu();
  setupRegistration();
};
