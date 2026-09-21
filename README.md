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
- [styles.css](styles.css): sistema visivo Astralia e layout responsive.
- [app.js](app.js): stato locale, selezioni, validazioni e rendering.
- [decks.json](decks.json): lista dei mazzi e relativi colori.
- [server.js](server.js): server locale e proxy Challonge.
- [.env.example](.env.example): modello della configurazione locale.

`.env.local` e gli altri file ambiente locali sono esclusi da Git tramite [.gitignore](.gitignore). Non pubblicare mai la chiave API.
