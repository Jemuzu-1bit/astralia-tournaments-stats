const APP_MODULES = [
  'src/js/state.js',
  'src/js/storage.js',
  'src/js/match-rules.js',
  'src/js/decks.js',
  'src/js/match-data.js',
  'src/js/tournament-view.js',
  'src/js/participants-view.js',
  'src/js/games-view.js',
  'src/js/matches-view.js',
  'src/js/challonge.js',
  'src/js/data-export.js',
  'src/js/bootstrap.js'
];

function loadAppModule(index = 0){
  if(index >= APP_MODULES.length) return;
  const script = document.createElement('script');
  script.src = `${APP_MODULES[index]}?v=1`;
  script.onload = () => loadAppModule(index + 1);
  script.onerror = () => console.error(`Impossibile caricare il modulo ${APP_MODULES[index]}.`);
  document.body.appendChild(script);
}

loadAppModule();
