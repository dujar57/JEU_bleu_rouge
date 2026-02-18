const crypto = require('crypto');

// ===== IMPORTS OPTIONNELS (pour éviter les erreurs si packages non installés) =====
let nodemailer, Resend, sgMail, SibApiV3Sdk;

try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.log('⚠️  nodemailer non installé (service email désactivé)');
}

try {
  const resendModule = require('resend');
  Resend = resendModule.Resend;
} catch (e) {
  console.log('⚠️  resend non installé (service email désactivé)');
}

try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  console.log('⚠️  @sendgrid/mail non installé (service email désactivé)');
}

try {
  SibApiV3Sdk = require('@getbrevo/brevo');
} catch (e) {
  console.log('⚠️  @getbrevo/brevo non installé (service email désactivé)');
}

// Configuration Brevo (prioritaire - 300 emails/jour gratuit)
const createBrevoService = () => {
  if (!SibApiV3Sdk) return null;
  if (process.env.BREVO_API_KEY) {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    return apiInstance;
  }
  return null;
};

// Configuration SendGrid (fallback 1)
const createSendGridService = () => {
  if (!sgMail) return null;
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail;
  }
  return null;
};

// Configuration Resend (fallback 2)
const createResendService = () => {
  if (!Resend) return null;
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

// Configuration du transporteur email (Nodemailer)
const createTransporter = () => {
  if (!nodemailer) return null;
  
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
  return nodemailer.createTransport({
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
const generateVerificationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Code entre 100000 et 999999
};

// Envoyer l'email de vérification
const sendVerificationEmail = async (user, code) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #333;
          margin-top: 0;
        }
        .content p {
          color: #666;
          line-height: 1.6;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background: #f8f8f8;
          padding: 20px;
          text-align: center;
          color: #999;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
        .code-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 10px;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          margin: 30px 0;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Bienvenue sur Jeu Bleu Rouge !</h1>
        </div>
        <div class="content">
          <h2>Bonjour ${user.username} ! 👋</h2>
          <p>
            Merci de vous être inscrit sur <strong>Jeu Bleu Rouge</strong>, le jeu d'infiltration 
            et de déduction où bleus et rouges s'affrontent !
          </p>
          <p>
            Pour finaliser votre inscription et commencer à jouer, veuillez entrer ce code de vérification sur le site :
          </p>
          <div class="code-box">
            ${code}
          </div>
          <div class="warning">
            ⚠️ Ce code est valable pendant <strong>15 minutes</strong>. 
            Ne le partagez avec personne !
          </div>
          <p>
            Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 Jeu Bleu Rouge - Tous droits réservés</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    // 1️⃣ PRIORITÉ : Brevo (300 emails/jour gratuit, entreprise française)
    const brevo = createBrevoService();
    if (brevo) {
      try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { 
          email: process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER,
          name: 'Jeu Bleu Rouge'
        };
        sendSmtpEmail.to = [{ email: user.email }];
        sendSmtpEmail.subject = '🎮 Confirmez votre adresse email - Jeu Bleu Rouge';
        sendSmtpEmail.htmlContent = htmlContent;
        
        await brevo.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email de vérification envoyé via Brevo à ${user.email}`);
        return true;
      } catch (brevoError) {
        console.error('❌ Erreur Brevo:', brevoError.response?.body || brevoError.message);
        console.log('🔄 Tentative avec SendGrid en fallback...');
      }
    }

    // 2️⃣ FALLBACK 1 : SendGrid (fonctionne sur Render, 100 emails/jour gratuit)
    const sendgrid = createSendGridService();
    if (sendgrid) {
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
          subject: '🎮 Confirmez votre adresse email - Jeu Bleu Rouge',
          html: htmlContent
        };
        await sendgrid.send(msg);
        console.log(`✅ Email de vérification envoyé via SendGrid à ${user.email}`);
        return true;
      } catch (sendgridError) {
        console.error('❌ Erreur SendGrid:', sendgridError.response?.body || sendgridError.message);
        console.log('🔄 Tentative avec Resend en fallback...');
      }
    }

    // 3️⃣ FALLBACK 2 : Resend (nécessite domaine vérifié pour production)
    const resend = createResendService();
    if (resend) {
      try {
        const result = await resend.emails.send({
          from: 'Jeu Bleu Rouge <onboarding@resend.dev>',
          to: user.email,
          subject: '🎮 Confirmez votre adresse email - Jeu Bleu Rouge',
          html: htmlContent
        });
        console.log(`✅ Email de vérification envoyé via Resend à ${user.email}`);
        console.log('📧 Resend response:', result);
        return true;
      } catch (resendError) {
        console.error('❌ Erreur Resend:', resendError);
        console.log('🔄 Tentative avec Nodemailer en fallback...');
      }
    }
    
    // 4️⃣ FALLBACK 3 : Nodemailer/SMTP (ne marche pas sur Render)
    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'Jeu Bleu Rouge 🎮',
        address: process.env.EMAIL_USER
      },
      replyTo: process.env.EMAIL_USER,
      to: user.email,
      subject: '🎮 Confirmez votre adresse email - Jeu Bleu Rouge',
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vérification envoyé via Nodemailer à ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

// Envoyer un email de bienvenue après vérification
const sendWelcomeEmail = async (user) => {
  const htmlContent = `
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
  `;
  
  try {
    // 1️⃣ PRIORITÉ : Brevo
    const brevo = createBrevoService();
    if (brevo) {
      try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { 
          email: process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER,
          name: 'Jeu Bleu Rouge'
        };
        sendSmtpEmail.to = [{ email: user.email }];
        sendSmtpEmail.subject = '🎉 Votre compte est activé !';
        sendSmtpEmail.htmlContent = htmlContent;
        
        await brevo.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email de bienvenue envoyé via Brevo à ${user.email}`);
        return;
      } catch (brevoError) {
        console.error('❌ Erreur Brevo:', brevoError.response?.body || brevoError.message);
        console.log('🔄 Tentative avec SendGrid en fallback...');
      }
    }

    // 2️⃣ FALLBACK 1 : SendGrid
    const sendgrid = createSendGridService();
    if (sendgrid) {
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
          subject: '🎉 Votre compte est activé !',
          html: htmlContent
        };
        await sendgrid.send(msg);
        console.log(`✅ Email de bienvenue envoyé via SendGrid à ${user.email}`);
        return;
      } catch (sendgridError) {
        console.error('❌ Erreur SendGrid:', sendgridError.response?.body || sendgridError.message);
        console.log('🔄 Tentative avec Resend en fallback...');
      }
    }

    // 2️⃣ FALLBACK 1 : Resend
    const resend = createResendService();
    if (resend) {
      try {
        const result = await resend.emails.send({
          from: 'Jeu Bleu Rouge <onboarding@resend.dev>',
          to: user.email,
          subject: '🎉 Votre compte est activé !',
          html: htmlContent
        });
        console.log(`✅ Email de bienvenue envoyé via Resend à ${user.email}`);
        console.log('📧 Resend response:', result);
        return;
      } catch (resendError) {
        console.error('❌ Erreur Resend:', resendError);
        console.log('🔄 Tentative avec Nodemailer en fallback...');
      }
    }
    
    // 3️⃣ FALLBACK 2 : Nodemailer
    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: 'Jeu Bleu Rouge 🎮',
        address: process.env.EMAIL_USER
      },
      replyTo: process.env.EMAIL_USER,
      to: user.email,
      subject: '🎉 Votre compte est activé !',
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé via Nodemailer à ${user.email}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};
