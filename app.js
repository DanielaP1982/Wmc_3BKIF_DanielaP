import { getSavedStates, saveStepState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepsContainer = document.getElementById('steps-container');
    const radioContainer = document.getElementById('radio-container');

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

    // 2. INSPIRATIONS-SEITE LOGIK
    if (radioContainer) {
        fetchRadioStations();
    }
});

/* --- OPTIMIERTER RADIO-FETCH --- */
async function fetchRadioStations() {
    const container = document.getElementById('radio-container');
    if (!container) return; // Sicherheitscheck

    container.innerHTML = "<p style='color: #a0a5b5; text-align: center;'>Lade Sender...</p>";
    
    // Wir nutzen eine breitere Suche und lassen die API die Arbeit machen
    const url = "https://all.api.radio-browser.info/json/stations/search?limit=3&hidebroken=true&order=clickcount&reverse=true&tagList=techno,house,dance";
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);
        
        const stations = await response.json();
        
        if (stations.length === 0) {
            container.innerHTML = "<p style='color: white; text-align: center;'>Keine Sender gefunden.</p>";
            return;
        }

        container.innerHTML = ""; // Container leeren für die Ergebnisse

        stations.forEach(station => {
            const radioCard = document.createElement("div");
            radioCard.className = "radio-card";
            
            // Fallback für fehlende Genre-Tags
            const genre = station.tags ? station.tags.split(',')[0] : "Elektronisch";
            
            radioCard.innerHTML = `
                <h3 class="radio-title">${station.name}</h3>
                <p class="radio-meta">🌍 Land: ${station.country || "Unbekannt"} | Genre: ${genre}</p>
                <audio controls src="${station.url_resolved}"></audio>
            `;
            
            container.appendChild(radioCard);
        });

    } catch (error) {
        console.error("Radio-Fehler:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Fehler beim Laden der Sender.</p>";
    }
}
