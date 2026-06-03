// Seleciona o elemento canvas e obtém o contexto 2D para desenhar
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// Controla se o jogo está em andamento
let gameStarted = false

// Define o tamanho do canvas
canvas.width = 1024
canvas.height = 576

// ================================
// CLASSE SPRITE (base para todos os objetos visuais)
// ================================
class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
  }) {
    this.position = position       // Posição do sprite na tela
    this.width = 50                // Largura do sprite
    this.height = 150              // Altura do sprite
    this.image = new Image()       // Cria um novo objeto de imagem
    this.image.src = imageSrc      // Define o caminho da imagem
    this.scale = scale             // Escala do sprite
    this.framesMax = framesMax     // Total de frames na animação
    this.framesCurrent = 0         // Frame atual da animação
    this.framesElapsed = 0         // Contador de frames passados
    this.framesHold = 5            // Quantos frames esperar antes de avançar
    this.offset = offset           // Deslocamento visual do sprite
    this.facing = 1                // Direção que o sprite está olhando (1 = direita, -1 = esquerda)
  }

  draw() {
    c.save() // Salva o estado atual do canvas

    if (this.facing === -1) {
      // Se estiver olhando para a esquerda, espelha o sprite horizontalmente
      c.scale(-1, 1)
      c.translate(
        -(this.position.x - this.offset.x + (this.image.width / this.framesMax) * this.scale),
        0
      )
    } else {
      // Se estiver olhando para a direita, apenas translada normalmente
      c.translate(this.position.x - this.offset.x, 0)
    }

    // Desenha o frame atual da animação no canvas
    c.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax), // Posição X no spritesheet
      0,
      this.image.width / this.framesMax, // Largura de um frame
      this.image.height,
      0,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    )

    c.restore() // Restaura o estado do canvas
  }

  animateFrames() {
    this.framesElapsed++

    // Avança para o próximo frame quando o tempo de espera terminar
    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++
      } else {
        this.framesCurrent = 0 // Volta ao primeiro frame (loop)
      }
    }
  }

  update() {
    this.draw()
    this.animateFrames()
  }
}

// ================================
// CLASSE FIGHTER (extende Sprite, representa os lutadores)
// ================================
class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined }
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })

    this.velocity = velocity       // Velocidade de movimento do lutador
    this.width = 50                // Largura da hitbox
    this.height = 150              // Altura da hitbox
    this.lastKey                   // Última tecla pressionada
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset,    // Deslocamento da caixa de ataque
      width: attackBox.width,      // Largura da caixa de ataque
      height: attackBox.height     // Altura da caixa de ataque
    }
    this.color = color             // Cor do lutador (para debug)
    this.isAttacking               // Indica se está atacando
    this.health = 100              // Vida inicial do lutador
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.sprites = sprites         // Objeto com todas as animações do lutador
    this.dead = false              // Indica se o lutador está morto
    this.jumpCount = 0             // Contador de pulos realizados
    this.maxJumps = 2              // Máximo de pulos permitidos (pulo duplo)

    // Pré-carrega todas as imagens das animações
    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
  }

  // Reseta o lutador para o estado inicial (usado no recomeço)
  reset() {
    this.dead = false
    this.health = 100
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.isAttacking = false
    this.jumpCount = 0
    this.image = this.sprites.idle.image
    this.framesMax = this.sprites.idle.framesMax
  }

  update() {
    this.draw()
    if (!this.dead) this.animateFrames() // Só anima se não estiver morto

    // Atualiza a posição da caixa de ataque com base na posição do lutador
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    // Descomente abaixo para visualizar a caixa de ataque (debug)
    // c.fillRect(
    //   this.attackBox.position.x,
    //   this.attackBox.position.y,
    //   this.attackBox.width,
    //   this.attackBox.height
    // )

    // Move o lutador com base na velocidade atual
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Limite da borda esquerda
    if (this.position.x < 0) {
      this.position.x = 0
    }

    // Limite da borda direita
    if (this.position.x + this.width > canvas.width) {
      this.position.x = canvas.width - this.width
    }

    // Gravidade: para quando tocar no chão, senão aplica gravidade
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
      this.jumpCount = 0 // Reseta o contador de pulos ao tocar o chão
    } else {
      this.velocity.y += gravity
    }
  }

  // Inicia a animação e lógica de ataque
  attack() {
    this.switchSprite('attack1')
    this.isAttacking = true
  }

  // Reduz a vida ao receber um golpe
  takeHit() {
    this.health -= 20

    if (this.health <= 0) {
      this.switchSprite('death') // Morre se a vida chegar a zero
    } else {
      this.switchSprite('takeHit') // Animação de levar golpe
    }
  }

  // Troca a animação atual do lutador
  switchSprite(sprite) {
    // Se estiver na animação de morte, aguarda terminar e marca como morto
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true
      return
    }

    // Não interrompe a animação de ataque enquanto não terminar
    if (
      this.image === this.sprites.attack1.image &&
      this.framesCurrent < this.sprites.attack1.framesMax - 1
    )
      return

    // Não interrompe a animação de levar golpe enquanto não terminar
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return

    // Troca para a animação correta conforme o estado
    switch (sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image
          this.framesMax = this.sprites.run.framesMax
          this.framesCurrent = 0
        }
        break
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image
          this.framesMax = this.sprites.jump.framesMax
          this.framesCurrent = 0
        }
        break
      case 'fall':
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image
          this.framesMax = this.sprites.fall.framesMax
          this.framesCurrent = 0
        }
        break
      case 'attack1':
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      case 'takeHit':
        if (this.image !== this.sprites.takeHit.image) {
          this.image = this.sprites.takeHit.image
          this.framesMax = this.sprites.takeHit.framesMax
          this.framesCurrent = 0
        }
        break
      case 'death':
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image
          this.framesMax = this.sprites.death.framesMax
          this.framesCurrent = 0
        }
        break
    }
  }
}

