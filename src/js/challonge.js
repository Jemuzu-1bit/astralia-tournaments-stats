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
