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
  const matchRows = [['Turno', 'Giocatore 1', 'Giocatore 2', 'Ban G1', 'Ban G2', 'Vincitore', 'Pareggio', 'Per tempo']];
  const gameRows = [['Turno', 'Partita', 'Giocatore 1', 'Mazzo G1', 'Giocatore 2', 'Mazzo G2', 'Vincitore', 'Mazzo vincitore']];
  const roundGroups = new Map();
  (state.matches || []).forEach(match=>{
    const round = match.round ?? 'Senza turno';
    if(!roundGroups.has(round)) roundGroups.set(round, []);
    roundGroups.get(round).push(match);
  });

  [...roundGroups.entries()].sort((left, right)=>String(left[0]).localeCompare(String(right[0]), undefined, { numeric: true })).forEach(([round, matches])=>{
    matches.forEach(match=>{
      const player1 = findParticipantById(match.player1_id) || { name: match.player1_name || '' };
      const player2 = findParticipantById(match.player2_id) || { name: match.player2_name || '' };
      const bye = isByeMatch(match);
      const matchWinner = match.draw ? '' : match.timed_out
        ? (match.turn_winner === 'p1' ? player1.name : match.turn_winner === 'p2' ? player2.name : '')
        : (match.turn_winner === 'p1' ? player1.name : match.turn_winner === 'p2' ? player2.name : bye ? (player1.name || player2.name) : '');

      matchRows.push([
        round,
        player1.name || '',
        player2.name || '',
        getDeckName(match.bans?.by_p2),
        getDeckName(match.bans?.by_p1),
        matchWinner,
        match.draw ? 'Sì' : '',
        match.timed_out ? 'Sì' : ''
      ]);
      if(isByeMatch(match)) return;

      const games = Array.isArray(match.games) ? match.games : [];
      games.forEach((game, index)=>{
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
  formatExcelSheet(matchSheet, [10, 26, 26, 38, 38, 26, 14, 14], { winnerColumns: [5] });
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
