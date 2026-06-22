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

/* --- ROBUSTER RADIO-FETCH (Ohne Länderfilter) --- */
async function fetchRadioStations() {
    const container = document.getElementById('radio-container');
    container.innerHTML = "<p style='color: #a0a5b5; text-align: center;'>Sender werden geladen...</p>";
    const url = "https://all.api.radio-browser.info/json/stations/search?tagList=techno,dance,electronic&limit=15&hidebroken=true&order=clickcount&reverse=true&bitratemin=128";
    
    try {
        const response = await fetch(url);
        const stations = await response.json();
        container.innerHTML = "";

        let addedCount = 0;
        
        for (const station of stations) {
            if (addedCount >= 3) break;

            const secureUrl = station.url_resolved.replace("http://", "https://");
            const radioCard = document.createElement("div");
            radioCard.className = "radio-card";
            
            radioCard.innerHTML = `
                <h3 class="radio-title">${station.name.trim()}</h3>
                <p class="radio-meta">🌍 Land: ${station.country || "International"}</p>
                <audio controls class="radio-player" src="${secureUrl}" preload="none"></audio>
            `;
            
            const audio = radioCard.querySelector('audio');
            
            // Timer: Wenn nach 6 Sekunden nichts spielt, Karte entfernen
            const watchdog = setTimeout(() => {
                if (audio.currentTime === 0) radioCard.style.display = 'none';
            }, 6000);

            audio.onplay = () => clearTimeout(watchdog);
            audio.onerror = () => { radioCard.style.display = 'none'; };
            
            container.appendChild(radioCard);
            addedCount++;
        }
        
        if (addedCount === 0) throw new Error("Keine stabilen Sender gefunden.");

    } catch (error) {
        console.error("Radio-Fehler:", error);
        container.innerHTML = "<p style='color: #ff3333;'>Radiosender konnten nicht geladen werden.</p>";
    }
}
