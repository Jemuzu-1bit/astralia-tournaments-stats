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

function showPage(pageId){
  document.querySelectorAll('.page').forEach(page=>page.classList.toggle('active', page.id===pageId));
  document.querySelectorAll('#pagesNav button').forEach(button=>button.classList.toggle('active', button.dataset.page===pageId));
}
