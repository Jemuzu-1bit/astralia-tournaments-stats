function isByeMatch(match){
  return !match.player1_id || !match.player2_id;
}

function syncGamesForScore(match){
  if(!Array.isArray(match.games) || match.games.length < 2){
    match.games = [
      { player1_deck: null, player2_deck: null, winner: '' },
      { player1_deck: null, player2_deck: null, winner: '' }
    ];
    return;
  }

  const firstTwo = match.games.slice(0, 2);
  const firstTwoComplete = firstTwo.every(game=>game.winner === 'p1' || game.winner === 'p2');
  const tied = firstTwoComplete && firstTwo[0].winner !== firstTwo[1].winner;

  if(tied){
    if(!match.games[2]) match.games[2] = { player1_deck: null, player2_deck: null, winner: '' };
    match.games = match.games.slice(0, 3);
  } else {
    match.games = firstTwo;
  }
}

function getAvailableDecksForGame(match, gameIndex, player, decks, bannedDeck){
  const winningDecks = new Set(match.games.slice(0, gameIndex)
    .filter(game=>game.winner === player)
    .map(game=>player === 'p1' ? game.player1_deck : game.player2_deck)
    .filter(Boolean)
    .map(Number));
  return decks.filter(deck=>deck.id !== Number(bannedDeck) && !winningDecks.has(deck.id));
}

function getTurnWinner(match){
  for(const player of ['p1', 'p2']){
    const winningDecks = new Set(match.games.filter(game=>game.winner === player).map(game=>player === 'p1' ? game.player1_deck : game.player2_deck).filter(Boolean));
    if(winningDecks.size >= 2) return player;
  }
  return null;
}

function validateTurn(match, p1decks, p2decks){
  if(!match.bans || !match.bans.by_p1 || !match.bans.by_p2) return { ok: false, message: 'Seleziona il mazzo bannato da entrambi i giocatori.' };
  syncGamesForScore(match);
  if(match.games.length < 2 || match.games.length > 3) return { ok: false, message: 'Il turno deve contenere almeno 2 e massimo 3 partite.' };
  const exceptionalEnd = match.draw || match.timed_out;
  const completedGames = match.games.filter(game=>game.player1_deck && game.player2_deck && game.winner);
  if(exceptionalEnd && completedGames.length === 0) return { ok: false, message: 'Completa almeno una partita prima di salvare il turno.' };
  for(let index = 0; index < match.games.length; index++){
    const game = match.games[index];
    const isEmpty = !game.player1_deck && !game.player2_deck && !game.winner;
    const isComplete = game.player1_deck && game.player2_deck && game.winner;
    if(!isComplete){
      if(exceptionalEnd && isEmpty) continue;
      return { ok: false, message: `Completa la partita ${index + 1}: seleziona entrambi i mazzi e il vincitore.` };
    }
    if(Number(game.player1_deck) === Number(match.bans.by_p2) || Number(game.player2_deck) === Number(match.bans.by_p1)) return { ok: false, message: `La partita ${index + 1} usa un mazzo bannato.` };
    const previousP1Wins = new Set(match.games.slice(0, index).filter(previous=>previous.winner === 'p1').map(previous=>Number(previous.player1_deck)));
    const previousP2Wins = new Set(match.games.slice(0, index).filter(previous=>previous.winner === 'p2').map(previous=>Number(previous.player2_deck)));
    if(previousP1Wins.has(Number(game.player1_deck)) || previousP2Wins.has(Number(game.player2_deck))) return { ok: false, message: `La partita ${index + 1} usa un mazzo con cui il giocatore ha già vinto.` };
    if(game.winner === 'p1' && !p1decks.some(deck=>deck.id === Number(game.player1_deck))) return { ok: false, message: 'Il mazzo del giocatore 1 non è valido.' };
    if(game.winner === 'p2' && !p2decks.some(deck=>deck.id === Number(game.player2_deck))) return { ok: false, message: 'Il mazzo del giocatore 2 non è valido.' };
    if(index > 0){
      const previous = match.games[index - 1];
      if(previous.winner === 'p1' && Number(previous.player1_deck) === Number(game.player1_deck)) return { ok: false, message: `Dopo aver vinto la partita ${index}, il giocatore 1 deve usare l'altro mazzo.` };
      if(previous.winner === 'p2' && Number(previous.player2_deck) === Number(game.player2_deck)) return { ok: false, message: `Dopo aver vinto la partita ${index}, il giocatore 2 deve usare l'altro mazzo.` };
    }
  }
  const turnWinner = getTurnWinner(match);
  if(match.timed_out && match.turn_winner !== 'p1' && match.turn_winner !== 'p2') return { ok: false, message: 'Seleziona il vincitore del turno concluso per tempo.' };
  if(exceptionalEnd) return { ok: true, turnWinner: match.timed_out ? match.turn_winner : null };
  if(match.games.length === 3 && match.games[0].winner === match.games[1].winner) return { ok: false, message: 'La terza partita non è necessaria: un giocatore ha già vinto le prime due.' };
  if(!turnWinner && match.games.length === 2) return { ok: false, message: 'Dopo 2 partite nessun giocatore ha ancora vinto con entrambi i mazzi: aggiungi la terza partita.' };
  if(!turnWinner) return { ok: false, message: 'Nessun giocatore ha vinto con entrambi i mazzi.' };
  return { ok: true, turnWinner };
}
