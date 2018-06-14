/**
 * DATA MODEL CONTROLLER
 */
const dataController = (() => {

    class Player {
        constructor() {
            this.clean();
        }

        score() {
            let score = this.scoreList.reduce((s, e) => s + e, 0);
            let numberOfAces = this.cards.reduce((count, e) => count += e.includes('A') ? 1 : 0, 0);

            while (score > 21 && numberOfAces) {
                score -= 10;
                numberOfAces--;
            }

            return score;
        }

        newCard() {
            const highFace = { '11': 'A', '12': 'J', '13': 'Q', '14': 'K' };
            const symbol = { '0': 'H', '1': 'D', '2': 'C', '3': 'S' };
            let randomFace, randomSymbol, newCard;

            const assignCard = () => {
                randomFace = Math.floor(Math.random() * 13 + 2);
                randomSymbol = Math.floor(Math.random() * 4);
                return {
                    card: `${randomFace > 10 ? highFace[randomFace] : randomFace}${symbol[randomSymbol]}`,
                    points: randomFace > 11 ? 10 : (randomFace === 11 ? 11 : randomFace)
                }
            };

            newCard = assignCard();

            while (gameState.player.cards.includes(newCard.card) || gameState.dealer.cards.includes(newCard.card)) {
                newCard = assignCard();
            }

            this.cards.push(newCard.card);
            this.scoreList.push(newCard.points);

            return newCard;
        }

        clean() {
            this.cards = [];
            this.scoreList = [];
        }
    }

    const gameState = {
        dealer: new Player(),
        player: new Player()
    };

    return {
        newCard: (turn) => gameState[turn].newCard(),

        getScore: (turn) => gameState[turn].score(),

        checkGame: () => {
            const playerScore = gameState.player.score(), dealerScore = gameState.dealer.score();

            // player busts
            if (playerScore > 21) return 'dealer';

            // dealer's turn
            if (gameState.dealer.cards.length > 1) {
                if (dealerScore === playerScore) {
                    return 'tie';
                }
                if (playerScore > dealerScore || dealerScore > 21) {
                    return 'player';
                }

                return 'dealer';
            }

            // no winner yet
            return false;
        },

        clean: () => {
            gameState.dealer.clean();
            gameState.player.clean();
        },

        test: () => gameState
    };
})();


/**
 * VIEW
 */
const UIController = (() => {

    const DOM = {
        dealer: document.querySelector('.dealer'),
        player: document.querySelector('.player'),
        logSection: document.querySelector('.log'),
        hitBtn: document.querySelector('.hit'),
        standBtn: document.querySelector('.stand'),
        newGame: document.querySelector('.new'),
        cardsBox: document.querySelectorAll('.cards')
    };

    return {
        getDOM: () => DOM,

        renderNewCard: (turn, card) => {
            const markup = `<img src="img/cards/${card.card}.png" alt="card">`;
            DOM[turn].insertAdjacentHTML('beforeend', markup);
        },

        renderHoleCard: () => DOM.dealer.insertAdjacentHTML('beforeend', '<img class="hole-card" src="img/cards/green_back.png" alt="hole card">'),

        turnHoleCard: function (newCard) {
            document.querySelector('.hole-card').remove();
            this.renderNewCard('dealer', newCard);
        },

        renderMessage: (message, type) => DOM.logSection.innerHTML += `<p class="${type}">${message}</p>`,


        disableButtons: () => {
            DOM.hitBtn.style.visibility = 'hidden';
            DOM.standBtn.style.visibility = 'hidden';
        },

        clean: () => {
            // Clean cards
            Array.from(DOM.cardsBox).forEach(e => e.innerHTML = '');

            // Clean log
            DOM.logSection.innerHTML = '';

            // Make buttons visible
            DOM.hitBtn.style.visibility = 'visible';
            DOM.standBtn.style.visibility = 'visible';
        },

        test: () => DOM
    };

})();


/**
 * GENERAL APP CONTROLLER
 */
const Controller = ((dataCtrl, UICtrl) => {

    const dealNewHand = () => {
        // 1. Dealer cards
        UICtrl.renderNewCard('dealer', dataCtrl.newCard('dealer'));
        UICtrl.renderHoleCard();
        // 2. Player cards
        UICtrl.renderNewCard('player', dataCtrl.newCard('player'));
        UICtrl.renderNewCard('player', dataCtrl.newCard('player'));
        // 3. Render scores in message section
        UICtrl.renderMessage(`Dealer has ${dataCtrl.getScore('dealer')}`);
        UICtrl.renderMessage(`Player has ${dataCtrl.getScore('player')}`);
    };

    const checkGameStatus = () => {
        const check = dataCtrl.checkGame();

        if (check) {

            UICtrl.disableButtons();
            switch (check) {
                case 'player':
                    UICtrl.renderMessage('Player won!', 'win');
                    break;
                case 'dealer':
                    UICtrl.renderMessage('Player lost :(', 'lose');
                    break;
                case 'tie':
                    UICtrl.renderMessage('It\'s a tie', 'tie');
            }
        }
    };

    const dealerTurn = () => {
        // Disable player's button and announce dealer's turn
        UICtrl.disableButtons();
        UICtrl.renderMessage('Dealer\'s turn', 'action-message');

        // Turn hole card
        UICtrl.turnHoleCard(dataCtrl.newCard('dealer'));
        UICtrl.renderMessage(`Dealer has ${dataCtrl.getScore('dealer')}`);

        // Dealer hits until score is over 17
        let dealerScore = dataCtrl.getScore('dealer');
        while (dealerScore < 17) {
            UICtrl.renderNewCard('dealer', dataCtrl.newCard('dealer'));
            dealerScore = dataCtrl.getScore('dealer');
            UICtrl.renderMessage(`Dealer has ${dealerScore}`);
        }

        // Check game
        checkGameStatus();
    };

    const hitBtnAction = () => {
        UICtrl.renderMessage('Hit me!', 'action-message');

        UICtrl.renderNewCard('player', dataCtrl.newCard('player'));
        UICtrl.renderMessage(`Player has ${dataCtrl.getScore('player')}`);

        if (dataCtrl.getScore('player') === 21) {
            dealerTurn();
        } else {
            checkGameStatus();
        }
    }

    const standBtnAction = () => {
        UICtrl.renderMessage('Stand', 'action-message');
        dealerTurn();
    }

    const setupEventListeners = () => {
        const elem = UICtrl.getDOM();

        // Setup HIT button
        elem.hitBtn.addEventListener('click', hitBtnAction);

        // Setup STAND button
        elem.standBtn.addEventListener('click', standBtnAction);

        // Setup NEW GAME button
        elem.newGame.addEventListener('click', Controller.init);
    };


    return {
        init: () => {

            // 1. Clean
            UICtrl.clean();
            dataCtrl.clean();

            // 2. Deal new hand
            dealNewHand();

            // 3. Setup event listeners
            setupEventListeners();
        }
    };

})(dataController, UIController);

Controller.init();