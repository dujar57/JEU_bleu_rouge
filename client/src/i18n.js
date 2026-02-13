import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traductions
const resources = {
  fr: {
    translation: {
      // Titre principal
      "game.title.blue": "BLEU",
      "game.title.vs": "VS",
      "game.title.red": "ROUGE",
      
      // Home / Menu principal
      "home.logout": "Déconnexion réussie !",
      "home.fillFields": "Veuillez remplir tous les champs",
      "home.createGame": "Créer une partie",
      "home.joinGame": "Rejoindre une partie",
      "home.login": "Se connecter",
      "home.register": "S'inscrire",
      "home.pseudo": "Pseudo",
      "home.pseudoPlaceholder": "Votre pseudo de jeu",
      "home.realLifeInfo": "Informations IRL",
      "home.realLifeInfoPlaceholder": "Nom, prénom, classe...",
      "home.gameCode": "Code de la partie",
      "home.gameCodePlaceholder": "Ex: ABCD12",
      "home.back": "Retour",
      
      // Login
      "login.title": "CONNEXION",
      "login.email": "Email",
      "login.password": "Mot de passe",
      "login.submit": "Se connecter",
      "login.noAccount": "Pas encore de compte ?",
      "login.createAccount": "Créer un compte",
      "login.success": "Connexion réussie !",
      "login.error": "Erreur de connexion",
      "login.networkError": "Erreur réseau - Veuillez réessayer",
      
      // Register
      "register.title": "INSCRIPTION",
      "register.username": "Nom d'utilisateur",
      "register.email": "Email",
      "register.password": "Mot de passe",
      "register.confirmPassword": "Confirmer le mot de passe",
      "register.submit": "S'inscrire",
      "register.alreadyAccount": "Déjà un compte ?",
      "register.login": "Se connecter",
      "register.passwordMismatch": "Les mots de passe ne correspondent pas",
      "register.success": "Inscription réussie ! Vérifiez votre email.",
      "register.error": "Erreur d'inscription",
      "register.networkError": "Erreur réseau - Veuillez réessayer",
      
      // Lobby
      "lobby.gameCode": "Code de la partie",
      "lobby.players": "Joueurs",
      "lobby.you": "(Vous)",
      "lobby.duration": "DURÉE DE LA PARTIE",
      "lobby.duration.20min": "20 minutes",
      "lobby.duration.1h": "1 heure",
      "lobby.duration.6h": "6 heures",
      "lobby.duration.1day": "1 jour",
      "lobby.duration.2days": "2 jours",
      "lobby.duration.4days": "4 jours",
      "lobby.duration.5days": "5 jours",
      "lobby.duration.10days": "10 jours",
      "lobby.startGame": "Lancer la partie",
      "lobby.waitingPlayers": "En attente de joueurs (minimum 4)",
      "lobby.waitingHost": "En attente que l'hôte lance la partie...",
      "lobby.loading": "Chargement...",
      "lobby.traitors": "TRAÎTRES",
      "lobby.traitorsInfo": "Il y aura des traîtres dans cette partie !",
      "lobby.traitorsDescription": "Les traîtres semblent faire partie d'une équipe mais gagnent avec l'autre. Ils peuvent éliminer et voter.",
      
      // Game
      "game.initializing": "Initialisation du jeu...",
      "game.teamBlue": "ÉQUIPE BLEUE",
      "game.teamRed": "ÉQUIPE ROUGE",
      "game.traitors": "TRAÎTRES",
      "game.role.representant": "Représentant - Vous représentez votre équipe",
      "game.role.tueur": "Tueur - Vous avez le pouvoir d'éliminer",
      "game.role.lambda": "Membre Lambda - Vous êtes un membre normal",
      "game.yourRole": "VOTRE RÔLE",
      "game.yourTeam": "VOTRE ÉQUIPE",
      "game.nextEvent": "PROCHAIN ÉVÉNEMENT",
      "game.vote": "Vote",
      "game.elimination": "Élimination",
      "game.players": "JOUEURS",
      "game.alive": "Vivant",
      "game.eliminated": "Éliminé",
      "game.chat": "💬 CHAT",
      "game.chatPlaceholder": "Votre message...",
      "game.send": "Envoyer",
      "game.showChat": "Afficher Chat",
      "game.hideChat": "Masquer Chat",
      
      // Voting
      "vote.title": "PHASE DE VOTE",
      "vote.description": "Votez pour éliminer un joueur de votre équipe",
      "vote.selectPlayer": "Sélectionnez un joueur à éliminer :",
      "vote.confirm": "CONFIRMER LE VOTE",
      "vote.confirmed": "Vote enregistré !",
      "vote.waiting": "En attente des autres votes...",
      "vote.results": "RÉSULTAT DU VOTE",
      "vote.eliminated": "a été éliminé !",
      "vote.noElimination": "Aucune élimination ce tour.",
      
      // Game Ended
      "gameEnded.title": "PARTIE TERMINÉE",
      "gameEnded.winner": "VAINQUEUR",
      "gameEnded.blueWins": "L'ÉQUIPE BLEUE A GAGNÉ !",
      "gameEnded.redWins": "L'ÉQUIPE ROUGE A GAGNÉ !",
      "gameEnded.traitorsWin": "LES TRAÎTRES ONT GAGNÉ !",
      "gameEnded.survivors": "Survivants",
      "gameEnded.eliminated": "Éliminés",
      "gameEnded.rolesReveal": "RÉVÉLATION DES RÔLES",
      "gameEnded.returnHome": "Retour à l'accueil",
      
      // Account Menu
      "account.title": "MON COMPTE",
      "account.username": "Nom d'utilisateur",
      "account.email": "Email",
      "account.gamesPlayed": "Parties jouées",
      "account.gamesWon": "Parties gagnées",
      "account.winRate": "Taux de victoire",
      "account.profile": "Profil",
      "account.history": "Historique",
      "account.settings": "Paramètres",
      "account.logout": "Déconnexion",
      "account.close": "Fermer",
      
      // Settings
      "settings.title": "PARAMÈTRES",
      "settings.language": "Langue",
      "settings.french": "Français",
      "settings.english": "English",
      "settings.notifications": "Notifications",
      "settings.sound": "Sons",
      "settings.theme": "Thème",
      
      // Tutorial
      "tutorial.title": "TUTORIEL",
      "tutorial.close": "Fermer",
      
      // Verify Email
      "verifyEmail.title": "Vérifier votre email",
      "verifyEmail.instructions": "Entrez le code à 6 chiffres que vous avez reçu par email",
      "verifyEmail.codeLabel": "Code de vérification",
      "verifyEmail.verify": "Vérifier",
      "verifyEmail.verifying": "Vérification...",
      "verifyEmail.success": "Email vérifié avec succès !",
      "verifyEmail.redirecting": "Redirection en cours...",
      "verifyEmail.codeLength": "Le code doit contenir 6 chiffres",
      "verifyEmail.errorVerifying": "Erreur lors de la vérification",
      "verifyEmail.noCode": "Vous n'avez pas reçu de code ?",
      "verifyEmail.backToHome": "Retour à l'accueil",
      
      // Errors
      "error.connection": "Erreur de connexion",
      "error.network": "Erreur réseau",
      "error.unknown": "Erreur inconnue"
    }
  },
  en: {
    translation: {
      // Main title
      "game.title.blue": "BLUE",
      "game.title.vs": "VS",
      "game.title.red": "RED",
      
      // Home / Main menu
      "home.logout": "Logout successful!",
      "home.fillFields": "Please fill in all fields",
      "home.createGame": "Create Game",
      "home.joinGame": "Join Game",
      "home.login": "Login",
      "home.register": "Register",
      "home.pseudo": "Username",
      "home.pseudoPlaceholder": "Your game username",
      "home.realLifeInfo": "IRL Information",
      "home.realLifeInfoPlaceholder": "Name, class...",
      "home.gameCode": "Game Code",
      "home.gameCodePlaceholder": "Ex: ABCD12",
      "home.back": "Back",
      
      // Login
      "login.title": "LOGIN",
      "login.email": "Email",
      "login.password": "Password",
      "login.submit": "Login",
      "login.noAccount": "Don't have an account?",
      "login.createAccount": "Create an account",
      "login.success": "Login successful!",
      "login.error": "Login error",
      "login.networkError": "Network error - Please try again",
      
      // Register
      "register.title": "REGISTER",
      "register.username": "Username",
      "register.email": "Email",
      "register.password": "Password",
      "register.confirmPassword": "Confirm Password",
      "register.submit": "Register",
      "register.alreadyAccount": "Already have an account?",
      "register.login": "Login",
      "register.passwordMismatch": "Passwords do not match",
      "register.success": "Registration successful! Check your email.",
      "register.error": "Registration error",
      "register.networkError": "Network error - Please try again",
      
      // Lobby
      "lobby.gameCode": "Game Code",
      "lobby.players": "Players",
      "lobby.you": "(You)",
      "lobby.duration": "GAME DURATION",
      "lobby.duration.20min": "20 minutes",
      "lobby.duration.1h": "1 hour",
      "lobby.duration.6h": "6 hours",
      "lobby.duration.1day": "1 day",
      "lobby.duration.2days": "2 days",
      "lobby.duration.4days": "4 days",
      "lobby.duration.5days": "5 days",
      "lobby.duration.10days": "10 days",
      "lobby.startGame": "Start Game",
      "lobby.waitingPlayers": "Waiting for players (minimum 4)",
      "lobby.waitingHost": "Waiting for host to start the game...",
      "lobby.loading": "Loading...",
      "lobby.traitors": "TRAITORS",
      "lobby.traitorsInfo": "There will be traitors in this game!",
      "lobby.traitorsDescription": "Traitors appear to be on one team but win with the other. They can eliminate and vote.",
      
      // Game
      "game.initializing": "Initializing game...",
      "game.teamBlue": "BLUE TEAM",
      "game.teamRed": "RED TEAM",
      "game.traitors": "TRAITORS",
      "game.role.representant": "Representative - You represent your team",
      "game.role.tueur": "Killer - You have the power to eliminate",
      "game.role.lambda": "Regular Member - You are a normal member",
      "game.yourRole": "YOUR ROLE",
      "game.yourTeam": "YOUR TEAM",
      "game.nextEvent": "NEXT EVENT",
      "game.vote": "Vote",
      "game.elimination": "Elimination",
      "game.players": "PLAYERS",
      "game.alive": "Alive",
      "game.eliminated": "Eliminated",
      "game.chat": "💬 CHAT",
      "game.chatPlaceholder": "Your message...",
      "game.send": "Send",
      "game.showChat": "Show Chat",
      "game.hideChat": "Hide Chat",
      
      // Voting
      "vote.title": "VOTING PHASE",
      "vote.description": "Vote to eliminate a player from your team",
      "vote.selectPlayer": "Select a player to eliminate:",
      "vote.confirm": "CONFIRM VOTE",
      "vote.confirmed": "Vote registered!",
      "vote.waiting": "Waiting for other votes...",
      "vote.results": "VOTE RESULTS",
      "vote.eliminated": "has been eliminated!",
      "vote.noElimination": "No elimination this round.",
      
      // Game Ended
      "gameEnded.title": "GAME OVER",
      "gameEnded.winner": "WINNER",
      "gameEnded.blueWins": "BLUE TEAM WINS!",
      "gameEnded.redWins": "RED TEAM WINS!",
      "gameEnded.traitorsWin": "TRAITORS WIN!",
      "gameEnded.survivors": "Survivors",
      "gameEnded.eliminated": "Eliminated",
      "gameEnded.rolesReveal": "ROLES REVEALED",
      "gameEnded.returnHome": "Return Home",
      
      // Account Menu
      "account.title": "MY ACCOUNT",
      "account.username": "Username",
      "account.email": "Email",
      "account.gamesPlayed": "Games Played",
      "account.gamesWon": "Games Won",
      "account.winRate": "Win Rate",
      "account.profile": "Profile",
      "account.history": "History",
      "account.settings": "Settings",
      "account.logout": "Logout",
      "account.close": "Close",
      
      // Settings
      "settings.title": "SETTINGS",
      "settings.language": "Language",
      "settings.french": "Français",
      "settings.english": "English",
      "settings.notifications": "Notifications",
      "settings.sound": "Sounds",
      "settings.theme": "Theme",
      
      // Tutorial
      "tutorial.title": "TUTORIAL",
      "tutorial.close": "Close",
      
      // Verify Email
      "verifyEmail.title": "Verify your email",
      "verifyEmail.instructions": "Enter the 6-digit code you received by email",
      "verifyEmail.codeLabel": "Verification code",
      "verifyEmail.verify": "Verify",
      "verifyEmail.verifying": "Verifying...",
      "verifyEmail.success": "Email verified successfully!",
      "verifyEmail.redirecting": "Redirecting...",
      "verifyEmail.codeLength": "Code must be 6 digits",
      "verifyEmail.errorVerifying": "Error during verification",
      "verifyEmail.noCode": "Didn't receive a code?",
      "verifyEmail.backToHome": "Back to home",
      
      // Errors
      "error.connection": "Connection error",
      "error.network": "Network error",
      "error.unknown": "Unknown error"
    }
  }
};

// Configuration avec détection automatique
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut
    detection: {
      // Ordre de détection : localStorage > navigator language > fallback
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Si le navigateur est en français, utiliser le français, sinon anglais
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false
    }
  });

// Si la langue détectée n'est pas "fr", forcer l'anglais
if (i18n.language && !i18n.language.startsWith('fr')) {
  i18n.changeLanguage('en');
}

export default i18n;
