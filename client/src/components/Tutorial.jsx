// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState } from 'react';

function Tutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "🎮 Bienvenue dans Bleu vs Rouge",
      content: (
        <div>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
            Un jeu social multijoueur où deux équipes s'affrontent pour survivre !
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Utilisez la discussion et les votes stratégiques pour éliminer vos adversaires.
          </p>
        </div>
      )
    },
    {
      title: "🔵🔴 Les Équipes",
      content: (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#2196F3', fontSize: '18px', marginBottom: '10px' }}>🔵 Équipe Bleue</h4>
            <p style={{ fontSize: '15px', lineHeight: '1.5' }}>
              Doit éliminer tous les Rouges et leur Représentant
            </p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#F44336', fontSize: '18px', marginBottom: '10px' }}>🔴 Équipe Rouge</h4>
            <p style={{ fontSize: '15px', lineHeight: '1.5' }}>
              Doit éliminer tous les Bleus et leur Représentant
            </p>
          </div>
          <p style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
            Les équipes sont attribuées aléatoirement au début de la partie
          </p>
        </div>
      )
    },
    {
      title: "👥 Les Rôles",
      content: (
        <div>
          <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px', border: '2px solid #FFD700' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>👑 Représentant</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Le chef d'équipe. Si le représentant adverse meurt, votre équipe gagne !
            </p>
          </div>
          <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', border: '2px solid #F44336' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>🔪 Tueur</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Possède des munitions pour éliminer des joueurs (fonction à venir)
            </p>
          </div>
          <div style={{ padding: '12px', background: 'rgba(128,128,128,0.1)', borderRadius: '8px', border: '2px solid #888' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>👤 Lambda</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Membre standard de l'équipe. Votez stratégiquement pour aider votre camp !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "⏱️ Phases de Jeu",
      content: (
        <div style={{ fontSize: '15px', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '17px', marginBottom: '10px', color: '#2196F3' }}>1️⃣ Phase de Discussion</h4>
            <p>
              Discutez avec les autres joueurs dans le chat anonyme. 
              Observez les comportements suspects et formez des alliances.
            </p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '17px', marginBottom: '10px', color: '#F44336' }}>2️⃣ Phase de Vote</h4>
            <p>
              Chaque équipe vote pour éliminer un joueur. Le joueur avec le plus de votes de chaque camp est éliminé. 
              <strong> Votez stratégiquement !</strong>
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '17px', marginBottom: '10px', color: '#4CAF50' }}>3️⃣ Élimination</h4>
            <p>
              Les résultats sont révélés et les joueurs éliminés sont annoncés. 
              La partie continue jusqu'à ce qu'une équipe gagne.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "💬 Chat Anonyme",
      content: (
        <div style={{ fontSize: '15px', lineHeight: '1.7' }}>
          <div style={{ padding: '15px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '10px', marginBottom: '15px' }}>
            <p style={{ marginBottom: '12px' }}>
              🔢 Vous êtes identifié uniquement par votre <strong>numéro de joueur</strong> dans le chat
            </p>
            <p style={{ marginBottom: '12px' }}>
              👥 Les autres joueurs voient votre nom réel dans la liste
            </p>
            <p>
              💡 Utilisez cette anonymat pour bluffer et manipuler les votes !
            </p>
          </div>
          <p style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
            Conseil : Le chat est l'outil principal pour influencer les autres joueurs
          </p>
        </div>
      )
    },
    {
      title: "🏆 Conditions de Victoire",
      content: (
        <div style={{ fontSize: '15px', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
            <strong>🔵 Équipe Bleue gagne si :</strong>
            <p style={{ marginTop: '8px' }}>Le représentant Rouge meurt ET tous les Rouges sont éliminés</p>
          </div>
          <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
            <strong>🔴 Équipe Rouge gagne si :</strong>
            <p style={{ marginTop: '8px' }}>Le représentant Bleu meurt ET tous les Bleus sont éliminés</p>
          </div>
          <div style={{ padding: '12px', background: 'rgba(233, 30, 99, 0.1)', borderRadius: '8px' }}>
            <strong>💕 Amoureux gagnent si :</strong>
            <p style={{ marginTop: '8px' }}>Ils sont les 2 derniers survivants (système à venir)</p>
          </div>
        </div>
      )
    },
    {
      title: "🎯 Conseils Stratégiques",
      content: (
        <div style={{ fontSize: '14px', lineHeight: '1.7' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>🔍 Pour tous :</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Observez qui vote contre qui</li>
              <li>Identifiez les comportements suspects</li>
              <li>Protégez votre représentant</li>
              <li>Communiquez avec votre équipe dans le chat</li>
            </ul>
          </div>
          <div>
            <strong>👑 Pour les représentants :</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Votre survie est cruciale pour votre équipe</li>
              <li>Dirigez les votes stratégiquement</li>
              <li>Méfiez-vous des traîtres potentiels</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #E8D5B7 0%, #C9B492 100%)',
        borderRadius: '15px',
        border: '4px solid #2C5F7F',
        boxShadow: '0 0 0 2px #8B6F47, 0 10px 40px rgba(0,0,0,0.5)',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px 30px',
          borderBottom: '3px solid #2C5F7F',
          background: 'linear-gradient(180deg, rgba(44, 95, 127, 0.1) 0%, transparent 100%)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            color: '#2C1810',
            fontFamily: 'Arial, Helvetica, sans-serif',
            textAlign: 'center',
            textShadow: '2px 2px 0 rgba(255,255,255,0.3)'
          }}>
            {steps[currentStep].title}
          </h2>
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '14px',
            color: '#666',
            fontWeight: 'bold'
          }}>
            Étape {currentStep + 1} sur {steps.length}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '30px',
          overflowY: 'auto',
          flex: 1,
          color: '#2C1810'
        }}>
          {steps[currentStep].content}
        </div>

        {/* Progress bar */}
        <div style={{
          padding: '0 30px 20px',
          display: 'flex',
          gap: '5px',
          justifyContent: 'center'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                height: '8px',
                width: `${100 / steps.length}%`,
                background: index <= currentStep ? '#2C5F7F' : 'rgba(44, 95, 127, 0.2)',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 30px',
          borderTop: '3px solid #2C5F7F',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          background: 'linear-gradient(0deg, rgba(44, 95, 127, 0.05) 0%, transparent 100%)'
        }}>
          {currentStep > 0 ? (
            <button
              onClick={prevStep}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(180deg, #A8957D 0%, #8B7961 100%)',
                border: '3px solid #2C5F7F',
                borderRadius: '8px',
                color: '#FFF',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 0 #1a0f0a',
                transition: 'all 0.2s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ← Précédent
            </button>
          ) : (
            <button
              onClick={skipTutorial}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '2px solid #999',
                borderRadius: '8px',
                color: '#666',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Passer le tutoriel
            </button>
          )}

          <button
            onClick={nextStep}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(180deg, #2C5F7F 0%, #1a3a4d 100%)',
              border: '3px solid #8B6F47',
              borderRadius: '8px',
              color: '#FFF',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #0d1f29',
              transition: 'all 0.2s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {currentStep < steps.length - 1 ? 'Suivant →' : 'Commencer à jouer !'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
