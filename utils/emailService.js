const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Resend } = require('resend');
const sgMail = require('@sendgrid/mail');

// Configuration SendGrid (prioritaire)
const createSendGridService = () => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail;
  }
  return null;
};

// Configuration Resend (fallback 1)
const createResendService = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

// Configuration du transporteur email (Nodemailer)
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

// Générer un token de vérification
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Envoyer l'email de vérification
const sendVerificationEmail = async (user, token) => {
  // URL de vérification
  const verificationUrl = `${process.env.APP_URL || 'https://jeu-bleu-rouge.onrender.com'}/verify-email?token=${token}`;
  
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
            Pour finaliser votre inscription et commencer à jouer, veuillez confirmer votre 
            adresse email en cliquant sur le bouton ci-dessous :
          </p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">
              ✅ Confirmer mon email
            </a>
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            Ou copiez ce lien dans votre navigateur :<br>
            <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
          </p>
          <div class="warning">
            ⚠️ Ce lien est valable pendant <strong>24 heures</strong>. 
            Passé ce délai, vous devrez demander un nouveau lien de vérification.
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
    // 1️⃣ PRIORITÉ : SendGrid (fonctionne sur Render, 100 emails/jour gratuit)
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

    // 2️⃣ FALLBACK 1 : Resend (nécessite domaine vérifié pour production)
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
    
    // 3️⃣ FALLBACK 2 : Nodemailer/SMTP (ne marche pas sur Render)
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
    // 1️⃣ PRIORITÉ : SendGrid
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
