import { getSavedStates, saveStepState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const stepsContainer = document.getElementById('steps-container');
    
    if (!stepsContainer) return;

    let allSteps = []; 
    let showOnlyUnlearned = false;

    const filterBtn = document.getElementById('toggle-filter-btn');

    /* --- FETCH VERWENDEN --- */
    fetch('steps.json')
        .then(response => {
            if (!response.ok) throw new Error('Fehler beim Laden der JSON-Daten');
            return response.json();
        })
        .then(data => {
            allSteps = data; // Daten im Array speichern
            renderSteps();   // Erste Darstellung im DOM erzeugen
        })
        .catch(error => {
            console.error('Fetch-Fehler:', error);
            stepsContainer.innerHTML = '<p style="color: red; text-align: center;">Tanzschritte konnten nicht geladen werden.</p>';
        });

    /* --- DOM-NODES ERZEUGEN, LÖSCHEN & AUSTAUSCHEN --- */
    function renderSteps() {
        // LÖSCHEN: Container leeren (alte Nodes fliegen komplett aus dem DOM)
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
  
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            showOnlyUnlearned = !showOnlyUnlearned;
            filterBtn.textContent = showOnlyUnlearned ? 'Alle Schritte anzeigen' : 'Nur ungelernte Schritte anzeigen';
            renderSteps(); 
        });
    }
});
