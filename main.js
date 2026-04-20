// ============================================================
// 8th Wall AR Treasure Hunt - IKEA Original UI Sync
// ============================================================

// ---- Clue Data ----
const CLUES = [
  {
    target: 'bell',
    text: 'I ring to announce your arrival. Find the Bell!',
    hint: 'HINT: Listen with your eyes — look for something that chimes.',
  },
  {
    target: 'clock',
    text: 'I have hands but no arms, and I help you stay on time. Find the Clock!',
    hint: 'HINT: Check the wall — time is ticking!',
  },
  {
    target: 'osama',
    text: 'I watch over everything from a frame. Find the Portrait!',
    hint: 'HINT: Look for a familiar face on display.',
  },
]

// ---- Shuffle ----
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---- Game State ----
const clueOrder = shuffle([...CLUES])
let round = 0
let panelCollapsed = false
const meshes = {}
let playerName = ''
let playerPhone = ''

// ---- DOM Helper ----
const $ = (id) => document.getElementById(id)

// ---- UI: Show Clue ----
const showClue = () => {
  if (round >= clueOrder.length) {
    showRewardScreen()
    return
  }
  const clue = clueOrder[round]
  $('clue-number').innerText = `Clue ${round + 1}/${clueOrder.length}`
  $('clue-text').innerText = clue.text
  $('clue-hint').innerText = clue.hint
  $('clue-panel').classList.add('visible')
  $('clue-panel').classList.remove('collapsed')
  $('status-text').innerText = `Scanning for: ${clue.target.toUpperCase()}`
  $('ar-status').classList.remove('found')
  panelCollapsed = false
}

// ---- UI: Success Popup ----
const showSuccess = () => {
  const overlay = $('success-overlay')
  overlay.classList.add('visible')

  if (window.confetti) {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } })
  }

  setTimeout(() => {
    overlay.classList.remove('visible')
    round++
    if (round >= clueOrder.length) {
      showRewardScreen()
    } else {
      showClue()
    }
  }, 2000)
}

// ---- UI: Reward Screen ----
const showRewardScreen = () => {
  $('clue-panel').classList.remove('visible')
  $('ar-status').style.display = 'none'
  $('menu-btn').style.display = 'none'
  $('reward-screen').classList.add('visible')

  if (window.confetti) {
    const end = Date.now() + 3000
    const colors = ['#0051ba', '#ffda1a', '#ff6b6b', '#00ff88']
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }
}

// ---- Panel Toggle ----
const setupPanelToggle = () => {
  const toggle = () => {
    panelCollapsed = !panelCollapsed
    if (panelCollapsed) {
      $('clue-panel').classList.add('collapsed')
      $('cp-toggle-icon').innerText = '▲'
    } else {
      $('clue-panel').classList.remove('collapsed')
      $('cp-toggle-icon').innerText = '▼'
    }
  }

  $('cp-toggle-bar').onclick = toggle
  $('cp-toggle-icon').onclick = toggle
  $('cp-ok').onclick = () => {
    panelCollapsed = true
    $('clue-panel').classList.add('collapsed')
    $('cp-toggle-icon').innerText = '▲'
  }
}

// ---- Side Menu ----
const setupSideMenu = () => {
  const toggleMenu = () => {
    $('side-menu').classList.toggle('open')
    $('side-menu-overlay').classList.toggle('visible')
  }
  $('menu-btn').onclick = toggleMenu
  $('side-menu-overlay').onclick = toggleMenu
  $('close-menu').onclick = toggleMenu
}

