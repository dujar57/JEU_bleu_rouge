const { Resend } = require('resend');

// Configuration Resend (pas de SMTP, juste API)
const resend = new Resend(process.env.RESEND_API_KEY);

// Générer un code de vérification à 6 chiffres
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Ancienne fonction token (pour compatibilité)
const generateVerificationToken = generateVerificationCode;

// Envoyer l'email de vérification avec code
const sendVerificationEmail = async (user, code) => {
  console.log(`📧 [Resend] Début sendVerificationEmail pour ${user.email}`);
  console.log(`📧 [Resend] Code à envoyer: ${code}`);
  
  const verificationCode = code;
  const emailFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  const htmlContent = `
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
          
          <div class="text-block" style="font-size: 13px; margin-top: 30px;">
            Si vous n'avez pas créé de compte,<br>vous pouvez ignorer cet email.
          </div>
        </div>
        
        <div class="footer">
          <p>JEU BLEU VS ROUGE</p>
          <p>© 2026 - STYLE VINTAGE ANNÉES 90</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    console.log(`📧 [Resend] Envoi en cours vers ${user.email}...`);
    
    const { data, error } = await resend.emails.send({
      from: `Jeu Bleu vs Rouge <${emailFrom}>`,
      to: [user.email],
      subject: '🎮 Code de vérification - Jeu Bleu vs Rouge',
      html: htmlContent
    });

    if (error) {
      console.error('❌ [Resend] ERREUR:', error);
      return false;
    }

    console.log(`✅ [Resend] Email envoyé avec succès à ${user.email}`);
    console.log(`✅ [Resend] ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ [Resend] ERREUR lors de l\'envoi:', error);
    return false;
  }
};

// Envoyer un email de bienvenue après vérification
const sendWelcomeEmail = async (user) => {
  const emailFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Jeu Bleu Rouge <${emailFrom}>`,
      to: [user.email],
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
              <p>Vous pouvez maintenant profiter de toutes les fonctionnalités du jeu.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ [Resend] Erreur email de bienvenue:', error);
      return;
    }

    console.log(`✅ [Resend] Email de bienvenue envoyé à ${user.email}`);
  } catch (error) {
    console.error('❌ [Resend] Erreur lors de l\'envoi du bienvenue:', error);
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};
