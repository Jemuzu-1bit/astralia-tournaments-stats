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