// ---- Pipeline Module: Image Target Tracking ----
const imageTargetPipelineModule = () => {
  const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08)

  const showTarget = ({ detail }) => {
    const { name, position, rotation, scale } = detail

    if (!meshes[name]) {
      const isCurrentTarget = (name === clueOrder[round]?.target)
      const color = isCurrentTarget ? 0x00ff88 : 0xff4444
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      const mesh = new THREE.Mesh(geometry, mat)
      const { scene } = XR8.Threejs.xrScene()
      scene.add(mesh)
      meshes[name] = mesh
    }

    const m = meshes[name]
    m.position.copy(position)
    m.quaternion.copy(rotation)
    m.scale.set(scale, scale, scale)
    m.visible = true

    const isCurrentTarget = (name === clueOrder[round]?.target)
    m.material.color.setHex(isCurrentTarget ? 0x00ff88 : 0xff4444)

    if (isCurrentTarget && round < clueOrder.length) {
      $('ar-status').classList.add('found')
      $('status-text').innerText = `✅ ${name.toUpperCase()} FOUND!`

      const foundRound = round
      setTimeout(() => {
        if (round === foundRound) showSuccess()
      }, 500)
    }
  }

  const hideTarget = ({ detail }) => {
    if (meshes[detail.name]) {
      meshes[detail.name].visible = false
    }
  }

  return {
    name: 'image-target-game',
    onStart: () => {
      const { scene } = XR8.Threejs.xrScene()
      scene.add(new THREE.AmbientLight(0xffffff, 1))
      scene.add(new THREE.DirectionalLight(0xffffff, 0.5))
      showClue()
    },
    listeners: [
      { event: 'reality.imagefound', process: showTarget },
      { event: 'reality.imageupdated', process: showTarget },
      { event: 'reality.imagelost', process: hideTarget },
    ],
  }
}

// ---- Registration Flow ----
const goToSignup = () => window.open('https://www.ikea.com/in/en/profile/signup/', '_blank');
const goToStep = (step) => {
  document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'))
  $(`step-${step}`).classList.add('active')
}

const setupRegistration = () => {
  $('btn-is-member').onclick = () => goToStep(2)
  $('btn-sign-up').onclick = goToSignup
  $('link-sign-up').onclick = (e) => { e.preventDefault(); goToSignup(); };
  $('btn-back-1').onclick = () => goToStep(1)
  $('btn-back-2').onclick = () => goToStep(2)

  $('btn-continue-2').onclick = () => {
    const name = $('userNameInput').value.trim()
    const phone = $('membershipInput').value.trim()

    if (!name || !/^\d{10}$/.test(phone)) {
      $('codeErrorMsg').classList.add('visible')
      $('userNameInput').classList.add('input-error')
      $('membershipInput').classList.add('input-error')
      setTimeout(() => {
        $('userNameInput').classList.remove('input-error')
        $('membershipInput').classList.remove('input-error')
      }, 600)
      return
    }

    $('codeErrorMsg').classList.remove('visible')
    playerName = name
    playerPhone = phone
    $('menu-player-name').innerText = playerName
    $('menu-player-phone').innerText = playerPhone
    $('reward-player-name').innerText = `Well done, ${playerName}!`
    goToStep(3)
  }

  $('startBtn').onclick = () => {
    $('registration-overlay').classList.add('hidden')
    $('ar-status').style.display = 'flex'
    $('menu-btn').style.display = 'flex'
    startAR()
  }
}

// ---- Boot XR8 ----
const startAR = () => {
  const onxrloaded = async () => {
    const jsonFiles = ['bell.json', 'clock.json', 'osama.json']
    const imageTargetData = await Promise.all(
      jsonFiles.map(f => fetch(f).then(r => r.json()))
    )

    XR8.XrController.configure({ imageTargetData })

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      XRExtras.AlmostThere.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      imageTargetPipelineModule(),
    ])

    XR8.run({ canvas: document.getElementById('camerafeed') })
  }

  window.XR8
    ? (window.XRExtras ? onxrloaded() : window.addEventListener('xrextrasloaded', onxrloaded))
    : window.addEventListener('xrloaded', () => {
        window.XRExtras ? onxrloaded() : window.addEventListener('xrextrasloaded', onxrloaded)
      })
}

// ---- Init ----
window.onload = () => {
  setupPanelToggle()
  setupSideMenu()
  setupRegistration()
}
