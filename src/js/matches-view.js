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
        `<div class="match-flags"><label><input type="checkbox" class="match-draw" ${m.draw ? 'checked' : ''}> Pareggio</label><label><input type="checkbox" class="match-timed-out" ${m.timed_out ? 'checked' : ''}> Finito per tempo</label></div>`+
        `<label class="turn-winner-control" ${m.timed_out ? '' : 'hidden'}>Vincitore del turno: <select class="turn-winner"><option value="">--Scegli vincitore--</option><option value="p1" ${m.turn_winner === 'p1' ? 'selected' : ''}>${p1.name}</option><option value="p2" ${m.turn_winner === 'p2' ? 'selected' : ''}>${p2.name}</option></select></label>`+
        `<button type="button" data-save="${m.id}">Salva risultato</button>`;
      roundSection.appendChild(div);

      const p1decks = (p1.decks||[]).map(id=>state.decks.find(d=>d.id==id)).filter(Boolean);
      const p2decks = (p2.decks||[]).map(id=>state.decks.find(d=>d.id==id)).filter(Boolean);
      const banSelects = div.querySelectorAll('.ban-select');
      banSelects.forEach(s=>{
        const which = s.dataset.player=='1' ? p2decks : p1decks;
        s.innerHTML = `<option value="">--Nessuno--</option>` + which.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
        const saved = m.bans && (s.dataset.player=='1'? m.bans.by_p1: m.bans.by_p2) || null;
        if(saved) Array.from(s.options).forEach(o=>{ if(Number(o.value)===Number(saved)) o.selected=true; });
        setDeckColor(s, s.value);
        s.addEventListener('change', ()=>{
          const val = s.value? Number(s.value) : null;
          if(!m.bans || !('by_p1' in m.bans)) m.bans = { by_p1: null, by_p2: null };
          if(s.dataset.player=='1') m.bans.by_p1 = val; else m.bans.by_p2 = val;
          saveLocal();
          setDeckColor(s, val);
          renderGames(div, m, p1, p2, p1decks, p2decks);
        });
      });

      const drawFlag = div.querySelector('.match-draw');
      const timedOutFlag = div.querySelector('.match-timed-out');
      const turnWinnerControl = div.querySelector('.turn-winner-control');
      const turnWinnerSelect = div.querySelector('.turn-winner');
      turnWinnerSelect.addEventListener('change', ()=>{
        m.turn_winner = turnWinnerSelect.value || null;
        saveLocal();
        renderGames(div, m, p1, p2, p1decks, p2decks);
      });
      drawFlag.addEventListener('change', ()=>{
        m.draw = drawFlag.checked;
        if(m.draw) m.timed_out = false;
        if(m.draw) m.turn_winner = null;
        turnWinnerControl.hidden = !m.timed_out;
        timedOutFlag.checked = !!m.timed_out;
        saveLocal();
        renderGames(div, m, p1, p2, p1decks, p2decks);
      });
      timedOutFlag.addEventListener('change', ()=>{
        m.timed_out = timedOutFlag.checked;
        if(m.timed_out) m.draw = false;
        if(m.timed_out) m.turn_winner = null;
        if(!m.timed_out) m.turn_winner = null;
        turnWinnerControl.hidden = !m.timed_out;
        drawFlag.checked = !!m.draw;
        saveLocal();
        renderGames(div, m, p1, p2, p1decks, p2decks);
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
