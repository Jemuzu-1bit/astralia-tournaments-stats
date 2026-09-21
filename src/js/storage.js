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
