const STORAGE_KEY = 'astralia_tourney_data_v1';

function createEmptyState(){
  return {
    activeTournamentId: null,
    tournaments: [],
    name: '',
    code: '',
    participants: [],
    matches: [],
    decks: []
  };
}

let state = createEmptyState();

function getSavedTournamentById(id){
  return state.tournaments.find(t=>String(t.id)===String(id)) || null;
}

function getActiveTournament(){
  const activeTournament = getSavedTournamentById(state.activeTournamentId);
  if(activeTournament){
    state.name = activeTournament.name || activeTournament.code || '';
    state.code = activeTournament.code || activeTournament.id || '';
    state.participants = Array.isArray(activeTournament.participants) ? activeTournament.participants : [];
    state.matches = Array.isArray(activeTournament.matches) ? activeTournament.matches : [];
  }
  return activeTournament;
}

function applyTournamentSnapshot(snapshot){
  const tournament = {
    id: snapshot.id || snapshot.code || Date.now().toString(),
    code: snapshot.code || snapshot.id || '',
    name: snapshot.name || snapshot.code || 'Torneo senza nome',
    participants: Array.isArray(snapshot.participants) ? snapshot.participants : [],
    matches: Array.isArray(snapshot.matches) ? snapshot.matches : []
  };

  const existingIndex = state.tournaments.findIndex(t=>String(t.id)===String(tournament.id));
  if(existingIndex >= 0) state.tournaments[existingIndex] = tournament;
  else state.tournaments.unshift(tournament);

  state.activeTournamentId = tournament.id;
  state.name = tournament.name;
  state.code = tournament.code;
  state.participants = tournament.participants;
  state.matches = tournament.matches;
  return tournament;
}

async function loadDecks(){
  const res = await fetch(`decks.json?ts=${Date.now()}`, { cache: 'no-store' });
  if(!res.ok) throw new Error(`Errore caricamento mazzi: ${res.status}`);
  state.decks = await res.json();
}

