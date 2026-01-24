function Lobby({ gameCode, gameData, pseudo, startGame }) {
  if (!gameData) {
    return (
      <div className="container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const isHost = gameData.players[0]?.pseudo === pseudo;

  return (
    <div className="container">
      <div className="game-code">
        <h3>Code de la partie</h3>
        <div className="code">{gameCode}</div>
      </div>

      <h2>Joueurs ({gameData.players.length})</h2>
      <div className="players-list">
        {gameData.players.map((player, index) => (
          <div key={index} className="player-item">
            <div>
              <div className="player-name">
                {player.pseudo} {player.pseudo === pseudo && '(Vous)'}
              </div>
              <div className="player-info">{player.realLifeInfo}</div>
            </div>
          </div>
        ))}
      </div>

      {isHost && gameData.players.length >= 4 && (
        <button onClick={startGame}>Lancer la partie</button>
      )}

      {isHost && gameData.players.length < 4 && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
          En attente de joueurs (minimum 4)
        </div>
      )}

      {!isHost && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
          En attente que l'hôte lance la partie...
        </div>
      )}
    </div>
  );
}

export default Lobby;
