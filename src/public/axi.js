const grid = document.querySelector('.pokemon-grid');
const searchForm = document.querySelector('.pokemon-search');
const searchInput = document.querySelector('.pokemon-input');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const pageLabel = document.querySelector('.results-label strong');
const cardCover = document.querySelector('.cardCover');

const state = {
  offset: 0,
  pageSize: 9,
};

function getPokemonImageUrl(id) {
  const formattedId = String(id).padStart(3, '0');
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
}

function formatPokemonName(name) {
  return name.replace(/-/g, ' ');
}

async function fetchPokemonList(offset, limit = state.pageSize) {
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
  return response.data.results;
}

async function fetchPokemonDetails(name) {
  const [pokemonResponse, speciesResponse] = await Promise.all([
    axios.get(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`),
    axios.get(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase()}/`),
  ]);

  return {
    pokemon: pokemonResponse.data,
    species: speciesResponse.data,
  };
}

function createPokemonCard(details) {
  const { pokemon, species } = details;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'pokemon-card';

  const types = pokemon.types.map((item) => item.type.name).join(', ');

  card.innerHTML = `
    <div class="card-sprite-wrap">
      <img src="${getPokemonImageUrl(pokemon.id)}" alt="${pokemon.name}">
    </div>
    <h3>${formatPokemonName(pokemon.name)}</h3>
    <span class="pokemon-meta">#${String(pokemon.id).padStart(3, '0')} · ${types}</span>
  `;

  card.addEventListener('click', () => openPokemonModal(details));

  return card;
}

function updatePaginationButtons() {
  prevBtn.disabled = state.offset === 0;
  pageLabel.textContent = String((state.offset / state.pageSize) + 1);
}

function renderLoadingState() {
  grid.innerHTML = '<div class="loading">Loading Pokémon…</div>';
}

async function loadPokemonPage(offset = 0) {
  renderLoadingState();
  state.offset = offset;

  const list = await fetchPokemonList(state.offset, state.pageSize);
  const details = await Promise.all(list.map((pokemon) => fetchPokemonDetails(pokemon.name)));

  grid.innerHTML = '';
  details.forEach((detail) => {
    const card = createPokemonCard(detail);
    grid.appendChild(card);
  });

  updatePaginationButtons();
}

function hideModal() {
  cardCover.classList.remove('cardCoverVisible');
  cardCover.innerHTML = '';
}

function openPokemonModal(details) {
  const { pokemon, species } = details;
  const abilities = pokemon.abilities.map((item) => item.ability.name).join(', ');
  const habitat = species.habitat ? species.habitat.name : 'Unknown';
  const evolution = species.evolves_from_species ? species.evolves_from_species.name : 'No previous evolution';
  const shape = species.shape ? species.shape.name : 'Unknown';

  cardCover.innerHTML = `
    <div class="cardContainer">
      <div class="closeBox" aria-label="Close Pokemon modal">
        <i class="fa-solid fa-circle-xmark" style="font-size: 20px;"></i>
      </div>
      <div class="modal-body">
        <div class="modal-sprite">
          <img src="${getPokemonImageUrl(pokemon.id)}" alt="${pokemon.name}">
        </div>
        <div class="modal-info">
          <h2>${formatPokemonName(pokemon.name)}</h2>
          <p><strong>Number:</strong> #${String(pokemon.id).padStart(3, '0')}</p>
          <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
          <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
          <p><strong>Color:</strong> ${species.color ? species.color.name : 'Unknown'}</p>
          <p><strong>Habitat:</strong> ${habitat}</p>
          <p><strong>Shape:</strong> ${shape}</p>
          <p><strong>Type:</strong> ${pokemon.types.map((item) => item.type.name).join(', ')}</p>
          <p><strong>Evolved from:</strong> ${formatPokemonName(evolution)}</p>
          <div>
            <strong>Abilities:</strong>
            <ul class="ability-list">
              ${pokemon.abilities.map((item) => `<li>${item.ability.name}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  const closeButton = cardCover.querySelector('.closeBox');
  closeButton.addEventListener('click', hideModal);
  cardCover.addEventListener('click', (event) => {
    if (event.target === cardCover) {
      hideModal();
    }
  });

  cardCover.classList.add('cardCoverVisible');
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    loadPokemonPage(state.offset);
    return;
  }

  try {
    const details = await fetchPokemonDetails(query);
    openPokemonModal(details);
  } catch (error) {
    alert('Pokemon not found. Please try another name.');
  }
});

prevBtn.addEventListener('click', () => {
  if (state.offset === 0) return;
  loadPokemonPage(Math.max(0, state.offset - state.pageSize));
});

nextBtn.addEventListener('click', () => {
  loadPokemonPage(state.offset + state.pageSize);
});

loadPokemonPage(0);

const floatingChat = document.querySelector('.floating-chat');
const floatingToggle = document.querySelector('.floating-toggle');
const chatForm = document.querySelector('.chat-form');
const floatingInput = document.querySelector('.floating-input');

if (floatingChat && floatingToggle && chatForm && floatingInput) {
  floatingToggle.addEventListener('click', () => {
    const isOpen = floatingChat.classList.toggle('open');
    console.log('clicked');
    floatingToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      floatingInput.focus();
    }
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = floatingInput.value.trim();

    if (!value) {
      floatingInput.focus();
      return;
    }

    floatingInput.value = '';
    floatingInput.style.fontWeight = 'bold';
    floatingInput.placeholder = 'Thinking...';

    let currentText = '';
    let thinkingInterval = setInterval(() => {
      const dots = (Date.now() / 1000).toFixed(0) % 4;
      floatingInput.value = `Thinking${'.'.repeat(dots || 1)}`;
    }, 250);

    try {
      const response = await fetch('/analisis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming response unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) {
            continue;
          }

          const lines = part.split('\n');
          const eventLine = lines.find((line) => line.startsWith('event:'));
          const dataLine = lines.find((line) => line.startsWith('data:'));

          if (!dataLine) {
            continue;
          }

          const eventName = eventLine ? eventLine.replace('event:', '').trim() : 'message';
          let payload;

          try {
            payload = JSON.parse(dataLine.replace(/^data:\s*/, ''));
          } catch (error) {
            console.error('Failed to parse SSE payload', error);
            continue;
          }

          if (eventName === 'chunk') {
            clearInterval(thinkingInterval);
            currentText = payload.fullText || currentText + (payload.chunk || '');
            floatingInput.value = currentText;
            floatingInput.style.fontWeight = 'normal';
            continue;
          }

          if (eventName === 'done') {
            clearInterval(thinkingInterval);
            currentText = payload.text || currentText;
            floatingInput.value = currentText;
            floatingInput.style.fontWeight = 'normal';
            floatingInput.placeholder = 'Type a message...';
            continue;
          }

          if (eventName === 'error') {
            clearInterval(thinkingInterval);
            floatingInput.value = payload.error || 'Error compiling live server stats.';
            floatingInput.style.fontWeight = 'normal';
            floatingInput.placeholder = 'Type a message...';
          }
        }
      }

      clearInterval(thinkingInterval);
      floatingInput.style.fontWeight = 'normal';
      floatingInput.placeholder = 'Type a message...';

      if (!currentText.trim()) {
        floatingInput.value = 'Error compiling live server stats.';
      }
    } catch (error) {
      clearInterval(thinkingInterval);
      console.error('Frontend payload error collection:', error);
      floatingInput.value = 'Error compiling live server stats.';
      floatingInput.style.fontWeight = 'normal';
      floatingInput.placeholder = 'Type a message...';
    }
  });
}
