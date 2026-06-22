import { getSavedStates, saveStepState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepsContainer = document.getElementById('steps-container');
    const radioContainer = document.getElementById('radio-container');
    

    // 1. TECHNIK-SEITE LOGIK (Lernkarten & JSON)

    if (stepsContainer) {
        let allSteps = []; 
        
        let showOnlyUnlearned = localStorage.getItem('showOnlyUnlearned') === 'true';

        const filterBtn = document.getElementById('toggle-filter-btn');

        if (filterBtn) {
            filterBtn.textContent = showOnlyUnlearned ? 'Alle Schritte anzeigen' : 'Nur ungelernte Schritte anzeigen';
        }

        /* --- FETCH VERWENDEN --- */
        fetch('steps.json')
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

        /* --- DOM-NODES ERZEUGEN, LÖSCHEN & AUSTAUSCHEN --- */
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
                button.setAttribute('data-step', step.id);

                const isLearned = !!savedStates[step.id];
                if (isLearned) {
                    card.classList.add('is-learned');
                    button.textContent = 'Gelernt! ✅';
                } else {
                    button.textContent = 'Als gelernt markieren';
                }

                button.addEventListener('click', () => {
                    const isCurrentlyLearned = card.classList.toggle('is-learned');
                    
                    if (isCurrentlyLearned) {
                        button.textContent = 'Gelernt! ✅';
                    } else {
                        button.textContent = 'Als gelernt markieren';
                    }

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

        // Event-Listener für den Filter-Button (Austauschen der Ansicht)
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                showOnlyUnlearned = !showOnlyUnlearned;
                
                localStorage.setItem('showOnlyUnlearned', showOnlyUnlearned);
                
                filterBtn.textContent = showOnlyUnlearned ? 'Alle Schritte anzeigen' : 'Nur ungelernte Schritte anzeigen';
                renderSteps(); // Löst das Löschen und Neu-Erzeugen der Nodes aus
            });
        }
    }


    // 2. INSPIRATIONS-SEITE LOGIK (Public API Live-Radio)

    if (radioContainer) {
        fetchRadioStations();
    }
});

/* --- ASYNCHRONER FETCH FÜR DIE RADIO-API --- */
async function fetchRadioStations() {
    const container = document.getElementById('radio-container');
    
    container.innerHTML = "<p style='color: #a0a5b5; grid-column: 1 / -1; text-align: center;'>Live-Sender werden geladen...</p>";
    
    try {
        const response = await fetch("https://de1.api.radio-browser.info/json/stations/search?tag=house&limit=3&hidebroken=true&order=clickcount&reverse=true");
        
        if (!response.ok) {
            throw new Error("API-Verbindungsfehler");
        }
        
        const stations = await response.json();
        container.innerHTML = "";

        stations.forEach(station => {
            const radioCard = document.createElement("div");
            radioCard.className = "radio-card";
            
            radioCard.innerHTML = `
                <h3 class="radio-title">${station.name.trim()}</h3>
                <p class="radio-meta">🌍 Land: ${station.country || "International"}</p>
                <audio controls class="radio-player" src="${station.url_resolved}" preload="none"></audio>
            `;
            
            container.appendChild(radioCard);
        });

    } catch (error) {
        console.error("Fehler beim Laden der Radio-API:", error);
        container.innerHTML = `
            <p style="color: #ff3333; grid-column: 1 / -1; text-align: center;">
                Radiosender konnten momentan nicht geladen werden. Bitte versuche es später noch einmal.
            </p>`;
    }
}
