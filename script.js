const canvas = document.querySelector('canvas'); //declara a variavel canvas e a iguala a 'canvas' direto de index.html
const c = canvas.getContext('2d'); //declara a funcao c e define o jogo como 2d

c.fillRect(0,0,960,540); //preenche o retangulo do canvas de preto

const gravidade = 0.3

class Sprite {
    constructor({posicao,velocidade}) {
        this.posicao = posicao
        this.velocidade = velocidade
        this.altura = 150
        this.lastKey
    }

    draw () {
        c.fillStyle = 'red'
        c.fillRect(this.posicao.x, this.posicao.y, 50, 150)
    } //declara as caracteristicas da existencia do jogador

    update () {
        this.draw()

        this.posicao.x += this.velocidade.x
        this.posicao.y += this.velocidade.y
        
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

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w:{
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft:{
        pressed: false
    }, 
    

}

let lastKey

function animate () {
    window.requestAnimationFrame(animate) //diz ao navegador que voce quer performar uma animacao
    c.fillStyle = 'black'
    c.fillRect (0,0,960,540)
    jogador.update()
    inimigo.update()

jogador.velocidade.x = 0
inimigo.velocidade.x = 0

//Movimento do jogador
if (keys.a.pressed && lastKey ==='a'){
    jogador.velocidade.x = -1
} else if (keys.d.pressed && lastKey === 'd'){
    jogador.velocidade.x= 1
}

//Movimento do inimigo
if(keys.ArrowLeft.pressed && inimigo.lastKey === 'ArrowLeft'){
    inimigo.velocidade.x = -1
} else if (keys.ArrowRight.pressed && inimigo.lastKey === 'ArrowRight'){
    inimigo.velocidade.x= 1
}
}
animate()
//adiciona um event listener para a movimentação do jogador.(Dedo pressionando da tecla)
window.addEventListener('keydown', (event)=> {
    console.log(event.key);
    switch (event.key){
        case 'd':
        keys.d.pressed = true
        lastKey= 'd'
        break
        case 'a': 
        keys.a.pressed = true
        lastKey = 'a'
        break
         case 'w': 
        jogador.velocidade.y = -10
        break
        
         case 'ArrowRight':
        keys.ArrowRight.pressed = true
        inimigo.lastKey = 'ArrowRight'
        break
        case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        inimigo.lastKey = 'ArrowLeft'
        break
         case 'ArrowUp': 
        inimigo.velocidade.y = -10
        break
    }
    console.log(event.key)
})
//adiciona um event listener para a movimentação do jogador.(Dedo fora da tecla)
window.addEventListener('keyup', (event)=> {
    switch (event.key){
        case 'd':a
      keys.d.pressed = false
        break
        case 'a': 
        keys.a.pressed = false
        break
          case 'w': 
        keys.w.pressed = false
        lastKey = 'w'

       }

       // Teclas do inimigo.
       switch (event.key){
        case 'ArrowRight':
        keys.ArrowRight.pressed = false
        break
        case 'ArrowLeft':
        keys.ArrowLeft.pressed = false
            break
        
  

    console.log(event.key)
}
})
