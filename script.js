let btnRoll = document.querySelector('.game__button_green');
let btnHold = document.querySelector('.game__button_red');
btnRoll.addEventListener('click', rollDice);
btnHold.addEventListener('click', holdDice);

const myScoreBlock = document.querySelector('.game-score__group[data-player="1"]');
const oponentScoreBlock = document.querySelector('.game-score__group[data-player="2"]');

const myPlayerId = (new Date).getTime();
let turnScore = 0;
let prevRollDice = false;
let playersScoreObj = {
    1: 0,
    2: 0
}

let newDiceId = 1;
let myTurn = true;
let multiplayerFlag = false;
let multiplayerRoom = '';
let timeoutIdAFK;

function rollDice() {
    const diceBlock = document.querySelector('.dice.active');
    if(myTurn) turnOfBtn();
    addRollAnimation.call(diceBlock);
    setTimeout(() => {
        if(myTurn) turnOnBtn();
        removeRollAnimation.call(diceBlock);
        showNewDice(diceBlock);
    }, 400);

    if (multiplayerFlag) {
        clearTimeout(timeoutIdAFK);
        timeoutIdAFK = setTimeout(() => checkMyAFK(), 10 * 1000);
        prevRollDice = true;
    }
}

function holdDice() {
    let player = myTurn ? 1 : 2;
    playersScoreObj[player] += turnScore;
    let playerBlock = document.querySelector(`.game-score__group[data-player='${player}']`);
    turnScore = 0;
    document.querySelector('.game__turn-score').textContent = `0`;
    playerBlock.children[2].textContent = `${playersScoreObj[player]}`;
    updateScoreProgress.call(playerBlock, player);
    (playersScoreObj[player] >= 100) ? endGame(player) : switchTurn();
}

function addRollAnimation() {
    this.style.animationName = 'roll';
    this.style.animationDuration = '0.3s';
    this.style.opacity = '.3';
}

function removeRollAnimation() {
    this.style.animationName = '';
    this.style.opacity = '1';
}

function showNewDice(diceBlock) {
    diceBlock.classList.remove('active');
    newDiceId = getRndInteger(1, 6);
    let newDiceBlock = document.querySelector(`.dice[data-diceid='${newDiceId}']`);
    newDiceBlock.classList.add('active');

    if (newDiceId !== 1) {
        updateTurnScore(newDiceId);
    } else {
        rotatePig();
        switchTurn();
    }

    if (multiplayerFlag) wsSendRollDice();
}

function updateTurnScore(score) {
    turnScore += (+score);
    document.querySelector('.game__turn-score').textContent = `${turnScore}`;
    myTurn ? showTurnScoreProgress.call(myScoreBlock, 1) : showTurnScoreProgress.call(oponentScoreBlock, 2);
    let player = myTurn ? '1' : '2';
    if (playersScoreObj[player] + turnScore >= 100) endGame(player);
}

function updateScoreProgress(player) {
    let progressBlock = this.children[1].children[0];
    this.children[2].textContent = `${playersScoreObj[player]}`;
    progressBlock.style.width = `${playersScoreObj[player]}%`;
}

function switchTurn() {
    turnScore = 0;
    document.querySelector('.game__turn-score').textContent = `${turnScore}`;
    let playerTurnText = document.querySelector('.game__turn');
    if (myTurn) {
        playerTurnText.textContent = 'Opponent Turn';
        myScoreBlock.children[1].children[1].style.width = '0%';
        turnOfBtn();
        if (multiplayerFlag) {
            wsSendSwitchTurn();
            clearTimeout(timeoutIdAFK);
            prevRollDice = false;
        }
        else {
            singlePlayerTurn();
        }
    }
    else {
        playerTurnText.textContent = 'Your Turn';
        oponentScoreBlock.children[1].children[1].style.width = '0%';
        turnOnBtn();
    }
    myTurn = !myTurn;
}

