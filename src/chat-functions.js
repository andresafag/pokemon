const POKE_API_BASE = 'https://pokeapi.co/api/v2';

async function pokemonDetails(pokemon) {
  try {
    const url = `${POKE_API_BASE}/pokemon/${pokemon.toLowerCase().trim()}`;
    const response = await axios.get(url);
    return {
      name: response.data.name,
      types: response.data.types.map(t => t.type.name),
      primary_type: response.data.types[0]?.type.name || null,
      secondary_type: response.data.types[1]?.type.name || null,
      base_experience: response.data.base_experience,
      height: response.data.height,
      weight: response.data.weight,
      forms: response.data.forms.map(f => f.name),
      moves: response.data.moves.map(m => m.move.name),
      stats: response.data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
      abilities: response.data.abilities.map(a => a.ability.name)
    };
  } catch (error) {
    return { error: `Pokémon '${pokemon}' was not found.` };
  }
}

async function getTypeInfo(type) {
  try {
    const normalized = String(type || '').trim();
    if (!normalized) {
      return { error: 'Please provide a valid elemental type or Pokémon name.' };
    }

    const knownTypes = [
      'normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
    ];

    const lower = normalized.toLowerCase();
    if (knownTypes.includes(lower)) {
      const url = `${POKE_API_BASE}/type/${lower}`;
      const response = await axios.get(url);
      const dmg = response.data.damage_relations;
      return {
        type: response.data.name,
        double_damage_to: dmg.double_damage_to.map(t => t.name),
        half_damage_to: dmg.half_damage_to.map(t => t.name),
        no_damage_to: dmg.no_damage_to.map(t => t.name),
        double_damage_from: dmg.double_damage_from.map(t => t.name),
        half_damage_from: dmg.half_damage_from.map(t => t.name),
        no_damage_from: dmg.no_damage_from.map(t => t.name),
      };
    }

    const pokemonInfo = await pokemonDetails(normalized);
    if (pokemonInfo && pokemonInfo.error) {
      return { error: `Type or Pokémon '${type}' was not found.` };
    }

    return {
      type: pokemonInfo.primary_type || pokemonInfo.types?.[0] || null,
      types: pokemonInfo.types || [],
      pokemon: pokemonInfo.name,
      message: `Resolved '${pokemonInfo.name}' to type(s): ${Array.isArray(pokemonInfo.types) ? pokemonInfo.types.join(', ') : 'unknown'}.`
    };
  } catch (error) {
    console.error(`Error fetching type '${type}':`, error.message);
    return { error: `Type '${type}' was not found. Please provide a valid elemental type (e.g., electric, ground, psychic).` };
  }
}

async function getStats(statName) {
  try {
    const url = `${POKE_API_BASE}/stat/${statName.toLowerCase().trim()}`;
    const response = await axios.get(url);
    return {
      name: response.data.name,
      is_battle_only: response.data.is_battle_only,
      affecting_moves: response.data.affecting_moves,
      affecting_natures: response.data.affecting_natures,
    };
  } catch (error) {
    return { error: `Stat definition '${statName}' was not found.` };
  }
}

async function getAbilityDetails(abilityName) {
  try {
    const cleanName = abilityName.toLowerCase().trim().replace(/\s+/g, '-');
    const response = await axios.get(`${POKE_API_BASE}/ability/${cleanName}`);
    const textEntry = response.data.effect_entries.find(e => e.language.name === 'en');
    return {
      name: response.data.name,
      effect: textEntry ? textEntry.effect : "Effect description unavailable.",
      pokemon_with_ability: response.data.pokemon.slice(0, 8).map(p => p.pokemon.name)
    };
  } catch (error) {
    return { error: `Ability '${abilityName}' was not found.` };
  }
}

async function getMoveDetails(moveName) {
  try {
    const cleanName = moveName.toLowerCase().trim().replace(/\s+/g, '-');
    const response = await axios.get(`${POKE_API_BASE}/move/${cleanName}`);
    return {
      name: response.data.name,
      power: response.data.power,
      accuracy: response.data.accuracy,
      pp: response.data.pp,
      type: response.data.type.name,
      damage_class: response.data.damage_class.name,
      short_effect: response.data.effect_entries.find(e => e.language.name === 'en')?.short_effect || ""
    };
  } catch (error) {
    return { error: `Move '${moveName}' was not found.` };
  }
}

async function getPokemonHabitat(pokemonName) {
  try {
    const response = await axios.get(`${POKE_API_BASE}/pokemon-habitat/${pokemonName.toLowerCase().trim()}`);
    return {
      name: response.data.name,
      names: response.data.names.map(n => ({ language: n.language.name, name: n.name })),
      pokemon_species: response.data.pokemon_species.map(s => s.name)
    };
  } catch (error) {
    return { error: `Pokemon habitat '${pokemonName}' was not found.` };
  }
}

async function getLocationAreas(pokemonName) {
  try {
    const url = `${POKE_API_BASE}/pokemon/${pokemonName.toLowerCase().trim()}/encounters`;
    const response = await axios.get(url);
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      return { 
        pokemon: pokemonName, 
        locations: [], 
        message: "This Pokémon cannot be found in the wild (it might be an evolution-only, gift, or event Pokémon)." 
      };
    }

    const locations = response.data.slice(0, 10).map(encounter => ({
      area_name: encounter.location_area.name,
      games: encounter.version_details.map(v => v.version.name)
    }));

    return {
      pokemon: pokemonName,
      encounter_locations: locations
    };
  } catch (error) {
    console.error(`Error fetching locations for '${pokemonName}':`, error.message);
    return { error: `Encounter locations for Pokémon '${pokemonName}' were not found.` };
  }
}

async function getEvolutionChain(pokemonName) {
  try {
    const speciesRes = await axios.get(`${POKE_API_BASE}/pokemon-species/${pokemonName.toLowerCase().trim()}`);
    const chainRes = await axios.get(speciesRes.data.evolution_chain.url);
    
    const parseChain = (node) => {
      let results = [];
      results.push({
        name: node.species.name,
        method: node.evolution_details ? {
          trigger: node.evolution_details[0]?.trigger?.name || "Unknown",
          min_level: node.evolution_details[0]?.min_level || "N/A",
          item: node.evolution_details[0]?.item?.name || null
        } : "Base Form"
      });
      for (let branch of node.evolves_to) {
        results = results.concat(parseChain(branch));
      }
      return results;
    };

    return { evolution_line: parseChain(chainRes.data.chain) };
  } catch (error) {
    return { error: `Could not retrieve evolutionary data for '${pokemonName}'.` };
  }
}

async function listPokemonByType(type) {
  try {
    const response = await axios.get(`${POKE_API_BASE}/type/${type.toLowerCase().trim()}`);
    return {
      type: response.data.name,
      members: response.data.pokemon.map(p => p.pokemon.name)
    };
  } catch (error) {
    return { error: `Type '${type}' was not found.` };
  }
}

module.exports = {
  getTypeInfo,
  pokemonDetails,
  getStats,
  getAbilityDetails,
  getMoveDetails,
  getPokemonHabitat,
  getLocationAreas,
  getEvolutionChain,
  listPokemonByType
};