// -*- coding: utf-8 -*-
// @charset "UTF-8"
// auth-ui.js - Gestion de l'interface d'authentification
const API_URL = window.location.origin;
let currentUser = null;

// Styles pour la section utilisateur
const authStyles = `
<style>
    .user-section {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        background: rgba(255,255,255,0.1);
        padding: 10px 20px;
        border-radius: 25px;
        backdrop-filter: blur(10px);
        z-index: 1000;
    }
    .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    .user-name {
        color: white;
        font-weight: bold;
        font-size: 14px;
    }
    .user-stats {
        color: #aaa;
        font-size: 12px;
    }
    .btn-logout {
        background: rgba(220, 53, 69, 0.8);
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 15px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s;
    }
    .btn-logout:hover {
        background: rgba(220, 53, 69, 1);
    }
    .auth-buttons {
        display: flex;
        gap: 10px;
    }
    .btn-login, .btn-register {
        padding: 10px 20px;
        border-radius: 20px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s;
    }
    .btn-login {
        background: rgba(255,255,255,0.2);
        color: white;
    }
    .btn-register {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .btn-login:hover {
        background: rgba(255,255,255,0.3);
    }
    .btn-register:hover {
        transform: translateY(-2px);
    }
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', authStyles);

// Créer la section utilisateur
const userSection = document.createElement('div');
userSection.id = 'userSection';
userSection.className = 'user-section';
document.body.insertBefore(userSection, document.body.firstChild);

// Vérifier si l'utilisateur est connecté au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
        displayUserInfo();
    } else {
        displayAuthButtons();
    }
}

function displayUserInfo() {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = `
        <div class="user-info">
            <div class="user-name">👤 ${currentUser.username}</div>
            <div class="user-stats">🎮 ${currentUser.gamesPlayed} parties • 🏆 ${currentUser.gamesWon} victoires</div>
        </div>
        <button class="btn-logout" onclick="logout()">Déconnexion</button>
    `;
}

function displayAuthButtons() {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = `
        <div class="auth-buttons">
            <button class="btn-login" onclick="window.location.href='login.html'">Connexion</button>
            <button class="btn-register" onclick="window.location.href='register.html'">Inscription</button>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    displayAuthButtons();
    alert('Vous avez été déconnecté');
}

// Fonction pour obtenir l'userId actuel
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// Exporter pour utilisation globale
window.getCurrentUserId = getCurrentUserId;
window.currentUser = currentUser;
window.logout = logout;
