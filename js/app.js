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
  updateMenuRewards(game.rewards);
};

game.onSuccess = (roundNum, total) => {
  $('ar-status').classList.add('found');
  $('status-text').innerText = `✅ TARGET FOUND!`;
  $('success-overlay').classList.add('visible');

  if (window.confetti) {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
  }

  setTimeout(() => {
    $('success-overlay').classList.remove('visible');

    // Show Milestone Popup
    const rewardName = REWARD_NAMES[roundNum - 1];
    const emoji = rewardName.split(' ').pop();
    const code = `IKEA-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const nextCount = total - roundNum;

    // Update Popup DOM
    $('milestone-emoji').innerText = emoji;
    $('milestone-title').innerText = 'Milestone Unlocked!';
    $('milestone-won-text').innerText = `You won: ${rewardName}`;
    $('milestone-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`;
    $('milestone-code').innerText = code;

    // Render Popup Map
    const popupNodes = $('popup-map-nodes');
    if (popupNodes) {
      const pos = [{x:50,y:160},{x:80,y:115},{x:30,y:70},{x:50,y:20}];
      popupNodes.innerHTML = pos.map((p, i) => {
        const isCompleted = i < roundNum - 1;
        const isActive = i === roundNum - 1;
        const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
        return `
          <div style="position: absolute; left: ${p.x}%; top: ${p.y}px; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center;">
            <div class="map-node ${statusClass}" style="position: relative; left: 0; top: 0; transform: none; cursor: default;">
              ${isCompleted ? '✓' : (i + 1)}
            </div>
          </div>
        `;
      }).join('');
    }

    if (nextCount > 0) {
      $('milestone-next-msg').innerText = `Unlock next 1 to win: ${REWARD_NAMES[roundNum]}`;
      $('milestone-next-msg').style.display = 'block';
    } else {
      $('milestone-next-msg').style.display = 'none';
      $('milestone-title').innerText = 'Hunt Complete!';
    }

    $('milestone-overlay').classList.add('visible');

    // Add to rewards pool
    const newReward = { type: 'milestone', barcode: code, name: rewardName, unlocked_at: new Date().toISOString() };
    const currentRewards = game.rewards || [];
    game.rewards = [...currentRewards, newReward];
    updateMenuRewards(game.rewards);
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
const REWARD_NAMES = [
  'Ice Cream 🍦',
  '$2 IKEA Voucher 🎫',
  'Swedish Meatballs 🧆',
  'IKEA Gift Card 🎁'
];

const updateMenuRewards = (rewards) => {
  const nodesContainer = $('map-nodes');
  const nextRewardName = $('next-reward-name');

  if (!nodesContainer) return;

  const currentRound = game.round; // 0 to 4
  const totalClues = 4;

  // Render Map Nodes
  const nodePositions = [
    { x: 50, y: 220 }, // Node 1 (Bottom)
    { x: 75, y: 160 }, // Node 2
    { x: 35, y: 100 }, // Node 3
    { x: 50, y: 30 }   // Node 4 (Top)
  ];

  nodesContainer.innerHTML = nodePositions.map((pos, i) => {
    const isCompleted = i < currentRound;
    const isActive = i === currentRound;
    const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
    const reward = rewards ? rewards[i] : null;

    return `
      <div style="position: absolute; left: ${pos.x}%; top: ${pos.y}px; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center;">
        <div class="map-node ${statusClass}" 
             style="position: relative; left: 0; top: 0; transform: none;" 
             onclick="showMapReward(${i})">
          ${isCompleted ? '✓' : (i + 1)}
        </div>
        <div style="font-size: 0.7em; font-weight: bold; color: #333; margin-top: 4px; text-shadow: 0 1px 2px white; background: rgba(255,255,255,0.7); padding: 2px 6px; border-radius: 10px;">Level ${i + 1}</div>
      </div>
    `;
  }).join('');

  // Update Next Reward Preview
  if (currentRound < totalClues) {
    nextRewardName.innerText = `🎁 ${REWARD_NAMES[currentRound]}`;
    $('next-reward-preview').style.display = 'block';
  } else {
    nextRewardName.innerText = `All rewards found! 🏆`;
  }
};

window.showMapReward = (index) => {
  const rewards = game.rewards || [];
  const reward = rewards[index];

  if (!reward) {
    alert(`Complete Clue ${index + 1} to unlock ${REWARD_NAMES[index]}!`);
    return;
  }

  // Show milestone popup for this specific reward
  $('milestone-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reward.barcode}`;
  $('milestone-code').innerText = reward.barcode;
  $('milestone-next-msg').style.display = 'none';

  $('milestone-title').innerText = 'Your Reward';
  $('milestone-won-text').innerText = REWARD_NAMES[index];
  $('milestone-emoji').innerText = REWARD_NAMES[index].split(' ').pop();

  // Render Popup Map
  const popupNodes = $('popup-map-nodes');
  if (popupNodes) {
    const pos = [{x:50,y:160},{x:80,y:115},{x:30,y:70},{x:50,y:20}];
    popupNodes.innerHTML = pos.map((p, i) => {
      const isCompleted = i < index;
      const isActive = i === index;
      const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
      return `<div class="map-node ${statusClass}" style="left: ${p.x}%; top: ${p.y}px; cursor: default;">${isCompleted ? '✓' : (i + 1)}</div>`;
    }).join('');
  }

  $('milestone-overlay').classList.add('visible');
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

  const stopRulesVideo = () => {
    const iframe = $('rules-video');
    if (iframe) {
      const src = iframe.src;
      iframe.src = src;
    }
  };

  $('btn-back-terms').onclick = () => goToStep(2);
  $('btn-back-2').onclick = () => {
    stopRulesVideo();
    goToStep('terms');
  };

  $('startBtn').onclick = async () => {
    stopRulesVideo();
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
  updateMenuRewards([]);

  $('milestone-close').onclick = () => {
    $('milestone-overlay').classList.remove('visible');
  };
};
