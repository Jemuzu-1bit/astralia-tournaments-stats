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
