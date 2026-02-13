const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuration du transporteur email
// Vous pouvez utiliser Gmail, SendGrid, Mailgun, etc.
const createTransporter = () => {
  // Option 1: Gmail (nécessite un mot de passe d'application)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Option 2: Service SMTP personnalisé
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true pour le port 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Générer un code de vérification à 6 chiffres
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Ancienne fonction token (pour compatibilité)
const generateVerificationToken = generateVerificationCode;

// Envoyer l'email de vérification avec code
const sendVerificationEmail = async (user, code) => {
  const transporter = createTransporter();
  
  // Code de vérification (6 chiffres)
  const verificationCode = code;
  
  const mailOptions = {
    from: `"Jeu Bleu vs Rouge" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎮 Code de vérification - Jeu Bleu vs Rouge',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #5f9ea0 0%, #4682b4 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 650px;
            margin: 0 auto;
            background: #e8d4b8;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 8px solid #2C5F7F;
          }
          .header {
            background: linear-gradient(135deg, #5f9ea0 0%, #2C5F7F 100%);
            padding: 40px 30px 30px;
            text-align: center;
            position: relative;
            border-bottom: 6px solid #d4a574;
          }
          .logo-circle {
            width: 150px;
            height: 150px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 6px solid #2C5F7F;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }
          .logo-circle img {
            width: 130px;
            height: 130px;
            object-fit: contain;
          }
          .title-main {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.2);
          }
          .title-blue {
            color: #2C5F7F;
          }
          .title-vs {
            color: #d4a574;
            font-size: 36px;
            margin: 0 10px;
          }
          .title-red {
            color: #8B2635;
          }
          .subtitle {
            color: #2C5F7F;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 4px;
            margin-top: 15px;
            text-transform: uppercase;
          }
          .content {
            padding: 40px 35px;
            background: #e8d4b8;
          }
          .greeting {
            font-size: 26px;
            font-weight: bold;
            text-align: center;
            color: #2C5F7F;
            margin-bottom: 25px;
            text-shadow: 1px 1px 0px rgba(0,0,0,0.1);
          }
          .text-block {
            background: rgba(255,255,255,0.5);
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 3px solid #2C5F7F;
            color: #1a1a1a;
            line-height: 1.8;
            font-size: 15px;
            text-align: center;
          }
          .code-box {
            background: #2C5F7F;
            border: 6px solid #8B2635;
            border-radius: 12px;
            padding: 35px;
            margin: 30px 0;
            text-align: center;
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.3);
          }
          .code-label {
            color: #d4a574;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            letter-spacing: 3px;
            text-transform: uppercase;
          }
          .code {
            font-size: 64px;
            font-weight: bold;
            letter-spacing: 18px;
            font-family: 'Courier New', monospace;
            color: #e8d4b8;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.3);
            padding: 15px 0;
          }
          .info-box {
            background: rgba(44, 95, 127, 0.15);
            border: 3px dashed #2C5F7F;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .info-box p {
            margin: 8px 0;
            color: #2C5F7F;
            font-weight: bold;
            font-size: 15px;
          }
          .warning {
            background: rgba(255, 193, 7, 0.3);
            border: 3px solid #ffc107;
            border-radius: 8px;
            padding: 18px;
            margin: 25px 0;
            color: #856404;
            font-weight: bold;
            text-align: center;
          }
          .game-features {
            background: rgba(255,255,255,0.4);
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border: 3px solid #8B2635;
          }
          .game-features h3 {
            color: #8B2635;
            margin-top: 0;
            font-size: 18px;
            letter-spacing: 2px;
            text-align: center;
          }
          .game-features ul {
            list-style: none;
            padding: 0;
            margin: 15px 0;
          }
          .game-features li {
            color: #1a1a1a;
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px solid rgba(44, 95, 127, 0.2);
          }
          .game-features li:last-child {
            border-bottom: none;
          }
          .footer {
            background: #2C5F7F;
            padding: 25px;
            text-align: center;
            border-top: 6px solid #8B2635;
          }
          .footer p {
            margin: 8px 0;
            color: #d4a574;
            font-size: 13px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-circle">
              <img src="https://jeu-bleu-rouge.onrender.com/logo-bvr.png" alt="Logo BvR">
            </div>
            <div class="title-main">
              <span class="title-blue">BLEU</span>
              <span class="title-vs">vs</span>
              <span class="title-red">ROUGE</span>
            </div>
            <div class="subtitle">
              INFILTRATION • DÉDUCTION • ÉLIMINATION
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">
              BIENVENUE ${user.username.toUpperCase()} ! 🎮
            </div>
            
            <div class="text-block">
              <strong>Merci de rejoindre le jeu Bleu vs Rouge !</strong><br>
              Un jeu d'infiltration et de stratégie où chaque décision compte.
            </div>
            
            <div class="code-box">
              <div class="code-label">⚡ VOTRE CODE DE VÉRIFICATION</div>
              <div class="code">${verificationCode}</div>
            </div>
            
            <div class="info-box">
              <p>📱 ENTREZ CE CODE DANS LE JEU</p>
              <p>POUR ACTIVER VOTRE COMPTE</p>
            </div>
            
            <div class="warning">
              ⏱️ ATTENTION : Ce code expire dans 24 heures
            </div>
            
            <div class="game-features">
              <h3>🎯 À PROPOS DU JEU</h3>
              <ul>
                <li>👥 Infiltrez l'équipe adverse sans vous faire repérer</li>
                <li>🔍 Démasquez les traîtres cachés dans votre équipe</li>
                <li>⚔️ Éliminez stratégiquement vos adversaires</li>
                <li>🏆 Remportez la victoire pour votre équipe</li>
              </ul>
            </div>
            
            <div class="text-block" style="font-size: 13px; margin-top: 30px;">
              Si vous n'avez pas créé de compte,<br>vous pouvez ignorer cet email.
            </div>
          </div>
          
          <div class="footer">
            <p>JEU BLEU VS ROUGE</p>
            <p>© 2026 - STYLE VINTAGE ANNÉES 90</p>
            <p style="margin-top: 12px; font-size: 11px;">EMAIL AUTOMATIQUE - NE PAS RÉPONDRE</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vérification envoyé à ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

// Envoyer un email de bienvenue après vérification
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Jeu Bleu Rouge" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎉 Votre compte est activé !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 10px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Compte activé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${user.username} !</h2>
            <p>Votre compte a été vérifié avec succès ! 🎊</p>
            <p>Vous pouvez maintenant profiter de toutes les fonctionnalités du jeu :</p>
            <ul>
              <li>✅ Créer et rejoindre des parties</li>
              <li>✅ Sauvegarder votre progression</li>
              <li>✅ Suivre vos statistiques</li>
              <li>✅ Affronter d'autres joueurs</li>
            </ul>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'https://jeu-bleu-rouge.onrender.com'}" 
                 style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; text-decoration: none; border-radius: 25px; font-weight: bold;">
                🎮 Commencer à jouer
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};
