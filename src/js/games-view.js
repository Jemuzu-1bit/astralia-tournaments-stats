function renderGames(div, match, p1, p2, p1decks, p2decks){
  const gamesEl = div.querySelector('.games');
  syncGamesForScore(match);
  const bannedPlayer1Deck = match.bans?.by_p2 || null;
  const bannedPlayer2Deck = match.bans?.by_p1 || null;
  gamesEl.innerHTML = match.games.map((game, index)=>{
    const availableP1Decks = getAvailableDecksForGame(match, index, 'p1', p1decks, bannedPlayer1Deck);
    const availableP2Decks = getAvailableDecksForGame(match, index, 'p2', p2decks, bannedPlayer2Deck);
    const player1Options = availableP1Decks.map(deck=>`<option value="${deck.id}" ${Number(game.player1_deck)===deck.id?'selected':''}>${deck.name}</option>`).join('');
    const player2Options = availableP2Decks.map(deck=>`<option value="${deck.id}" ${Number(game.player2_deck)===deck.id?'selected':''}>${deck.name}</option>`).join('');
    return `<div class="game-row">`+
      `<strong>Partita ${index + 1}</strong>`+
      `<label>${p1.name}: <select class="game-deck" data-game="${index}" data-player="1"><option value="">--Scegli mazzo--</option>${player1Options}</select></label>`+
      `<label>${p2.name}: <select class="game-deck" data-game="${index}" data-player="2"><option value="">--Scegli mazzo--</option>${player2Options}</select></label>`+
      `<label>Vince: <select class="game-winner" data-game="${index}"><option value="">--Scegli vincitore--</option><option value="p1" ${game.winner==='p1'?'selected':''}>${p1.name}</option><option value="p2" ${game.winner==='p2'?'selected':''}>${p2.name}</option></select></label>`+
      `</div>`;
  }).join('');

  gamesEl.querySelectorAll('.game-deck').forEach(select=>setDeckColor(select, select.value));
  gamesEl.querySelectorAll('.game-deck').forEach(select=>select.addEventListener('change', event=>{
    const game = match.games[Number(event.target.dataset.game)];
    if(event.target.dataset.player === '1') game.player1_deck = event.target.value ? Number(event.target.value) : null;
    else game.player2_deck = event.target.value ? Number(event.target.value) : null;
    setDeckColor(event.target, event.target.value);
    saveLocal();
  }));
  gamesEl.querySelectorAll('.game-winner').forEach(select=>select.addEventListener('change', event=>{
    match.games[Number(event.target.dataset.game)].winner = event.target.value;
    saveLocal();
    renderGames(div, match, p1, p2, p1decks, p2decks);
  }));

  const result = getTurnWinner(match);
  const status = div.querySelector('.turn-status');
  if(status){
    if(match.draw) status.textContent = 'Turno concluso in pareggio';
    else if(match.timed_out) status.textContent = match.turn_winner
      ? `Turno concluso per tempo: vinto da ${match.turn_winner === 'p1' ? p1.name : p2.name}`
      : 'Turno concluso per tempo: seleziona il vincitore';
    else if(result) status.textContent = `Turno vinto da ${result === 'p1' ? p1.name : p2.name}`;
    else if(match.games.length === 3) status.textContent = 'Punteggio 1-1: terza partita necessaria';
    else status.textContent = 'Turno non ancora deciso';
  }
}
