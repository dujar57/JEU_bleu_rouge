# 📧 RÉACTIVATION DE LA VÉRIFICATION EMAIL

## 🎯 État actuel
La vérification email est **DÉSACTIVÉE** pour permettre l'utilisation sans nom de domaine.
- ✅ Les nouveaux utilisateurs sont automatiquement vérifiés
- ✅ Connexion immédiate après inscription
- ✅ Tout le code Brevo et les templates email sont **CONSERVÉS** et prêts à être réactivés

---

## 🔄 Comment réactiver la vérification email

### 1️⃣ Backend - routes/auth.js

#### Dans la route `/register` (ligne ~108)
**Décommenter et modifier:**
```javascript
// DÉSACTIVÉ:
const user = new User({ 
  username, 
  email, 
  password,
  emailVerified: true  // ⚠️ Modifié
});

// RÉACTIVER:
const verificationToken = generateVerificationToken();
const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

const user = new User({ 
  username, 
  email, 
  password,
  emailVerified: false,  // ⚠️ Remettre à false
  emailVerificationToken: verificationToken,
  emailVerificationExpires: tokenExpiry
});

// Envoyer l'email
try {
  await sendVerificationEmail(user, verificationToken);
  console.log(`✅ Email de vérification envoyé à ${email}`);
} catch (emailError) {
  console.error('❌ Erreur envoi email:', emailError);
}
```

#### Dans la route `/login` (ligne ~200)
**Décommenter:**
```javascript
// RÉACTIVER:
if (!user.emailVerified) {
  return res.status(403).json({ 
    error: 'Veuillez confirmer votre email avant de vous connecter.',
    emailVerificationRequired: true,
    email: user.email
  });
}
```

#### Routes de vérification (ligne ~280)
**Décommenter tout le bloc:**
```javascript
// Enlever les /* */ autour des routes:
router.get('/verify-email', ...)
router.post('/verify-email', ...)
router.post('/resend-verification', ...)
```

---

### 2️⃣ Frontend - client/src/components/

#### Register.jsx
**Décommenter et restaurer:**
```javascript
// Ligne ~16 - Remettre les states:
const [showVerificationCode, setShowVerificationCode] = useState(false);
const [verificationCode, setVerificationCode] = useState('');
const [registeredEmail, setRegisteredEmail] = useState('');

// Ligne ~40 - Changer le comportement après inscription:
if (response.ok) {
  // RETIRER ces lignes:
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  alert('✅ Compte créé avec succès !\n\nVous êtes maintenant connecté.');
  
  // REMETTRE ces lignes:
  setRegisteredEmail(email);
  setShowVerificationCode(true);
  setError('');
}

// Ligne ~67 - Décommenter la fonction handleVerifyCode et l'interface
```

#### Login.jsx
**Décommenter et restaurer:**
```javascript
// Ligne ~8 - Remettre le state:
const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);

// Ligne ~12 - Remettre dans handleSubmit:
setEmailVerificationRequired(false);

// Ligne ~33 - Remettre la vérification:
if (data.emailVerificationRequired) {
  setEmailVerificationRequired(true);
  setError('📧 Votre email n\'est pas encore vérifié...');
} else {
  setError(data.message || data.error || 'Erreur de connexion');
}

// Ligne ~58 - Remettre le style conditionnel:
background: emailVerificationRequired ? '#ff9800' : '#ff6b6b',
```

---

### 3️⃣ Variables d'environnement (.env)

Assurez-vous d'avoir configuré Brevo:
```env
# Brevo (Sendinblue) - Service email principal
BREVO_API_KEY=votre_cle_api_brevo
EMAIL_FROM=noreply@votre-domaine.com
EMAIL_FROM_NAME=Bleu vs Rouge
APP_URL=https://votre-domaine.com
```

---

## 📋 Checklist de réactivation

- [ ] Configurer le nom de domaine et l'email
- [ ] Modifier `routes/auth.js` (3 endroits)
- [ ] Modifier `client/src/components/Register.jsx`
- [ ] Modifier `client/src/components/Login.jsx`
- [ ] Vérifier les variables d'environnement
- [ ] Tester l'inscription d'un nouvel utilisateur
- [ ] Vérifier la réception de l'email
- [ ] Tester la vérification avec le code à 6 chiffres
- [ ] Tester la connexion après vérification

---

## 🎨 Templates email conservés

Les templates email sont dans `utils/emailService.js` et incluent:
- ✅ Email de vérification avec code à 6 chiffres
- ✅ Email de bienvenue après vérification
- ✅ Design moderne et responsive
- ✅ Support Brevo, SendGrid, Resend et Nodemailer

**Tout est prêt pour être réactivé rapidement!** 🚀

---

## 🐛 Dépannage

Si les emails ne partent pas après réactivation:
1. Vérifier les clés API dans `.env`
2. Vérifier les logs du serveur
3. Tester avec `node test-email.js`
4. Vérifier les quotas Brevo (300 emails/jour gratuit)
5. Vérifier les spams

---

*Dernière mise à jour: Février 2026*
