// Connexion Socket.IO
const socket = io();

// Variables globales
let currentGameCode = null;
let myRole = null;
let myTeam = null;
let myMunitions = 0;

// ==========================================
// GESTION DES ÃƒÆ’Ã¢â‚¬Â°CRANS
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showWelcome() {
    showScreen('screen-welcome');
}

function showCreateGame() {
    showScreen('screen-create');
}

function showJoinGame() {
    showScreen('screen-join');
}

function showLobby() {
    showScreen('screen-lobby');
}

function showGame() {
    showScreen('screen-game');
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ==========================================
// CRÃƒÆ’Ã¢â‚¬Â°ER UNE PARTIE
// ==========================================

function createGame() {
    const pseudo = document.getElementById('create-pseudo').value.trim();
    const realLifeInfo = document.getElementById('create-info').value.trim();
    
    if (!pseudo) {
        showNotification('Veuillez entrer un pseudo', 'error');
        return;
    }
    
    if (!realLifeInfo) {
        showNotification('Veuillez entrer une information IRL', 'error');
        return;
    }
    
    // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer l'userId si l'utilisateur est connectÃƒÆ’Ã‚Â©
    const userId = window.getCurrentUserId ? window.getCurrentUserId() : null;

    socket.emit('create_game', { pseudo, realLifeInfo, userId });
// ==========================================

function joinGame() {
    const gameCode = document.getElementById('join-code').value.trim().toUpperCase();
    const pseudo = document.getElementById('join-pseudo').value.trim();
    const realLifeInfo = document.getElementById('join-info').value.trim();
    
    if (!gameCode || gameCode.length !== 4) {
        showNotification('Code de partie invalide (4 lettres)', 'error');
        return;
    }
    
    if (!pseudo) {
        showNotification('Veuillez entrer un pseudo', 'error');
        return;
    }
    
    if (!realLifeInfo) {
        showNotification('Veuillez entrer une information IRL', 'error');
        return;
    }
    
    socket.emit('join_game', { gameCode, pseudo, realLifeInfo });
}

// ==========================================
// LANCER LA PARTIE
// ==========================================

function startGame() {
    if (!currentGameCode) return;
    socket.emit('start_game', { gameCode: currentGameCode });
}

// ==========================================
// MISE ÃƒÆ’Ã¢â€šÂ¬ JOUR DU LOBBY
// ==========================================

function updateLobby(gameData) {
    const lobbyCode = document.getElementById('lobby-code');
    const lobbyPlayers = document.getElementById('lobby-players');
    const countText = document.getElementById('count-text');
    const startBtn = document.getElementById('start-game-btn');
    
    lobbyCode.textContent = currentGameCode;
    
    // Met ÃƒÆ’Ã‚Â  jour le compteur de joueurs
    const playerCount = gameData.players.length;
    countText.textContent = `${playerCount} joueur${playerCount > 1 ? 's' : ''} ${playerCount < 4 ? '(minimum 4)' : ''}`;
    
    // Active/dÃƒÆ’Ã‚Â©sactive le bouton Start
    startBtn.disabled = playerCount < 4;
    
    // Affiche les joueurs
    lobbyPlayers.innerHTML = '';
    gameData.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-avatar">ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â¤</div>
            <div class="player-name">${escapeHtml(player.pseudo)}</div>
            <div class="player-info">${escapeHtml(player.realLifeInfo)}</div>
        `;
        lobbyPlayers.appendChild(playerCard);
    });
}

// ==========================================
// MISE ÃƒÆ’Ã¢â€šÂ¬ JOUR DU JEU
// ==========================================

function updateGame(gameData) {
    const gameCode = document.getElementById('game-code');
    const gameTimer = document.getElementById('game-timer');
    const gamePlayers = document.getElementById('game-players');
    
    gameCode.textContent = currentGameCode;
    
    // Met ÃƒÆ’Ã‚Â  jour le timer
    if (gameData.nextEventTime) {
        updateTimer(gameData.nextEventTime);
    }
    
    // Affiche les joueurs
    gamePlayers.innerHTML = '';
    gameData.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'game-player-card';
        if (!player.isAlive) {
            playerCard.classList.add('dead');
        }
        if (player.hasVoted) {
            playerCard.classList.add('voted');
        }
        
        playerCard.innerHTML = `
            <div class="game-player-avatar">${player.isAlive ? 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â¤' : 'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã¢â€šÂ¬'}</div>
            <div class="game-player-name">${escapeHtml(player.pseudo)}</div>
            <div class="game-player-info">${escapeHtml(player.realLifeInfo)}</div>
            <div class="player-status ${player.isAlive ? 'alive' : 'dead'}">
                ${player.isAlive ? 'En vie' : 'ÃƒÆ’Ã¢â‚¬Â°liminÃƒÆ’Ã‚Â©'}
            </div>
        `;
        gamePlayers.appendChild(playerCard);
    });
}

// ==========================================
// TIMER
// ==========================================

let timerInterval = null;

function updateTimer(endTime) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        const timerDisplay = document.getElementById('game-timer');
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining === 0) {
            clearInterval(timerInterval);
            showNotification('Temps ÃƒÆ’Ã‚Â©coulÃƒÆ’Ã‚Â© !', 'error');
        }
    }, 1000);
}

// ==========================================
// AFFICHAGE DU RÃƒÆ’Ã¢â‚¬ÂLE
// ==========================================

function displayRole(data) {
    myAnonymousNumber = data.anonymousNumber;
    document.getElementById('your-number').textContent = 'Joueur ' + data.anonymousNumber;
    myTeam = data.team;
    myRole = data.role;
    myMunitions = data.munitions || 0;

    const teamBadge = document.getElementById('team-badge');
    const roleName = document.getElementById('role-name');
    const munitionsDiv = document.getElementById('role-munitions');
    const munitionsCount = document.getElementById('munitions-count');

    // Affiche l'ÃƒÂ©quipe
    teamBadge.textContent = data.team === 'bleu' ? 'Ãƒâ€°QUIPE BLEUE' : 'Ãƒâ€°QUIPE ROUGE';
    teamBadge.className = 'team-badge ' + data.team;

    // Affiche le rÃƒÂ´le
    const roleNames = {
        'representant': 'Ã°Å¸â€˜â€˜ ReprÃƒÂ©sentant',
        'tueur': 'Ã°Å¸â€Â« Tueur',
        'lambda': 'Ã°Å¸â€˜Â¤ Lambda'
    };
    roleName.textContent = roleNames[data.role] || data.role;

    // Affiche les munitions si tueur
    if (data.role === 'tueur' && data.munitions > 0) {
        munitionsDiv.style.display = 'flex';
        munitionsCount.textContent = data.munitions;
    } else {
        munitionsDiv.style.display = 'none';
    }

    let notification = `Vous ÃƒÂªtes ${roleNames[data.role]} de l'ÃƒÂ©quipe ${data.team === 'bleu' ? 'BLEUE' : 'ROUGE'} !`;
    
    // Si le joueur est amoureux, afficher l'information
    if (data.isLover && data.loverInfo) {
        notification += `\n\nÃ°Å¸â€™â€¢ Vous ÃƒÂªtes AMOUREUX de ${data.loverInfo.pseudo} (ÃƒÂ©quipe ${data.loverInfo.team === 'bleu' ? 'BLEUE' : 'ROUGE'}) !\nSi l'un de vous meurt, l'autre mourra de chagrin. Ã°Å¸â€™â€`;
        
        // CrÃƒÂ©er un badge amoureux dans l'interface
        const roleContainer = document.getElementById('role-info');
        if (roleContainer && !document.getElementById('lover-badge')) {
            const loverBadge = document.createElement('div');
            loverBadge.id = 'lover-badge';
            loverBadge.className = 'lover-badge';
            loverBadge.innerHTML = `Ã°Å¸â€™â€¢ Amoureux de <strong>${data.loverInfo.pseudo}</strong> (${data.loverInfo.team})`;
            roleContainer.appendChild(loverBadge);
        }
    }
    
    showNotification(notification, 'success');
}
;
    roleName.textContent = roleNames[data.role] || data.role;
    
    // Affiche les munitions si tueur
    if (data.role === 'tueur' && data.munitions > 0) {
        munitionsDiv.style.display = 'flex';
        munitionsCount.textContent = data.munitions;
    } else {
        munitionsDiv.style.display = 'none';
    }
    
    showNotification(`Vous ÃƒÆ’Ã‚Âªtes ${roleNames[data.role]} de l'ÃƒÆ’Ã‚Â©quipe ${data.team === 'bleu' ? 'BLEUE' : 'ROUGE'} !`, 'success');
}

// ==========================================
// SÃƒÆ’Ã¢â‚¬Â°CURITÃƒÆ’Ã¢â‚¬Â°
// ==========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// ÃƒÆ’Ã¢â‚¬Â°VÃƒÆ’Ã¢â‚¬Â°NEMENTS SOCKET.IO
// ==========================================

// Partie crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©e
socket.on('game_created', (data) => {
    currentGameCode = data.gameCode;
    showLobby();
    showNotification('Partie crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©e avec succÃƒÆ’Ã‚Â¨s !', 'success');
});

// Partie rejointe
socket.on('game_joined', (data) => {
    currentGameCode = data.gameCode;
    showLobby();
    showNotification('Vous avez rejoint la partie !', 'success');
});

// Mise ÃƒÆ’Ã‚Â  jour de la salle
socket.on('update_room', (gameData) => {
    if (gameData.status === 'LOBBY') {
        updateLobby(gameData);
    } else if (gameData.status === 'PLAYING') {
        updateGame(gameData);
        showGame();
    }
});

// RÃƒÆ’Ã‚Â´le attribuÃƒÆ’Ã‚Â©
socket.on('your_role', (data) => {
    displayRole(data);
});

// Erreur
socket.on('error', (data) => {
    showNotification(data.message, 'error');
});

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Gestion de la touche EntrÃƒÆ’Ã‚Â©e dans les formulaires
    document.getElementById('create-pseudo').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('create-info').focus();
    });
    
    document.getElementById('create-info').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createGame();
    });
    
    document.getElementById('join-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('join-pseudo').focus();
    });
    
    document.getElementById('join-pseudo').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('join-info').focus();
    });
    
    document.getElementById('join-info').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    
    // Auto-majuscules pour le code de partie
    document.getElementById('join-code').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    
    console.log('ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â® Application Bleu vs Rouge initialisÃƒÆ’Ã‚Â©e');
});

}