// ================================
// FUNÇÕES AUXILIARES
// ================================

// Verifica se há colisão entre a caixa de ataque e o corpo do oponente
function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
      rectangle2.position.x &&
    rectangle1.attackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
      rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  )
}

// Determina o vencedor da partida e exibe o resultado na tela
function determineWinner({ player, enemy, timerId }) {
  if (!gameStarted) return
  gameStarted = false
  clearTimeout(timerId)
  document.querySelector('#displayText').style.display = 'flex'
  document.querySelector('#rematchBtn').style.display = 'block'

  if (player.health === enemy.health) {
    document.querySelector('#resultText').innerHTML = 'Empate!'
  } else if (player.health > enemy.health) {
    document.querySelector('#resultText').innerHTML = 'Jogador 1 venceu!'
  } else {
    document.querySelector('#resultText').innerHTML = 'Jogador 2 venceu!'
  }
}

// Contador regressivo da partida
let timer = 60
let timerId
function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000)
    timer--
    document.querySelector('#timer').innerHTML = timer
  }

  // Quando o tempo acabar, determina o vencedor
  if (timer === 0) {
    determineWinner({ player, enemy, timerId })
  }
}

// Efeito de tremida de tela ao receber um golpe
function screenShake() {
  const intensity = 8   // Intensidade da tremida em pixels
  const duration = 300  // Duração da tremida em milissegundos
  const start = Date.now()

  const shakeInterval = setInterval(() => {
    const elapsed = Date.now() - start

    // Para a tremida quando o tempo acabar e reseta a posição do canvas
    if (elapsed >= duration) {
      clearInterval(shakeInterval)
      canvas.style.marginLeft = '0px'
      canvas.style.marginTop = '0px'
      return
    }

    // Diminui a intensidade gradualmente com o tempo
    const remaining = 1 - elapsed / duration
    const x = (Math.random() - 0.5) * intensity * remaining
    const y = (Math.random() - 0.5) * intensity * remaining
    canvas.style.marginLeft = `${x}px`
    canvas.style.marginTop = `${y}px`
  }, 16) // ~60fps
}

// Faz a barra de vida piscar quando o lutador leva um golpe
function flashHealthBar(id) {
  const bar = document.querySelector(id)
  bar.classList.remove('flash')
  void bar.offsetWidth // Força o reflow para reiniciar a animação CSS
  bar.classList.add('flash')
}

