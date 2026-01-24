function Game({ gameCode, gameData, myRole, pseudo, socket }) {
  if (!gameData || !myRole) {
    return (
      <div className="container">
        <div className="loading">Initialisation du jeu...</div>
      </div>
    );
  }

  const teamEmoji = myRole.team === 'bleu' ? '🔵' : '🔴';
  const teamName = myRole.team === 'bleu' ? 'ÉQUIPE BLEUE' : 'ÉQUIPE ROUGE';

  const getRoleDescription = (role) => {
    switch (role) {
      case 'representant':
        return '👑 Représentant - Vous représentez votre équipe';
      case 'tueur':
        return '🔪 Tueur - Vous avez le pouvoir d\'éliminer';
      case 'lambda':
        return '👤 Membre Lambda - Vous êtes un membre normal';
      default:
        return role;
    }
  };

  return (
    <div className="container">
      <div className="role-card">
        <h2>Votre Rôle Secret</h2>
        <div className="team">{teamEmoji} {teamName}</div>
        <div className="role">{getRoleDescription(myRole.role)}</div>
        {myRole.munitions > 0 && (
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            💣 Munitions : {myRole.munitions}
          </div>
        )}
      </div>

      <h2>Joueurs en vie ({gameData.players.filter(p => p.isAlive).length})</h2>
      <div className="players-list">
        {gameData.players.map((player, index) => (
          player.isAlive && (
            <div key={index} className={`player-item ${player.team || ''}`}>
              <div>
                <div className="player-name">
                  {player.pseudo} {player.pseudo === pseudo && '(Vous)'}
                </div>
                <div className="player-info">{player.realLifeInfo}</div>
              </div>
            </div>
          )
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '14px' }}>
        La partie est en cours... Les mécaniques de vote et d'action arrivent dans la Phase 4 !
      </div>
    </div>
  );
}

export default Game;