// Afficher/Masquer les rÃƒÂ¨gles du jeu
function toggleRules() {
    const rulesContent = document.getElementById('rules-content');
    const rulesBtn = document.querySelector('.btn-rules');
    
    if (rulesContent.classList.contains('show')) {
        rulesContent.classList.remove('show');
        rulesBtn.classList.remove('active');
    } else {
        rulesContent.classList.add('show');
        rulesBtn.classList.add('active');
    }
}

// Variables pour le chat
let myAnonymousNumber = null;

// Recevoir les messages du chat
socket.on('chat_message', (data) => {
    displayChatMessage(data);
});

// Afficher un message dans le chat
function displayChatMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    // Marquer les messages du joueur actuel
    if (data.playerNumber === myAnonymousNumber) {
        messageDiv.classList.add('own-message');
    }

    const time = new Date(data.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="chat-message-header">
            <span class="chat-player">Joueur ${data.playerNumber}</span>
            <span class="chat-time">${time}</span>
        </div>
        <div class="chat-text">${escapeHtml(data.message)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    
    // Scroll automatique vers le bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Envoyer un message
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message || !currentGameCode) return;

    socket.emit('chat_message', {
        gameCode: currentGameCode,
        message: message
    });

    input.value = '';
}

// Fonction utilitaire pour Ã©chapper le HTML (sÃ©curitÃ©)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// GÃ©rer la touche EntrÃ©e dans le chat
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