// Preenche o canvas com preto antes de carregar tudo
c.fillRect(0, 0, canvas.width, canvas.height)

// Valor da gravidade aplicada aos lutadores
const gravity = 0.7

// ================================
// CRIAÇÃO DO CENÁRIO
// ================================
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background.png'
})

// ================================
// CRIAÇÃO DO JOGADOR 1
// ================================
const player = new Fighter({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  imageSrc: './img/samuraiMack/Idle.png',
  framesMax: 8,
  scale: 2.5,
  offset: { x: 215, y: 157 },
  sprites: {
    idle:    { imageSrc: './img/samuraiMack/Idle.png',                        framesMax: 8 },
    run:     { imageSrc: './img/samuraiMack/Run.png',                         framesMax: 8 },
    jump:    { imageSrc: './img/samuraiMack/Jump.png',                        framesMax: 2 },
    fall:    { imageSrc: './img/samuraiMack/Fall.png',                        framesMax: 2 },
    attack1: { imageSrc: './img/samuraiMack/Attack1.png',                     framesMax: 6 },
    takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', framesMax: 4 },
    death:   { imageSrc: './img/samuraiMack/Death.png',                       framesMax: 6 }
  },
  attackBox: {
    offset: { x: 100, y: 50 },
    width: 160,
    height: 50
  }
})

// ================================
// CRIAÇÃO DO JOGADOR 2
// ================================
const enemy = new Fighter({
  position: { x: 1600, y: 100 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  imageSrc: './img/kenji/Idle.png',
  framesMax: 4,
  scale: 2.5,
  offset: { x: 215, y: 167 },
  sprites: {
    idle:    { imageSrc: './img/kenji/Idle.png',     framesMax: 4 },
    run:     { imageSrc: './img/kenji/Run.png',      framesMax: 8 },
    jump:    { imageSrc: './img/kenji/Jump.png',     framesMax: 2 },
    fall:    { imageSrc: './img/kenji/Fall.png',     framesMax: 2 },
    attack1: { imageSrc: './img/kenji/Attack1.png',  framesMax: 4 },
    takeHit: { imageSrc: './img/kenji/Take hit.png', framesMax: 3 },
    death:   { imageSrc: './img/kenji/Death.png',    framesMax: 7 }
  },
  attackBox: {
    offset: { x: -170, y: 50 },
    width: 170,
    height: 50
  }
})

console.log(player)

// ================================
// CONTROLE DE TECLAS
// ================================
const keys = {
  a:          { pressed: false },
  d:          { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft:  { pressed: false }
}

// Exibe a contagem regressiva antes do jogo começar
function startCountdown() {
  const displayText = document.querySelector('#displayText')
  const messages = ['3', '2', '1', 'FIGHT!']
  gameStarted = false
  let i = 0

  displayText.style.display = 'flex'
  document.querySelector('#resultText').innerHTML = messages[i]

  const countdownInterval = setInterval(() => {
    i++
    if (i < messages.length) {
      document.querySelector('#resultText').innerHTML = messages[i]
    } else {
      // Contagem terminou — inicia o jogo!
      clearInterval(countdownInterval)
      displayText.style.display = 'none'
      gameStarted = true
      decreaseTimer()
    }
  }, 1000)
}

startCountdown()

// ================================
// LOOP PRINCIPAL DO JOGO
// ================================
function animate() {
  window.requestAnimationFrame(animate)

  // Limpa o canvas a cada frame
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Desenha o cenário de fundo
  background.update()

  // Overlay semi-transparente sobre o fundo
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Atualiza e desenha os lutadores
  player.update()
  enemy.update()

  // Zera a velocidade horizontal a cada frame (movimento só ocorre com tecla pressionada)
  player.velocity.x = 0
  enemy.velocity.x = 0

  // --- Movimentação do Jogador 1 ---
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5
    player.facing = -1
    player.switchSprite('run')
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5
    player.facing = 1
    player.switchSprite('run')
  } else {
    player.switchSprite('idle')
  }

  // Animação de pulo e queda do Jogador 1
  if (player.velocity.y < 0) {
    player.switchSprite('jump')
  } else if (player.velocity.y > 0) {
    player.switchSprite('fall')
  }

  // --- Movimentação do Jogador 2 ---
  if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -5
    enemy.facing = 1
    enemy.switchSprite('run')
  } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 5
    enemy.facing = -1
    enemy.switchSprite('run')
  } else {
    enemy.switchSprite('idle')
  }

  // Animação de pulo e queda do Jogador 2
  if (enemy.velocity.y < 0) {
    enemy.switchSprite('jump')
  } else if (enemy.velocity.y > 0) {
    enemy.switchSprite('fall')
  }

  // --- Detecção de colisão: Jogador 1 acerta Jogador 2 ---
  if (
    rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
    player.isAttacking &&
    player.framesCurrent === 4
  ) {
    enemy.takeHit()
    player.isAttacking = false
    screenShake()
    flashHealthBar('#enemyHealth')
    gsap.to('#enemyHealth', { width: enemy.health + '%' })
  }

  // Se o Jogador 1 errou o golpe, cancela o ataque
  if (player.isAttacking && player.framesCurrent === 4) {
    player.isAttacking = false
  }

  // --- Detecção de colisão: Jogador 2 acerta Jogador 1 ---
  if (
    rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
    enemy.isAttacking &&
    enemy.framesCurrent === 2
  ) {
    player.takeHit()
    enemy.isAttacking = false
    screenShake()
    flashHealthBar('#playerHealth')
    gsap.to('#playerHealth', { width: player.health + '%' })
  }

  // Se o Jogador 2 errou o golpe, cancela o ataque
  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false
  }

  // Verifica se algum lutador ficou sem vida e encerra o jogo
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId })
  }
}

