const canvas = document.querySelector('canvas'); //declara a variavel canvas e a iguala a 'canvas' direto de index.html
const c = canvas.getContext('2d'); //declara a funcao c e define o jogo como 2d

c.fillRect(0,0,960,540); //preenche o retangulo do canvas de preto

const gravidade = 0.3

class Sprite {
    constructor({posicao,velocidade}) {
        this.posicao = posicao
        this.velocidade = velocidade
        this.altura = 150
    }

    draw () {
        c.fillStyle = 'red'
        c.fillRect(this.posicao.x, this.posicao.y, 50, 150)
    } //declara as caracteristicas da existencia do jogador

    update () {
        this.draw()
        this.posicao.y += this.velocidade.y
        this.posicao.x += this.velocidade.x
        
        if (this.posicao.y + this.velocidade.y + this.altura >= canvas.height) {
            this.velocidade.y = 0 //caso a soma entre todos esses forem maior que a altura do canvas, pare o jogador imediatamente, o botando no nivel chao
        }
        else {
            this.velocidade.y += gravidade //impede que passe do chao
        }

    }
}


const jogador = new Sprite ({
    posicao: {
        x: 150,
        y: 100
    },
    velocidade: {
        x: 0,
        y: 0
    }
}) //cria o jogador


const inimigo = new Sprite ({
    posicao: {
        x: 810,
        y: 100
    },
    velocidade: {
        x: 0,
        y: 0
    }
}) //cria o inimigo


console.log(jogador)

const teclas = {
    a: {
        pressed:false
    },
    d: {
        pressed:false
    },
    ArrowRight: {
        pressed:false
    },
    ArrowLeft: {
        pressed:false
    }
}

diminuirTimer ()

let ultimaTecla

function animate () {
    window.requestAnimationFrame(animate) //diz ao navegador que voce quer performar uma animacao
    c.fillStyle = 'black'
    c.fillRect (0,0,960,540)
    jogador.update()
    inimigo.update()

    jogador.velocidade.x = 0
    inimigo.velocidade.x = 0

    if (keys.a.pressed && ultimaTecla === 'a') {
        jogador.velocidade.x = -1
    } else if (keys.d.pressed && ultimaTecla === 'd') {
        jogador.velocidade.x = 1
    }

    if (keys.ArrowLeft.pressed && inimigo.ultimaTecla === 'ArrowLeft') {
        inimigo.velocidade.x = -1
    } else if (keys.ArrowRight.pressed && inimigo.ultimaTecla === 'ArrowRight') {
        inimigo.velocidade.x = 1
    }


    if (
        colisaoRetangular({
        retangulo1: jogador,
        retangulo2: inimigo
        }) &&
        jogador.atacando &&
        jogador.framesCurrent === 4
    ) {
        inimigo.tomaDano()
        jogador.atacando = false

    }

    if (jogador.atacando && jogador.framesCurrent === 4) {
        jogador.atacando = false
    }

    if (
        colisaoRetangular({
        retangulo1: inimigo,
        retangulo2: jogador
        }) &&
        inimigo.atacando &&
        inimigo.framesCurrent === 2
    ) {
        jogador.tomaDano()
        inimigo.atacando = false

    }

    if (inimigo.atacando && inimigo.framesCurrent === 2) {
        inimigo.atacando = false 
    }

    if (inimigo.saude <=0||jogador.idade <=0) {
        determineVencedor({jogador,inimigo,timerId})
    }
}


window.addEventListener('keydown', (event) => {
    if(!jogador.morto) {
    switch(event.key) {
        case 'd':
            jogador.velocidade.x = 5
            jogador.ultimaTecla = ''
            break

        case 'a':
            jogador.velocidade.x = -5
            break

        case 'w':
            jogador.velocidade.y = -12
            break
        case ' ':
            jogador.atacando()
            break
        }
    }

    if(!inimigo.morto) {
    switch(event.key) {
        case 'ArrowRight':
            inimigo.velocidade.x = 5
            break

        case 'ArrowLeft':
            inimigo.velocidade.x = -5
            break

        case 'ArrowUp':
            inimigo.velocidade.y = -12
            break
        case 'ArrowDown':
            inimigo.atacando()
            break
        }
    }
})

window.addEventListener('keyup', (event) => {
    switch(event.key) {
        case 'd':
            jogador.velocidade.x = 0
            break

        case 'a':
            jogador.velocidade.x = 0
            break
        case 'w':
            jogador.velocidade.x = 0
            break
        case 'ArrowRight':
            inimigo.velocidade.x = 0
            break

        case 'ArrowLeft':
            inimigo.velocidade.x = 0
            break
        case 'ArrowUp':
            inimigo.velocidade.x = 0
            break
    }
})