function singlePlayerTurn() {
    let turnCount = getRndInteger(2, 5);
    let currentTurn = 0;
    let interval = setInterval(() => {
        if (currentTurn == turnCount - 1) {
            holdDice();
            clearInterval(interval);
        }
        else if (myTurn) {
            clearInterval(interval);
        }
        else {
            currentTurn += 1;
            rollDice();
        }
    }, 1000);
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function turnOfBtn() {
    btnHold.removeEventListener('click', holdDice);
    btnRoll.removeEventListener('click', rollDice);
    btnRoll.style.cursor = 'not-allowed';
    btnHold.style.cursor = 'not-allowed';
}

function turnOnBtn() {
    btnHold.addEventListener('click', holdDice);
    btnRoll.addEventListener('click', rollDice);
    btnRoll.style.cursor = 'pointer';
    btnHold.style.cursor = 'pointer';
}


function showTurnScoreProgress(player) {
    let progressBlock = this.children[1].children[1];
    progressBlock.style.width = `${playersScoreObj[player] + turnScore}%`;
}

function rotatePig() {
    document.querySelector('.game__icon').classList.add('active');
    setTimeout(() => {
        document.querySelector('.game__icon').classList.remove('active');
    }, 1100);

}

document.querySelector('.modal-window__button').onclick = closeModalWindow;

function closeModalWindow() {
    if (!document.querySelector('.modal-window').classList.contains('hide')) {
        document.querySelector('.modal-window').classList.add('hide');
        document.querySelector('.modal-wrap').classList.add('hide');
        if (playersScoreObj['1'] + turnScore >= 100 || playersScoreObj['2'] + turnScore >= 100) {
            startNewGame();
        }
    }
}

function showModalWindow(text) {
    document.querySelector('.modal-window').classList.remove('hide');
    document.querySelector('.modal-wrap').classList.remove('hide');
    let modalText = document.querySelector('.modal-window__text');
    modalText.innerHTML = text;
}

function endGame(player) {
    let modalText = (+player === 1) ? `You win 🥳` : `Your opponent win <br/>You are 🐷`;
    showModalWindow(modalText);
    if (multiplayerFlag && myTurn) wsSendEndGame(player);
}

function startNewGame() {
    myTurn = true;
    multiplayerFlag = false;
    multiplayerRoom = '';
    turnScore = 0;
    document.querySelector('.game__turn').textContent = 'Your Turn';
    playersScoreObj = {
        1: 0,
        2: 0
    }

    updateScoreProgress.call(myScoreBlock, 1);
    showTurnScoreProgress.call(myScoreBlock, 1);
    updateScoreProgress.call(oponentScoreBlock, 2);
    showTurnScoreProgress.call(oponentScoreBlock, 2);

    document.querySelector('.game__turn-score').textContent = `0`;
    let gameBtn = document.querySelectorAll('.game-mode__button');
    gameBtn[0].classList.add('active');
    gameBtn[1].classList.remove('active');
    turnOnBtn();
}


function startMultiplayerGame(data) {
    myTurn = (myPlayerId == data.turn) ? true : false;
    turnScore = 0;
    prevRollDice = false;
    document.querySelector('.game__turn').textContent = myTurn ? 'Your Turn' : 'Opponet Turn';
    document.querySelector('.game__turn-score').textContent = `0`;
    playersScoreObj = {
        1: 0,
        2: 0
    }

    if (myTurn) {
        timeoutIdAFK = setTimeout(() => checkMyAFK(), 10 * 1000);
        turnOnBtn();
    } else {
        turnOfBtn();
    }

    updateScoreProgress.call(myScoreBlock, 1);
    showTurnScoreProgress.call(myScoreBlock, 1);
    updateScoreProgress.call(oponentScoreBlock, 2);
    showTurnScoreProgress.call(oponentScoreBlock, 2);
}


document.querySelectorAll('.game-mode__button').forEach(elem => elem.onclick = changeGameMode);

function changeGameMode() {
    multiplayerFlag = (this.textContent === 'Singleplayer') ? false : true;
    document.querySelectorAll('.game-mode__button').forEach(elem => elem.classList.remove('active'));
    this.classList.add('active');
    if (multiplayerFlag) findPlayer();
}

let modalIntervalID;

function findPlayer() {
    showModalMultiplayer();
    const modalTime = document.querySelector('.modal-multiplayer__time');
    modalTime.textContent = '10';

    modalIntervalID = setInterval(() => {
        let count = +modalTime.textContent - 1;
        modalTime.textContent = count;
        if (count === 0) {
            clearInterval(modalIntervalID);
            closeModalMultiplayer();
            startNewGame();
            showModalWindow('We can`t find player<br/>Please try latter');
        };
    }, 1000);

    wsSendFindRoom();
}

function showModalMultiplayer() {
    document.querySelector('.modal-multiplayer').classList.remove('hide');
    document.querySelector('.modal-wrap').classList.remove('hide');
}

function closeModalMultiplayer() {
    document.querySelector('.modal-multiplayer').classList.add('hide');
    document.querySelector('.modal-wrap').classList.add('hide');
}

function checkMyAFK() {
    let text = 'We switch your turn<br/>Because you have not been active for the last 10 seconds';
    if (multiplayerFlag && myTurn && turnScore == 0) {
        showModalWindow(text);
        holdDice();
        setTimeout(() => closeModalWindow(), 2000);
    }
    else if (multiplayerFlag && myTurn && prevRollDice) {
        showModalWindow(text);
        holdDice();
        setTimeout(() => closeModalWindow(), 3000);
    }
}

function opponentDisconected() {
    let modalText = `Your opponent disconected😔`;
    multiplayerRoom = '';
    startNewGame();
    showModalWindow(modalText);

}

function sleep(ms) {
    ms += new Date().getTime();
    while (new Date() < ms){}
} 


// server conection 

const myWs = new WebSocket('ws://pig-game-server.herokuapp.com/');

myWs.onopen = function () {
    myWs.send(JSON.stringify({ action: 'setId', id: myPlayerId }))
    console.log('До серверу підключено');
};

myWs.onmessage = function (message) {
    let data = JSON.parse(message.data);
    let action = data.action;
    if (action == 'findRoom') {
        wsGetFindRoom(data);
    }
    else if (action === 'rollDice') {
        wsGetRollDice(data);
    }
    else if (action === 'switchTurn') {
        wsGetSwitchTurn(data);
    }
    else if (action === 'endGame') {
        wsGetEndGame();
    }
    else if (action === 'opponentDisconected') {
        opponentDisconected();
    }
};

function wsSendFindRoom() {
    let message = JSON.stringify({ action: 'findRoom' });
    myWs.send(message);
}

function wsSendRollDice() {
    let message = JSON.stringify({ action: 'rollDice', room: multiplayerRoom, turnScore, diceId: newDiceId });
    myWs.send(message);
}

function wsSendSwitchTurn() {
    let message = JSON.stringify({ action: 'switchTurn', room: multiplayerRoom, score: playersScoreObj['1'] });
    myWs.send(message);
}

function wsSendEndGame(player) {
    let message = JSON.stringify({ action: 'endGame', room: multiplayerRoom });
    myWs.send(message);
}

function wsGetFindRoom(data) {
    if (data.room !== '-1') {
        multiplayerRoom = data.room;
        clearInterval(modalIntervalID);
        closeModalMultiplayer();
        startMultiplayerGame(data);
    }
}

function wsGetRollDice(data) {
    document.querySelector(`.dice.active`).classList.remove('active');
    const diceBlock = document.querySelector(`.dice[data-diceid='${data.diceId}']`);
    addRollAnimation.call(diceBlock);
    diceBlock.classList.add('active');
    setTimeout(() => {
        removeRollAnimation.call(diceBlock);
    }, 300);

    (data.diceId !== 1) ? updateTurnScore(data.diceId) : rotatePig();
}

function wsGetSwitchTurn(data) {
    playersScoreObj['2'] = data.opponentScore;
    turnScore = 0;
    document.querySelector('.game__turn-score').textContent = `${turnScore}`;
    document.querySelector('.game__turn').textContent = 'Your Turn';;

    oponentScoreBlock.children[1].children[1].style.width = '0%';
    turnOnBtn();

    playersScoreObj['2'] = data.opponentScore;
    updateScoreProgress.call(oponentScoreBlock, 2);
    updateTurnScore(turnScore);
    timeoutIdAFK = setTimeout(() => checkMyAFK(), 10 * 1000);
    turnOnBtn();
    myTurn = true;
}

function wsGetEndGame() {
    playersScoreObj['2'] = 101;
    endGame(2);
}