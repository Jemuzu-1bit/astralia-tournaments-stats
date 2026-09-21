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
