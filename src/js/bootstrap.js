async function initializeApp(){
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
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
else initializeApp();