function saveLocal(){
  const active = getActiveTournament();
  if(state.activeTournamentId && active){
    const snapshot = {
      id: state.activeTournamentId,
      code: state.code || state.activeTournamentId,
      name: state.name || state.code || state.activeTournamentId,
      participants: state.participants,
      matches: state.matches
    };
    const existingIndex = state.tournaments.findIndex(t=>String(t.id)===String(snapshot.id));
    if(existingIndex >= 0) state.tournaments[existingIndex] = snapshot;
    else state.tournaments.unshift(snapshot);
  }
  const cleanedState = {
    ...state,
    tournaments: (state.tournaments || []).map(tournament => ({
      ...tournament,
      participants: Array.isArray(tournament.participants) ? tournament.participants : [],
      matches: Array.isArray(tournament.matches) ? tournament.matches : []
    }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedState));
}

function normalizeState(candidate){
  if(!candidate || typeof candidate !== 'object') return null;

  const legacyParticipants = Array.isArray(candidate.participants) ? candidate.participants : null;
  const legacyMatches = Array.isArray(candidate.matches) ? candidate.matches : null;

  if(legacyParticipants && legacyMatches){
    const legacyTournament = {
      id: candidate.activeTournamentId || 'legacy-tournament',
      code: candidate.code || 'legacy-tournament',
      name: candidate.name || 'Torneo locale',
      participants: legacyParticipants,
      matches: legacyMatches
    };

    return {
      activeTournamentId: legacyTournament.id,
      tournaments: [legacyTournament],
      name: legacyTournament.name,
      code: legacyTournament.code,
      participants: legacyParticipants,
      matches: legacyMatches,
      decks: Array.isArray(candidate.decks) ? candidate.decks : []
    };
  }

  if(!Array.isArray(candidate.tournaments)) return null;

  const firstTournament = candidate.tournaments[0] || null;
  return {
    activeTournamentId: candidate.activeTournamentId || (firstTournament ? firstTournament.id : null),
    tournaments: candidate.tournaments,
    name: candidate.name || (firstTournament ? firstTournament.name : ''),
    code: candidate.code || (firstTournament ? firstTournament.code : ''),
    participants: Array.isArray(candidate.participants) ? candidate.participants : (firstTournament ? firstTournament.participants || [] : []),
    matches: Array.isArray(candidate.matches) ? candidate.matches : (firstTournament ? firstTournament.matches || [] : []),
    decks: Array.isArray(candidate.decks) ? candidate.decks : []
  };
}

function loadLocal(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return false;
  try{
    const savedState = normalizeState(JSON.parse(raw));
    if(!savedState) return false;
    state = savedState;
    if(!state.activeTournamentId && state.tournaments.length) state.activeTournamentId = state.tournaments[0].id;
    if(state.activeTournamentId) getActiveTournament();
  }catch(error){
    console.warn('Dati locali non validi, avvio un nuovo torneo.', error);
    localStorage.removeItem(STORAGE_KEY);
    state = createEmptyState();
    return false;
  }
  renderSavedTournaments();
  renderParticipants();
  renderMatches();
  return true;
}

function clearLocal(){
  if(!confirm('Rimuovere tutti i dati salvati? Questa azione è irreversibile.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = createEmptyState();
  renderSavedTournaments();
  renderParticipants();
  renderMatches();
}

function deleteTournamentById(id){
  if(!id){ alert('Nessun torneo selezionato.'); return; }

  const tournament = getSavedTournamentById(id);
  if(!tournament){ alert('Il torneo selezionato non è stato trovato.'); return; }

  const confirmed = confirm(`Eliminare il torneo "${tournament.name || tournament.code || 'senza nome'}"?`);
  if(!confirmed) return;

  state.tournaments = state.tournaments.filter(t=>String(t.id)!==String(id));

  if(state.activeTournamentId === id){
    state.activeTournamentId = state.tournaments[0]?.id || null;
    if(state.activeTournamentId){
      const nextTournament = getSavedTournamentById(state.activeTournamentId);
      state.name = nextTournament?.name || nextTournament?.code || '';
      state.code = nextTournament?.code || nextTournament?.id || '';
      state.participants = Array.isArray(nextTournament?.participants) ? nextTournament.participants : [];
      state.matches = Array.isArray(nextTournament?.matches) ? nextTournament.matches : [];
    } else {
      state.name = '';
      state.code = '';
      state.participants = [];
      state.matches = [];
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderSavedTournaments();
  renderParticipants();
  renderMatches();
}

function renderSavedTournaments(){
  const container = document.getElementById('savedTournaments');
  if(!container) return;

  const savedTournaments = state.tournaments || [];
  if(savedTournaments.length === 0){
    container.innerHTML = '<div class="empty-tournaments">Nessun torneo salvato. Aggiungine uno dalla barra qui sopra.</div>';
    return;
  }

  container.innerHTML = savedTournaments.map(tournament => {
    const isActive = String(tournament.id) === String(state.activeTournamentId);
    const playerCount = Array.isArray(tournament.participants) ? tournament.participants.length : 0;
    return `
      <div class="tournament-card ${isActive ? 'active' : ''}" data-tournament-id="${tournament.id}">
        <button type="button" class="tournament-card-select" data-tournament-id="${tournament.id}">
          <span class="tournament-card-name">${tournament.name || tournament.code || 'Torneo senza nome'}</span>
          <span class="tournament-card-code">${tournament.code || tournament.id || 'codice'}</span>
          <span class="tournament-card-meta">${playerCount} partecipanti</span>
        </button>
        <button type="button" class="tournament-card-refresh" data-tournament-id="${tournament.id}" aria-label="Aggiorna torneo ${tournament.name || tournament.code || 'senza nome'}">↻</button>
        <button type="button" class="tournament-card-remove" data-tournament-id="${tournament.id}" aria-label="Elimina torneo ${tournament.name || tournament.code || 'senza nome'}">×</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.tournament-card-select').forEach(button => {
    button.addEventListener('click', () => {
      const selectedId = button.dataset.tournamentId;
      const tournament = getSavedTournamentById(selectedId);
      if(!tournament) return;
      state.activeTournamentId = selectedId;
      state.name = tournament.name || tournament.code || '';
      state.code = tournament.code || tournament.id || '';
      state.participants = Array.isArray(tournament.participants) ? tournament.participants : [];
      state.matches = Array.isArray(tournament.matches) ? tournament.matches : [];
      saveLocal();
      renderSavedTournaments();
      renderParticipants();
      renderMatches();
    });
  });

  container.querySelectorAll('.tournament-card-remove').forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteTournamentById(button.dataset.tournamentId);
    });
  });

  container.querySelectorAll('.tournament-card-refresh').forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      fetchFromChallonge(button.dataset.tournamentId);
    });
  });
}

function getDeckById(deckId){
  if(deckId === null || deckId === undefined || deckId === '') return null;
  return state.decks.find(d=>Number(d.id)===Number(deckId)) || null;
}

function containsDuplicateDeckColor(player, currentIndex, chosenDeckId){
  if(!chosenDeckId) return false;
  const chosenDeck = getDeckById(chosenDeckId);
  if(!chosenDeck || !chosenDeck.color) return false;

  return (player.decks || []).some((assignedDeckId, index)=>{
    if(index === currentIndex) return false;
    const assignedDeck = getDeckById(assignedDeckId);
    return !!assignedDeck && assignedDeck.color === chosenDeck.color;
  });
}

function getDeckColorClass(color){
  return `deck-color-${String(color || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function setDeckColor(element, deckId){
  element.className = element.className.replace(/\bdeck-color-[a-z0-9-]+\b/g, '').trim();
  const deck = getDeckById(deckId);
  if(deck?.color) element.classList.add(getDeckColorClass(deck.color));
}

function getDeckOptions(selected, player, currentIndex){
  const usedColors = new Set((player?.decks || [])
    .map((deckId, index)=>index === currentIndex ? null : getDeckById(deckId)?.color)
    .filter(Boolean));
  const availableDecks = state.decks.filter(deck =>
    !usedColors.has(deck.color) || Number(deck.id) === Number(selected)
  );

  return `<option value="" ${selected ? '' : 'selected'}>--Seleziona mazzo--</option>` +
    availableDecks.map(d=>`<option value="${d.id}" ${d.id==selected ? 'selected' : ''}>${d.name}</option>`).join('');
}

function refreshMatchesKeepingPage(){
  const activePageId = document.querySelector('.page.active')?.id || 'participantsPage';
  renderMatches();
  showPage(document.getElementById(activePageId) ? activePageId : 'participantsPage');
}

function renderParticipants(){
  const el = document.getElementById('participants');
  el.innerHTML = '';
  state.participants.forEach(p=>{
    const div = document.createElement('div'); div.className='participant';
    div.innerHTML = `<strong>${p.name}</strong> <span class="small">(id:${p.id})</span>`+
      `<div>Seleziona 3 mazzi:</div>`+
      `<div class="deck-slots">${[0,1,2].map(index=>`<span class="deck-slot"><select class="deck-select" data-pid="${p.id}" data-index="${index}">${getDeckOptions(p.decks?.[index]||'', p, index)}</select><button type="button" class="deck-remove" data-pid="${p.id}" data-index="${index}" aria-label="Rimuovi il mazzo dallo slot ${index + 1}">×</button></span>`).join('')}</div>`+
      `<div>Dettagli: <input class="deck-details" data-pid="${p.id}" placeholder="Dettagli generali" value="${p.details||''}"/></div>`;
    el.appendChild(div);
  });

  document.querySelectorAll('.deck-select').forEach(select=>setDeckColor(select, select.value));

  // attach listeners
  document.querySelectorAll('.deck-select').forEach(s=>s.addEventListener('change', e=>{
    const pid = e.target.dataset.pid, idx = Number(e.target.dataset.index);
    const p = state.participants.find(x=>String(x.id)===String(pid));
    const previousValue = p.decks?.[idx] ?? null;
    const nextValue = e.target.value ? Number(e.target.value) : null;

    if(nextValue && containsDuplicateDeckColor(p, idx, nextValue)){
      const chosenDeck = getDeckById(nextValue);
      const duplicateDeck = (p.decks || []).find((assignedDeckId, index)=>
        index !== idx && assignedDeckId && getDeckById(assignedDeckId)?.color === chosenDeck.color
      );
      const duplicateName = getDeckById(duplicateDeck)?.name || 'un altro mazzo';
      alert(`Puoi scegliere solo un mazzo per colore. Il colore ${chosenDeck.color} è già usato da "${duplicateName}".`);
      p.decks = p.decks || [null,null,null];
      p.decks[idx] = previousValue;
      renderParticipants();
      return;
    }

    p.decks = p.decks||[null,null,null];
    p.decks[idx] = nextValue;
    saveLocal();
    const activePageId = document.querySelector('.page.active')?.id || 'participantsPage';
    renderParticipants();
    renderMatches();
    showPage(document.getElementById(activePageId) ? activePageId : 'participantsPage');
  }));
  document.querySelectorAll('.deck-remove').forEach(button=>button.addEventListener('click', ()=>{
    const p = state.participants.find(x=>String(x.id)===String(button.dataset.pid));
    if(!p) return;
    p.decks = p.decks || [null,null,null];
    p.decks[Number(button.dataset.index)] = null;
    saveLocal();
    const activePageId = document.querySelector('.page.active')?.id || 'participantsPage';
    renderParticipants();
    renderMatches();
    showPage(document.getElementById(activePageId) ? activePageId : 'participantsPage');
  }));
  document.querySelectorAll('.deck-details').forEach(i=>i.addEventListener('input', e=>{
    const pid = e.target.dataset.pid; const p = state.participants.find(x=>String(x.id)===String(pid));
    p.details = e.target.value; saveLocal();
  }));
}

function findParticipantById(id){
  return state.participants.find(p=>String(p.id)===String(id));
}

function isByeMatch(match){
  return !match.player1_id || !match.player2_id;
}

function showPage(pageId){
  document.querySelectorAll('.page').forEach(page=>page.classList.toggle('active', page.id===pageId));
  document.querySelectorAll('#pagesNav button').forEach(button=>button.classList.toggle('active', button.dataset.page===pageId));
}

function renderMatches(){
  const el = document.getElementById('roundPages');
  const links = document.getElementById('roundLinks');
  el.innerHTML='';
  links.innerHTML='';
  const groupedMatches = new Map();
  state.matches.forEach(match=>{
    const round = match.round ?? 'Senza turno';
    if(!groupedMatches.has(round)) groupedMatches.set(round, []);
    groupedMatches.get(round).push(match);
  });

  groupedMatches.forEach((matches, round)=>{
    const roundSection = document.createElement('section');
    const pageId = `roundPage-${String(round).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    roundSection.id = pageId;
    roundSection.className = 'page round-page';
    roundSection.innerHTML = `<h3>Turno ${round}</h3>`;
    el.appendChild(roundSection);

    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = `Turno ${round}`;
    link.dataset.page = pageId;
    link.addEventListener('click', ()=>showPage(pageId));
    links.appendChild(link);

    matches.forEach(m=>{
    if(isByeMatch(m)){
      const byeParticipant = findParticipantById(m.player1_id || m.player2_id) || {
        name: m.player1_name || m.player2_name || 'Partecipante'
      };
      const bye = document.createElement('div');
      bye.className = 'match bye-match';
      bye.innerHTML = `<div class="match-heading"><strong>${byeParticipant.name}</strong><span>passa automaticamente</span></div>`+
        `<p class="small">Bye assegnato da Challonge: nessun ban o risultato da inserire.</p>`;
      roundSection.appendChild(bye);
      return;
    }
    const p1 = findParticipantById(m.player1_id) || {name:m.player1_name,id:m.player1_id};
    const p2 = findParticipantById(m.player2_id) || {name:m.player2_name,id:m.player2_id};
    const div = document.createElement('div'); div.className='match';
    div.innerHTML = `<div class="match-heading"><strong>${p1.name}</strong><span>vs</span><strong>${p2.name}</strong></div>`+
      `<div class="ban-grid">`+
      `<label class="ban-control"><span>${p1.name} banna un mazzo di ${p2.name}</span><select data-match="${m.id}" data-player="1" class="ban-select"></select></label>`+
      `<label class="ban-control"><span>${p2.name} banna un mazzo di ${p1.name}</span><select data-match="${m.id}" data-player="2" class="ban-select"></select></label>`+
      `</div>`+
      `<p class="small">Dopo i ban restano 2 mazzi per giocatore. Il vincitore del turno deve aver vinto con entrambi.</p>`+
      `<p class="turn-status small">Turno non ancora deciso</p>`+
      `<div class="games"></div>`+
      `<button type="button" data-save="${m.id}">Salva risultato</button>`;
    roundSection.appendChild(div);

    // populate ban selects with each player's assigned decks
    const p1decks = (p1.decks||[]).map(id=>state.decks.find(d=>d.id==id)).filter(Boolean);
    const p2decks = (p2.decks||[]).map(id=>state.decks.find(d=>d.id==id)).filter(Boolean);
    const banSelects = div.querySelectorAll('.ban-select');
    banSelects.forEach(s=>{
      const which = s.dataset.player=='1' ? p2decks : p1decks;
      s.innerHTML = `<option value="">--Nessuno--</option>` + which.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
      // preselect (single value or null)
      const saved = m.bans && (s.dataset.player=='1'? m.bans.by_p1: m.bans.by_p2) || null;
      if(saved){
        Array.from(s.options).forEach(o=>{ if(Number(o.value)===Number(saved)) o.selected=true; });
      }
      setDeckColor(s, s.value);
        // change handler: update model and game options
      s.addEventListener('change', ()=>{
        const val = s.value? Number(s.value) : null;
        if(!m.bans || !('by_p1' in m.bans)) m.bans = { by_p1: null, by_p2: null };
        if(s.dataset.player=='1') m.bans.by_p1 = val; else m.bans.by_p2 = val;
          saveLocal();
          setDeckColor(s, val);
          renderGames(div, m, p1, p2, p1decks, p2decks);
      });
    });

      if(!Array.isArray(m.games) || m.games.length === 0){
        m.games = [{ player1_deck: null, player2_deck: null, winner: '' }, { player1_deck: null, player2_deck: null, winner: '' }];
      }
      renderGames(div, m, p1, p2, p1decks, p2decks);

    div.querySelector('[data-save]').addEventListener('click', ()=>{
        const validation = validateTurn(m, p1decks, p2decks);
        if(!validation.ok){ alert(validation.message); return; }
        m.turn_winner = validation.turnWinner;
        saveLocal();
        renderGames(div, m, p1, p2, p1decks, p2decks);
        alert(validation.turnWinner ? `Turno vinto da ${validation.turnWinner === 'p1' ? p1.name : p2.name}.` : 'Partite salvate. Il turno non è ancora deciso.');
    });
    });
  });
}

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
      if(result) status.textContent = `Turno vinto da ${result === 'p1' ? p1.name : p2.name}`;
      else if(match.games.length === 3) status.textContent = 'Punteggio 1-1: terza partita necessaria';
      else status.textContent = 'Turno non ancora deciso';
    }
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

  function normalizeDeckSlots(decks){
    const slots = Array.isArray(decks) ? [...decks].slice(0, 3) : [];
    while(slots.length < 3){ slots.push(null); }
    return slots;
  }

  function mergeParticipantsForTournament(existingParticipants = [], incomingParticipants = []){
    const existingById = new Map((existingParticipants || []).map(participant => [String(participant.id), participant]));
    const merged = incomingParticipants.map(incoming => {
      const existing = existingById.get(String(incoming.id));
      return {
        ...(existing || {}),
        ...incoming,
        id: incoming.id,
        name: incoming.name || existing?.name || '',
        decks: normalizeDeckSlots(existing?.decks || incoming?.decks),
        details: existing?.details || incoming?.details || ''
      };
    });

    return merged;
  }

  function mergeMatchesForTournament(existingMatches = [], incomingMatches = []){
    const existingById = new Map((existingMatches || []).map(match => [String(match.id), match]));
    const merged = incomingMatches.map(incoming => {
      const existing = existingById.get(String(incoming.id));
      const normalized = {
        ...(existing || {}),
        ...incoming,
        id: incoming.id,
        round: incoming.round ?? existing?.round ?? 'Senza turno',
        player1_id: incoming.player1_id ?? existing?.player1_id ?? null,
        player2_id: incoming.player2_id ?? existing?.player2_id ?? null,
        player1_name: incoming.player1_name ?? existing?.player1_name ?? '',
        player2_name: incoming.player2_name ?? existing?.player2_name ?? '',
        bans: existing?.bans || { by_p1: null, by_p2: null },
        games: Array.isArray(existing?.games) ? existing.games : (
          Array.isArray(incoming?.games) ? incoming.games : [
            { player1_deck: null, player2_deck: null, winner: '' },
            { player1_deck: null, player2_deck: null, winner: '' }
          ]
        )
      };

      return normalized;
    });

    return merged;
  }

  function validateTurn(match, p1decks, p2decks){
    if(!match.bans || !match.bans.by_p1 || !match.bans.by_p2) return { ok: false, message: 'Seleziona il mazzo bannato da entrambi i giocatori.' };
    syncGamesForScore(match);
    if(match.games.length < 2 || match.games.length > 3) return { ok: false, message: 'Il turno deve contenere almeno 2 e massimo 3 partite.' };
    for(let index = 0; index < match.games.length; index++){
      const game = match.games[index];
      if(!game.player1_deck || !game.player2_deck || !game.winner) return { ok: false, message: `Completa la partita ${index + 1}: seleziona entrambi i mazzi e il vincitore.` };
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
    if(match.games.length === 3 && match.games[0].winner === match.games[1].winner) return { ok: false, message: 'La terza partita non è necessaria: un giocatore ha già vinto le prime due.' };
    if(!turnWinner && match.games.length === 2) return { ok: false, message: 'Dopo 2 partite nessun giocatore ha ancora vinto con entrambi i mazzi: aggiungi la terza partita.' };
    if(!turnWinner) return { ok: false, message: 'Nessun giocatore ha vinto con entrambi i mazzi.' };
    return { ok: true, turnWinner };
}

function normalizeTournamentSlug(value){
  const input = String(value || '').trim();
  if(!input) return '';

  try{
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const parsed = new URL(candidate);
    if(parsed.hostname.toLowerCase().includes('challonge.com')){
      const segments = parsed.pathname.split('/').filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || '');
    }
  }catch(error){
    // Treat non-URL values as regular Challonge slugs.
  }

  return input.replace(/^\/+|\/+$/g, '');
}

async function responseErrorMessage(response){
  const body = await response.text();
  try{
    const parsed = JSON.parse(body);
    if(parsed?.errors) return Array.isArray(parsed.errors) ? parsed.errors.join(', ') : String(parsed.errors);
    if(parsed?.error) return String(parsed.error);
  }catch(error){
    // Keep the original response text for non-JSON errors.
  }
  return body || `Richiesta fallita (${response.status})`;
}

async function fetchFromChallonge(targetSlug = null){
  const slug = normalizeTournamentSlug(targetSlug || document.getElementById('tourneySlug').value);
  if(!slug){ alert('Inserisci lo slug o l\'ID del torneo'); return; }
  try{
    const tournamentInfoRes = await fetch(`/api/tournaments/${encodeURIComponent(slug)}/tournament`);
    if(!tournamentInfoRes.ok) throw new Error(await responseErrorMessage(tournamentInfoRes));
    const tournamentInfo = await tournamentInfoRes.json();
    const tournamentName = tournamentInfo?.tournament?.name || slug;

    const pRes = await fetch(`/api/tournaments/${encodeURIComponent(slug)}/participants`);
    if(!pRes.ok) throw new Error(await responseErrorMessage(pRes));
    const participantsRaw = await pRes.json();
    const incomingParticipants = participantsRaw.map(item => ({
      id: item.participant.id,
      name: item.participant.display_name || item.participant.name || '',
      details: ''
    }));

    const mRes = await fetch(`/api/tournaments/${encodeURIComponent(slug)}/matches`);
    if(!mRes.ok) throw new Error(await responseErrorMessage(mRes));
    const matchesRaw = await mRes.json();
    const incomingMatches = matchesRaw.map(item => ({
      id: item.match.id,
      round: item.match.round,
      player1_id: item.match.player1_id,
      player2_id: item.match.player2_id,
      player1_name: item.match.player1_name,
      player2_name: item.match.player2_name,
      bans: { by_p1: null, by_p2: null },
      games: []
    }));

    const existingTournament = getSavedTournamentById(slug) || null;
    state.participants = mergeParticipantsForTournament(
      Array.isArray(existingTournament?.participants) ? existingTournament.participants : [],
      incomingParticipants
    );
    state.matches = mergeMatchesForTournament(
      Array.isArray(existingTournament?.matches) ? existingTournament.matches : [],
      incomingMatches
    );

    state.activeTournamentId = slug;
    state.code = slug;
    state.name = tournamentName;

    state.participants.forEach(p => {
      p.decks = normalizeDeckSlots(p.decks);
      p.details = p.details || '';
    });

    const savedTournament = {
      id: slug,
      code: slug,
      name: tournamentName,
      participants: state.participants,
      matches: state.matches
    };

    const existingIndex = state.tournaments.findIndex(t => String(t.id) === String(slug));
    if(existingIndex >= 0) state.tournaments[existingIndex] = savedTournament;
    else state.tournaments.unshift(savedTournament);

    saveLocal();
    renderSavedTournaments();
    renderParticipants();
    renderMatches();
  }catch(err){ console.error(err); alert(`Errore caricamento da Challonge: ${err.message}`); }
}

async function refreshSelectedTournament(){
  const selectedSlug = state.activeTournamentId || state.code || document.getElementById('tourneySlug').value.trim();
  if(!selectedSlug){
    alert('Seleziona prima un torneo salvato o inserisci lo slug del torneo.');
    return;
  }
  await fetchFromChallonge(selectedSlug);
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${getExportBaseName()}.json`; a.click(); URL.revokeObjectURL(url);
}

function getExportBaseName(){
  return (state.name || state.code || 'astralia-tournament')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'astralia-tournament';
}

function getDeckName(deckId){
  return getDeckById(deckId)?.name || '';
}

function formatExcelSheet(sheet, columnWidths, options={}){
  const rowCount = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']).e.r + 1 : 0;
  const columnCount = columnWidths.length;
  const lastColumn = XLSX.utils.encode_col(columnCount - 1);
  sheet['!cols'] = columnWidths.map(width=>({ wch: width }));
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  if(rowCount > 1) sheet['!autofilter'] = { ref: `A1:${lastColumn}${rowCount}` };
  sheet['!rows'] = [{ hpt: 25 }];

  for(let rowIndex = 0; rowIndex < rowCount; rowIndex++){
    for(let columnIndex = 0; columnIndex < columnCount; columnIndex++){
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = sheet[address];
      if(!cell) continue;
      cell.s = {
        alignment: { vertical: 'center', wrapText: true },
        ...(rowIndex === 0 ? {
          fill: { fgColor: { rgb: '12304A' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        } : {})
      };
    }
  }

  (options.winnerColumns || []).forEach(columnIndex=>{
    for(let rowIndex = 1; rowIndex < rowCount; rowIndex++){
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      if(sheet[address]?.v) sheet[address].s = {
        ...sheet[address].s,
        fill: { fgColor: { rgb: 'DCFCE7' } },
        font: { bold: true, color: { rgb: '166534' } }
      };
    }
  });
}

function exportExcel(){
  if(typeof XLSX === 'undefined'){
    alert('Esportazione Excel non disponibile. Ricarica la pagina e riprova.');
    return;
  }

  const workbook = XLSX.utils.book_new();
  const participants = [...(state.participants || [])].sort((left, right)=>(left.name || '').localeCompare(right.name || '', 'it'));
  const participantRows = [
    ['Giocatore', 'Mazzo 1', 'Mazzo 2', 'Mazzo 3'],
    ...participants.map(participant=>[
      participant.name || '',
      getDeckName(participant.decks?.[0]),
      getDeckName(participant.decks?.[1]),
      getDeckName(participant.decks?.[2])
    ])
  ];
  const matchRows = [['Turno', 'Giocatore 1', 'Giocatore 2', 'Ban G1', 'Ban G2', 'Vincitore']];
  const gameRows = [['Turno', 'Partita', 'Giocatore 1', 'Mazzo G1', 'Giocatore 2', 'Mazzo G2', 'Vincitore', 'Mazzo vincitore']];
  const roundGroups = new Map();
  (state.matches || []).forEach(match=>{
    const round = match.round ?? 'Senza turno';
    if(!roundGroups.has(round)) roundGroups.set(round, []);
    roundGroups.get(round).push(match);
  });

  [...roundGroups.entries()].sort((left, right)=>String(left[0]).localeCompare(String(right[0]), undefined, { numeric: true })).forEach(([round, matches])=>{
    let matchNumber = 0;
    matches.forEach(match=>{
      const player1 = findParticipantById(match.player1_id) || { name: match.player1_name || '' };
      const player2 = findParticipantById(match.player2_id) || { name: match.player2_name || '' };
      const bye = isByeMatch(match);
      const matchLabel = bye ? 'BYE' : ++matchNumber;
      const matchWinner = match.turn_winner === 'p1' ? player1.name : match.turn_winner === 'p2' ? player2.name : bye ? (player1.name || player2.name) : '';

      // by_p2 is the deck banned from player 1; by_p1 is the deck banned from player 2.
      matchRows.push([
        round,
        player1.name || '',
        player2.name || '',
        getDeckName(match.bans?.by_p2),
        getDeckName(match.bans?.by_p1),
        matchWinner
      ]);
      if(isByeMatch(match)){
        return;
      }

      const games = Array.isArray(match.games) ? match.games : [];
      games.forEach((game, index)=>{
        // Incomplete games are kept in the app state but are not exported as played games.
        if(!game || !game.player1_deck || !game.player2_deck || !game.winner) return;
        const gameWinner = game.winner === 'p1' ? player1.name : player2.name;
        const winningDeck = game.winner === 'p1' ? getDeckName(game.player1_deck) : getDeckName(game.player2_deck);
        gameRows.push([
          round,
          index + 1,
          player1.name || '',
          getDeckName(game.player1_deck),
          player2.name || '',
          getDeckName(game.player2_deck),
          gameWinner,
          winningDeck
        ]);
      });
    });
  });

  const playersSheet = XLSX.utils.aoa_to_sheet(participantRows);
  const matchSheet = XLSX.utils.aoa_to_sheet(matchRows);
  const gamesSheet = XLSX.utils.aoa_to_sheet(gameRows);
  formatExcelSheet(playersSheet, [26, 36, 36, 36]);
  formatExcelSheet(matchSheet, [10, 26, 26, 38, 38, 26], { winnerColumns: [5] });
  formatExcelSheet(gamesSheet, [10, 12, 26, 36, 26, 36, 26, 36], { winnerColumns: [6, 7] });

  XLSX.utils.book_append_sheet(workbook, playersSheet, 'Giocatori');
  XLSX.utils.book_append_sheet(workbook, matchSheet, 'Match');
  XLSX.utils.book_append_sheet(workbook, gamesSheet, 'Partite');
  XLSX.writeFile(workbook, `${getExportBaseName()}.xlsx`, { cellStyles: true });
}

function importFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const importedState = normalizeState(JSON.parse(reader.result));
      if(!importedState) throw new Error('Formato dati non valido');
      state = importedState;
      saveLocal();
      renderParticipants();
      renderMatches();
    }catch(error){
      alert('Impossibile importare i dati: file JSON non valido.');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  try {
    await loadDecks();
  } catch (error) {
    console.error(error);
    alert('Impossibile caricare la lista dei mazzi. Ricarica la pagina o svuota la cache del browser.');
  }
  loadLocal();
  renderSavedTournaments();
  renderParticipants();
  renderMatches();
  document.querySelector('[data-page="participantsPage"]').addEventListener('click', ()=>showPage('participantsPage'));
  document.getElementById('fetchBtn').addEventListener('click', ()=>fetchFromChallonge());
  document.getElementById('refreshSelectedTournamentBtn').addEventListener('click', refreshSelectedTournament);
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  document.getElementById('loadLocalBtn').addEventListener('click', ()=>{ if(!loadLocal()) alert('Nessun dato locale trovato'); });
  document.getElementById('deleteSelectedTournamentBtn').addEventListener('click', ()=>{
    if(!state.activeTournamentId) { alert('Nessun torneo selezionato.'); return; }
    deleteTournamentById(state.activeTournamentId);
  });
  document.getElementById('clearLocalBtn').addEventListener('click', clearLocal);
  document.getElementById('importFile').addEventListener('change', e=>{ if(e.target.files[0]) importFile(e.target.files[0]); });
});
