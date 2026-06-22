import { getSavedStates, saveStepState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepsContainer = document.getElementById('steps-container');
    const beatsContainer = document.getElementById('beats-container'); // Saubere neue ID

    // 1. TECHNIK-SEITE LOGIK
    if (stepsContainer) {
        let allSteps = []; 
        let showOnlyUnlearned = localStorage.getItem('showOnlyUnlearned') === 'true';
        const filterBtn = document.getElementById('toggle-filter-btn');

        if (filterBtn) {
            filterBtn.textContent = showOnlyUnlearned ? 'Alle Schritte anzeigen' : 'Nur ungelernte Schritte anzeigen';
        }

        fetch('./steps.json')
            .then(response => {
                if (!response.ok) throw new Error('Fehler beim Laden der JSON-Daten');
                return response.json();
            })
            .then(data => {
                allSteps = data; 
                renderSteps();   
            })
            .catch(error => {
                console.error('Fetch-Fehler:', error);
                stepsContainer.innerHTML = '<p style="color: red; text-align: center;">Tanzschritte konnten nicht geladen werden.</p>';
            });

        function renderSteps() {
            stepsContainer.innerHTML = '';
            const savedStates = getSavedStates();
            const filteredSteps = showOnlyUnlearned 
                ? allSteps.filter(step => !savedStates[step.id]) 
                : allSteps;
            
            filteredSteps.forEach(step => {
                const card = document.createElement('article');
                card.className = 'card';
                card.id = step.id;

                const imgContainer = document.createElement('div');
                imgContainer.className = 'card-img-container';
                const img = document.createElement('img');
                img.src = step.image;
                img.alt = step.title;
                imgContainer.appendChild(img);

                const h3 = document.createElement('h3');
                h3.textContent = step.title;
                const p = document.createElement('p');
                p.textContent = step.description;

                const button = document.createElement('button');
                button.className = 'btn learn-btn';
                const isLearned = !!savedStates[step.id];
                if (isLearned) {
                    card.classList.add('is-learned');
                    button.textContent = 'Gelernt! ✅';
                } else {
                    button.textContent = 'Als gelernt markieren';
                }

                button.addEventListener('click', () => {
                    const isCurrentlyLearned = card.classList.toggle('is-learned');
                    button.textContent = isCurrentlyLearned ? 'Gelernt! ✅' : 'Als gelernt markieren';
                    saveStepState(step.id, isCurrentlyLearned);
                    if (showOnlyUnlearned && isCurrentlyLearned) {
                        setTimeout(() => { renderSteps(); }, 300);
                    }
                });

                card.appendChild(imgContainer);
                card.appendChild(h3);
                card.appendChild(p);
                card.appendChild(button);
                stepsContainer.appendChild(card);
            });
        }

        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                showOnlyUnlearned = !showOnlyUnlearned;
                localStorage.setItem('showOnlyUnlearned', showOnlyUnlearned);
                filterBtn.textContent = showOnlyUnlearned ? 'Alle Schritte anzeigen' : 'Nur ungelernte Schritte anzeigen';
                renderSteps(); 
            });
        }
    }

    // 2. INSPIRATIONS-SEITE LOGIK (Mit umbenannter Funktion)
    if (beatsContainer) {
        fetchTrackPreviews();
    }
});

/* --- ITUNES BEATS-FETCH (Semantisch sauber benannt) --- */
async function fetchTrackPreviews() {
    const container = document.getElementById('beats-container');
    if (!container) return; 

    container.innerHTML = "<p style='color: #a0a5b5; text-align: center;'>Lade Übungs-Beats...</p>";
    
    // Suche nach Electro House Songs
    const url = "https://itunes.apple.com/search?term=electro+house&limit=3&entity=song";
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.resultCount === 0) {
            container.innerHTML = "<p style='color: white; text-align: center;'>Keine Tracks gefunden.</p>";
            return;
        }

        container.innerHTML = ""; 

        data.results.forEach(track => {
            const beatCard = document.createElement("div");
            beatCard.className = "radio-card"; // Wir behalten vorerst die CSS-Klasse, damit das Styling greift!
            
            // Reines Track-Design: Cover, Titel, Künstler, Land und Player
            beatCard.innerHTML = `
                <img src="${track.artworkUrl100.replace('100x100bb', '200x200bb')}" alt="Cover" style="width: 120px; height: 120px; border-radius: 10px; margin-bottom: 15px; border: 2px solid rgb(43, 255, 0);">
                <h3 class="radio-title" title="${track.trackName}">${track.trackName}</h3>
                <p class="radio-meta">👤 von ${track.artistName} | 🌍 ${track.country}</p>
                <audio controls src="${track.previewUrl}" style="width: 100%;"></audio>
            `;
            
            container.appendChild(beatCard);
        });

    } catch (error) {
        console.error("iTunes-Fehler:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Beats konnten nicht geladen werden.</p>";
    }
}
