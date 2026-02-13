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
    from: `"Jeu Bleu Rouge" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎮 Code de vérification - Jeu Bleu vs Rouge',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #0f1624;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 2px solid rgba(255,255,255,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2C5F7F 0%, #1a3a52 50%, #8B2635 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            border-bottom: 3px solid rgba(255,255,255,0.1);
          }
          .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 50%;
            padding: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
          }
          .title-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin-top: 20px;
          }
          .title-blue {
            color: #4A9FD8;
            font-size: 36px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(74, 159, 216, 0.8);
            letter-spacing: 3px;
          }
          .title-vs {
            color: white;
            font-size: 28px;
            font-weight: bold;
          }
          .title-red {
            color: #D84A4A;
            font-size: 36px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(216, 74, 74, 0.8);
            letter-spacing: 3px;
          }
          .content {
            padding: 40px 30px;
            color: white;
          }
          .greeting {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #4A9FD8 0%, #D84A4A 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .content p {
            color: #b3b3b3;
            line-height: 1.8;
            font-size: 16px;
            margin: 15px 0;
          }
          .code-section {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
            border: 2px solid rgba(255,255,255,0.1);
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
          }
          .code-label {
            color: #4A9FD8;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .code {
            font-size: 56px;
            font-weight: bold;
            letter-spacing: 15px;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #4A9FD8 0%, #D84A4A 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px rgba(74, 159, 216, 0.5);
            padding: 20px 0;
            display: inline-block;
          }
          .warning-box {
            background: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .warning-box p {
            margin: 0;
            color: #ffc107;
            font-size: 14px;
          }
          .instruction {
            background: rgba(74, 159, 216, 0.1);
            border: 2px dashed #4A9FD8;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .instruction p {
            margin: 0;
            color: #4A9FD8;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background: rgba(0,0,0,0.3);
            padding: 25px;
            text-align: center;
            border-top: 2px solid rgba(255,255,255,0.1);
          }
          .footer p {
            margin: 5px 0;
            color: #666;
            font-size: 13px;
          }
          .game-info {
            background: rgba(255,255,255,0.03);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .game-info p {
            margin: 8px 0;
            color: #999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="https://jeu-bleu-rouge.onrender.com/logo-bvr.png" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="title-wrapper">
              <span class="title-blue">BLEU</span>
              <span class="title-vs">VS</span>
              <span class="title-red">ROUGE</span>
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">Bienvenue ${user.username} ! 🎮</div>
            
            <p style="text-align: center;">
              Merci de rejoindre <strong>Jeu Bleu vs Rouge</strong> !<br>
              Le jeu d'infiltration et de déduction ultime où chaque décision compte.
            </p>
            
            <div class="code-section">
              <div class="code-label">⚡ Votre Code de Vérification</div>
              <div class="code">${verificationCode}</div>
            </div>
            
            <div class="instruction">
              <p>📱 Entrez ce code dans le jeu pour activer votre compte</p>
            </div>
            
            <div class="warning-box">
              <p>⏱️ <strong>Attention :</strong> Ce code expire dans 24 heures</p>
            </div>
            
            <div class="game-info">
              <p><strong>🎯 À propos du jeu :</strong></p>
              <p>• Infiltrez l'équipe adverse</p>
              <p>• Démasquez les traîtres</p>
              <p>• Remportez la victoire pour votre équipe</p>
            </div>
            
            <p style="text-align: center; font-size: 13px; color: #666; margin-top: 30px;">
              Vous n'avez pas créé de compte ? Ignorez cet email.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>JEU BLEU VS ROUGE</strong></p>
            <p>© 2026 - Tous droits réservés</p>
            <p style="margin-top: 10px;">Email automatique - Ne pas répondre</p>
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
