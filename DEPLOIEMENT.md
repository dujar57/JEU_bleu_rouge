# 🎮 Déploiement du Jeu Bleu vs Rouge sur Render (GRATUIT)

## ✅ Votre projet est maintenant prêt pour le déploiement !

### 📋 Étapes de déploiement :

## **1. Installer Git (si pas déjà fait)**

1. Téléchargez Git depuis : https://git-scm.com/download/win
2. Installez-le avec les options par défaut
3. Redémarrez VS Code

## **2. Créer un compte GitHub**

1. Allez sur : https://github.com
2. Cliquez sur "Sign up" (gratuit)
3. Créez votre compte

## **3. Publier votre projet sur GitHub**

Dans VS Code :
1. Appuyez sur `Ctrl + Shift + P`
2. Tapez "Git: Initialize Repository" et appuyez sur Entrée
3. Appuyez sur `Ctrl + Shift + G` (ouvre le panneau Git)
4. Cliquez sur "Publish to GitHub"
5. Choisissez "Public repository"
6. Nommez-le "jeu-bleu-rouge"

## **4. Déployer sur Render**

1. Allez sur : https://render.com
2. Cliquez sur "Get Started" (gratuit)
3. Connectez-vous avec votre compte GitHub
4. Cliquez sur "New +" → "Web Service"
5. Trouvez et sélectionnez votre repository "jeu-bleu-rouge"
6. Configurez :
   - **Name** : `jeu-bleu-rouge`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free`
7. Cliquez sur "Create Web Service"

## **5. Accéder à votre jeu**

Après 2-3 minutes, Render vous donnera une URL comme :
`https://jeu-bleu-rouge.onrender.com`

**Votre jeu sera accessible 24/7 dans le monde entier !**

---

## 🔄 Pour mettre à jour le jeu après des modifications :

1. Dans VS Code, appuyez sur `Ctrl + Shift + G`
2. Écrivez un message (ex: "Mise à jour du jeu")
3. Cliquez sur ✓ (Commit)
4. Cliquez sur "..." puis "Push"
5. Render redéploiera automatiquement votre jeu !

---

## 📝 Notes importantes :

- ⚠️ Le plan gratuit de Render met le serveur en veille après 15 minutes d'inactivité
- La première connexion après la veille prend ~30 secondes
- Aucune limite de joueurs
- Vous pouvez toujours tester localement avec `node server.js`

## ❓ Besoin d'aide ?

Si vous êtes bloqué à une étape, demandez-moi de l'aide en précisant l'étape !
