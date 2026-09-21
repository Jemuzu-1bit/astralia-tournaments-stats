# Astralia Tournament Manager

Dashboard locale per gestire tornei Astralia Chronicles: partecipanti, mazzi, ban e risultati dei turni in un'unica interfaccia.

## Funzionalita

- Importazione di partecipanti e match da Challonge.
- Assegnazione di 3 mazzi per partecipante.
- Un solo mazzo per colore per ogni giocatore: quando viene scelto un colore, gli altri mazzi dello stesso colore scompaiono dagli slot disponibili.
- Colori e gradienti dedicati alle cinque Factions Astralia.
- Rimozione di un mazzo solo dallo slot del partecipante, senza modificare `decks.json`.
- Selezione dei mazzi bannati per match.
- Registrazione dei mazzi usati e dei vincitori delle singole partite.
- Registrazione dei turni conclusi in pareggio o per tempo, anche con partite insufficienti a decidere il turno.
- Calcolo del vincitore del turno e supporto alla terza partita quando il risultato e 1-1.
- Gestione automatica dei bye nei turni con un numero dispari di partecipanti.
- Salvataggio automatico nel `localStorage` del browser.
- Importazione ed esportazione dei dati del torneo in formato JSON.
- Esportazione Excel `.xlsx` pulita con esattamente i fogli `Giocatori`, `Match` e `Partite`, senza ID o dati tecnici.

## Avvio

1. Installa le dipendenze:

	```bash
	npm install
	```

2. Copia `.env.example` in `.env.local`.
3. Inserisci la chiave Challonge in `.env.local`:

	```env
	CHALLONGE_API_KEY=la_tua_api_key
	```

4. Avvia il server:

	```bash
	npm start
	```

5. Apri [http://localhost:8000](http://localhost:8000).

La chiave API viene letta dal backend in `server.js` e non viene mai richiesta o esposta nel browser.

## Utilizzo

1. Inserisci lo slug o l'ID del torneo e clicca **Carica da Challonge**.
2. Assegna i mazzi ai partecipanti. Il colore selezionato viene mostrato direttamente nel controllo del mazzo.
3. Seleziona i ban nella pagina del turno.
4. Scegli i mazzi usati nelle partite e il vincitore.
5. Clicca **Salva risultato** per validare il turno.
	Per un turno concluso in pareggio, seleziona il flag corrispondente. Per un turno finito per tempo, seleziona il flag e il vincitore del turno: saranno salvate anche le sole partite già giocate.
6. Usa gli strumenti JSON per creare un backup o ripristinare i dati.
7. Usa **Esporta Excel** per creare un report `.xlsx` leggibile in Excel.

## File principali

- [index.html](index.html): struttura dell'interfaccia.
- [styles.css](styles.css): manifest CSS che importa i fogli modulari.
- [app.js](app.js): loader sequenziale dei moduli JavaScript.
- [src/js/state.js](src/js/state.js): stato applicativo e caricamento dei mazzi.
- [src/js/storage.js](src/js/storage.js): localStorage, importazione dello stato e gestione tornei.
- [src/js/decks.js](src/js/decks.js): mazzi, colori e vincoli di assegnazione.
- [src/js/match-data.js](src/js/match-data.js): normalizzazione e merge dei partecipanti e dei match.
- [src/js/match-rules.js](src/js/match-rules.js): regole pure per bye, partite, vincitori e validazione dei turni.
- [src/js/tournament-view.js](src/js/tournament-view.js): lista dei tornei salvati.
- [src/js/participants-view.js](src/js/participants-view.js): gestione della vista partecipanti.
- [src/js/games-view.js](src/js/games-view.js): rendering e aggiornamento delle singole partite.
- [src/js/matches-view.js](src/js/matches-view.js): rendering dei turni, ban e flag del risultato.
- [src/js/challonge.js](src/js/challonge.js): client e sincronizzazione Challonge.
- [src/js/data-export.js](src/js/data-export.js): export JSON/Excel e import JSON.
- [src/js/bootstrap.js](src/js/bootstrap.js): avvio dell'interfaccia e listener globali.
- [src/css/foundation.css](src/css/foundation.css): variabili, reset, header e layout base.
- [src/css/navigation.css](src/css/navigation.css): navigazione e tornei salvati.
- [src/css/controls.css](src/css/controls.css): controlli, pulsanti, partecipanti e mazzi.
- [src/css/matches.css](src/css/matches.css): match, flag, turni e partite.
- [src/css/data-tools.css](src/css/data-tools.css): strumenti di backup e import.
- [src/css/responsive.css](src/css/responsive.css): regole responsive.
- [src/css/visual-system.css](src/css/visual-system.css): override del tema visivo, caricato per ultimo.
- [decks.json](decks.json): lista dei mazzi e relativi colori.
- [server.js](server.js): server locale e proxy Challonge.
- [.env.example](.env.example): modello della configurazione locale.

`.env.local` e gli altri file ambiente locali sono esclusi da Git tramite [.gitignore](.gitignore). Non pubblicare mai la chiave API.
