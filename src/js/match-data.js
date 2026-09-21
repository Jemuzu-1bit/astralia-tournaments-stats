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