animate()

// EVENTOS DE TECLADO


// Teclas pressionadas
window.addEventListener('keydown', (event) => {
  if (!gameStarted) return // Ignora teclas fora do jogo

  // Controles do Jogador 1 (A, D, W, S)
  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        if (player.jumpCount < player.maxJumps) {
          player.velocity.y = -15
          player.jumpCount++
        }
        break
      case 's':
        player.attack()
        const hitSound1 = new Audio('hit.mp3')
        hitSound1.play()
        break
    }
  }

  // Controles do Jogador 2
  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        if (enemy.jumpCount < enemy.maxJumps) {
          enemy.velocity.y = -15
          enemy.jumpCount++
        }
        break
      case 'ArrowDown':
        enemy.attack()
        const hitSound2 = new Audio('hit.mp3')
        hitSound2.play()
        break
    }
  }
})

// Teclas soltas ,para o movimento quando a tecla é solta
window.addEventListener('keyup', (event) => {
  // Jogador 1
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
  }

  // Jogador 2
  switch (event.key) {
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})


// MÚSICA DE FUNDO

const audio = document.getElementById('bg-music')

// Inicia a música na primeira interação do usuário (exigência dos navegadores)
function startMusic() {
  audio.play().catch(err => console.log('Áudio bloqueado:', err))
  document.removeEventListener('click', startMusic)
  document.removeEventListener('keydown', startMusic)
}

document.addEventListener('click', startMusic)
document.addEventListener('keydown', startMusic)

// ================================
// BOTÃO DE REVANCHE
// ================================
document.querySelector('#rematchBtn').addEventListener('click', () => {
  // Reinicia a música do início
  audio.currentTime = 0
  audio.play()

  // Esconde a tela de resultado
  document.querySelector('#rematchBtn').style.display = 'none'
  document.querySelector('#displayText').style.display = 'none'

  // Reseta a vida dos dois lutadores
  player.health = 100
  enemy.health = 100
  gsap.to('#playerHealth', { width: '100%' })
  gsap.to('#enemyHealth', { width: '100%' })

  // Reseta as posições dos lutadores
  player.position.x = 0
  player.position.y = 0
  player.velocity.x = 0
  player.velocity.y = 0

  enemy.position.x = 1600
  enemy.position.y = 100
  enemy.velocity.x = 0
  enemy.velocity.y = 0

  // Reseta o estado interno dos lutadores
  player.reset()
  enemy.reset()

  // Reseta o cronômetro
  timer = 60
  document.querySelector('#timer').innerHTML = timer

  // Inicia a contagem regressiva novamente
  gameStarted = false
  startCountdown()
})