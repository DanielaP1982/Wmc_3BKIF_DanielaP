import { getSavedStates, saveStepState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepsContainer = document.getElementById('steps-container');
    const beatsContainer = document.getElementById('beats-container');

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
    if (beatsContainer) {
        fetchTrackPreviews();
    }
});

/* --- ITUNES BEATS-FETCH --- */
async function fetchTrackPreviews() {
    const container = document.getElementById('beats-container');
    if (!container) return; 

    container.innerHTML = "<p style='color: #a0a5b5; text-align: center;'>Lade Übungs-Beats...</p>";
    
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
            beatCard.className = "radio-card"; 
            beatCard.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; height: 100%; justify-content: space-between;">
                    <img src="${track.artworkUrl100.replace('100x100bb', '150x150bb')}" alt="Cover" style="width: 100px; height: 100px; border-radius: 8px; margin-bottom: 10px; border: 2px solid rgb(43, 255, 0);">
                    <h3 class="radio-title" title="${track.trackName}" style="font-size: 1.1rem; width: 100%; margin: 5px 0;">${track.trackName}</h3>
                    <p class="radio-meta" style="margin: 0 0 15px 0; font-size: 0.85em;">👤 ${track.artistName}<br>🌍 ${track.country}</p>
                    <audio controls src="${track.previewUrl}" style="width: 100%; max-width: 240px;"></audio>
                </div>
            `;
            
            container.appendChild(beatCard);
        });

    } catch (error) {
        console.error("iTunes-Fehler:", error);
        container.innerHTML = "<p style='color: red; text-align: center;'>Beats konnten nicht geladen werden.</p>";
    }
}
