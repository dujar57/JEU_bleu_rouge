// Connexion Socket.IO
const socket = io();

// Variables globales
let currentGameCode = null;
let myRole = null;
let myTeam = null;
let myMunitions = 0;

// ==========================================
// GESTION DES Ãƒâ€°CRANS
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
// CRÃƒâ€°ER UNE PARTIE
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
    
    // RÃƒÂ©cupÃƒÂ©rer l'userId si l'utilisateur est connectÃƒÂ©
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
// MISE Ãƒâ‚¬ JOUR DU LOBBY
// ==========================================

function updateLobby(gameData) {
    const lobbyCode = document.getElementById('lobby-code');
    const lobbyPlayers = document.getElementById('lobby-players');
    const countText = document.getElementById('count-text');
    const startBtn = document.getElementById('start-game-btn');
    
    lobbyCode.textContent = currentGameCode;
    
    // Met ÃƒÂ  jour le compteur de joueurs
    const playerCount = gameData.players.length;
    countText.textContent = `${playerCount} joueur${playerCount > 1 ? 's' : ''} ${playerCount < 4 ? '(minimum 4)' : ''}`;
    
    // Active/dÃƒÂ©sactive le bouton Start
    startBtn.disabled = playerCount < 4;
    
    // Affiche les joueurs
    lobbyPlayers.innerHTML = '';
    gameData.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-avatar">Ã°Å¸â€˜Â¤</div>
            <div class="player-name">${escapeHtml(player.pseudo)}</div>
            <div class="player-info">${escapeHtml(player.realLifeInfo)}</div>
        `;
        lobbyPlayers.appendChild(playerCard);
    });
}

// ==========================================
// MISE Ãƒâ‚¬ JOUR DU JEU
// ==========================================

function updateGame(gameData) {
    const gameCode = document.getElementById('game-code');
    const gameTimer = document.getElementById('game-timer');
    const gamePlayers = document.getElementById('game-players');
    
    gameCode.textContent = currentGameCode;
    
    // Met ÃƒÂ  jour le timer
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
            <div class="game-player-avatar">${player.isAlive ? 'Ã°Å¸â€˜Â¤' : 'Ã°Å¸â€™â‚¬'}</div>
            <div class="game-player-name">${escapeHtml(player.pseudo)}</div>
            <div class="game-player-info">${escapeHtml(player.realLifeInfo)}</div>
            <div class="player-status ${player.isAlive ? 'alive' : 'dead'}">
                ${player.isAlive ? 'En vie' : 'Ãƒâ€°liminÃƒÂ©'}
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
            showNotification('Temps ÃƒÂ©coulÃƒÂ© !', 'error');
        }
    }, 1000);
}

// ==========================================
// AFFICHAGE DU RÃƒâ€LE
// ==========================================

function displayRole(data) {
    myTeam = data.team;
    myRole = data.role;
    myMunitions = data.munitions || 0;

    const teamBadge = document.getElementById('team-badge');
    const roleName = document.getElementById('role-name');
    const munitionsDiv = document.getElementById('role-munitions');
    const munitionsCount = document.getElementById('munitions-count');

    // Affiche l'Ã©quipe
    teamBadge.textContent = data.team === 'bleu' ? 'Ã‰QUIPE BLEUE' : 'Ã‰QUIPE ROUGE';
    teamBadge.className = 'team-badge ' + data.team;

    // Affiche le rÃ´le
    const roleNames = {
        'representant': 'ðŸ‘‘ ReprÃ©sentant',
        'tueur': 'ðŸ”« Tueur',
        'lambda': 'ðŸ‘¤ Lambda'
    };
    roleName.textContent = roleNames[data.role] || data.role;

    // Affiche les munitions si tueur
    if (data.role === 'tueur' && data.munitions > 0) {
        munitionsDiv.style.display = 'flex';
        munitionsCount.textContent = data.munitions;
    } else {
        munitionsDiv.style.display = 'none';
    }

    let notification = `Vous Ãªtes ${roleNames[data.role]} de l'Ã©quipe ${data.team === 'bleu' ? 'BLEUE' : 'ROUGE'} !`;
    
    // Si le joueur est amoureux, afficher l'information
    if (data.isLover && data.loverInfo) {
        notification += `\n\nðŸ’• Vous Ãªtes AMOUREUX de ${data.loverInfo.pseudo} (Ã©quipe ${data.loverInfo.team === 'bleu' ? 'BLEUE' : 'ROUGE'}) !\nSi l'un de vous meurt, l'autre mourra de chagrin. ðŸ’”`;
        
        // CrÃ©er un badge amoureux dans l'interface
        const roleContainer = document.getElementById('role-info');
        if (roleContainer && !document.getElementById('lover-badge')) {
            const loverBadge = document.createElement('div');
            loverBadge.id = 'lover-badge';
            loverBadge.className = 'lover-badge';
            loverBadge.innerHTML = `ðŸ’• Amoureux de <strong>${data.loverInfo.pseudo}</strong> (${data.loverInfo.team})`;
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
    
    showNotification(`Vous ÃƒÂªtes ${roleNames[data.role]} de l'ÃƒÂ©quipe ${data.team === 'bleu' ? 'BLEUE' : 'ROUGE'} !`, 'success');
}

// ==========================================
// SÃƒâ€°CURITÃƒâ€°
// ==========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// Ãƒâ€°VÃƒâ€°NEMENTS SOCKET.IO
// ==========================================

// Partie crÃƒÂ©ÃƒÂ©e
socket.on('game_created', (data) => {
    currentGameCode = data.gameCode;
    showLobby();
    showNotification('Partie crÃƒÂ©ÃƒÂ©e avec succÃƒÂ¨s !', 'success');
});

// Partie rejointe
socket.on('game_joined', (data) => {
    currentGameCode = data.gameCode;
    showLobby();
    showNotification('Vous avez rejoint la partie !', 'success');
});

// Mise ÃƒÂ  jour de la salle
socket.on('update_room', (gameData) => {
    if (gameData.status === 'LOBBY') {
        updateLobby(gameData);
    } else if (gameData.status === 'PLAYING') {
        updateGame(gameData);
        showGame();
    }
});

// RÃƒÂ´le attribuÃƒÂ©
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
    // Gestion de la touche EntrÃƒÂ©e dans les formulaires
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
    
    console.log('Ã°Å¸Å½Â® Application Bleu vs Rouge initialisÃƒÂ©e');
});

}

// Afficher/Masquer les rÃ¨gles du jeu
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