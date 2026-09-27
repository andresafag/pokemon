const OpenAI = require("openai");
const axios = require("axios");
require('dotenv/config');

const POKE_API_BASE = 'https://pokeapi.co/api/v2';

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com', 
  apiKey: process.env.DEEP_SEEK_API_KEY,
});

function assertEnvKey() {
  if (!process.env.DEEP_SEEK_API_KEY) {
    throw new Error('DEEP_SEEK_API_KEY is not set. Please set the environment variable.');
  }
}


async function deepseekChatFallback(payload) {
  const url = 'https://deepseek.com/chat/completions';
  const headers = {
    'Authorization': `Bearer ${process.env.DEEP_SEEK_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const resp = await axios.post(url, payload, { headers });
    return resp.data;
  } catch (err) {
    if (err.response) {
      const e = new Error(`DeepSeek fallback request failed: ${err.response.status} ${err.response.statusText}`);
      e.details = { status: err.response.status, data: err.response.data };
      throw e;
    }
    throw err;
  }
}


async function getTypeInfo(type) { // Changed argument name to 'type'
  try {
    const url = `${POKE_API_BASE}/type/${type.toLowerCase().trim()}`;
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
  } catch (error) {
    console.error(`Error fetching type '${type}':`, error.message);
    return { error: `Type '${type}' was not found. Please provide a valid elemental type (e.g., electric, ground, psychic).` };
  }
}


async function pokemonDetails(pokemon) {
  try {
    const url = `${POKE_API_BASE}/pokemon/${pokemon.toLowerCase().trim()}`;
    const response = await axios.get(url);
    return {
      name: response.data.name,
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
    
    // Como es un array, validamos que tenga datos
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

const tools = [
  {
  type: "function",
  function: {
    name: "getTypeInfo",
    description: "Fetch elemental type matchup charts. Do NOT pass Pokémon names here. Pass valid elemental type keywords only.",
    parameters: {
      type: "object",
      properties: { 
        type: { 
          type: "string", 
          description: "The elemental type keyword to query (e.g., electric, ground, psychic, dark, ghost)." 
        } 
      },
      required: ["type"],
    },
  },
},
  {
    type: "function",
    function: {
      name: "pokemonDetails",
      description: "Get types, base stats, moves, and abilities of a specific Pokémon.",
      parameters: {
        type: "object",
        properties: { pokemon: { type: "string", description: "Name of the Pokémon (e.g., pikachu, tyranitar)." } },
        required: ["pokemon"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getStats",
      description: "Get rules and structural metadata around specialized battle statistics.",
      parameters: {
        type: "object",
        properties: { statName: { type: "string", description: "Name of the stat (e.g., speed, attack)." } },
        required: ["statName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAbilityDetails",
      description: "Get the exact battle effects and mechanics of a specific passive ability.",
      parameters: {
        type: "object",
        properties: { abilityName: { type: "string", description: "The system name of the ability (e.g., levitate)." } },
        required: ["abilityName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMoveDetails",
      description: "Get the numerical power, category accuracy, and description of a targeted move.",
      parameters: {
        type: "object",
        properties: { moveName: { type: "string", description: "The move text to search (e.g., earthquake)." } },
        required: ["moveName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getEvolutionChain",
      description: "Retrieves complete evolutionary sequence maps and trigger milestones for a creature.",
      parameters: {
        type: "object",
        properties: { pokemonName: { type: "string", description: "A Pokémon within the lineage tree." } },
        required: ["pokemonName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listPokemonByType",
      description: "Lists all standard entity names belonging to a specified typing catalog.",
      parameters: {
        type: "object",
        properties: { type: { type: "string", description: "The base elemental configuration label." } },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getHabitat",
      description: "Get the habitat of a specific Pokémon.",
      parameters: {
        type: "object",
        properties: { pokemonName: { type: "string", description: "The name of the Pokémon (e.g., pikachu)." } },
        required: ["pokemonName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLocationAreas",
      description: "Retrieves a list of wild areas and game versions where a specific Pokémon can be caught.",
      parameters: {
        type: "object",
        properties: { pokemonName: { type: "string", description: "The name of the Pokémon to look up (e.g., pikachu, mewtwo)." }},
        required: ["pokemonName"],
      },
    },
  }
];

/**
 * Core Operational Handler
 */
async function ejecutarAnalisisEstrategico(userInput) {
  const messages = [
    { 
      role: "system", 
      content: "You are a strategic and competitive Pokémon analyst. Your goal is to answer theoretical questions and matchups using raw data. When asked if a general rule always applies, you should use the tools to search for logical exceptions (such as dual-typing protection or elemental-absorbing abilities). Provide an analytical, well-structured response justifying your conclusions. Do not use DSML or XML tags; rely entirely on your native tools."
    },
    { 
      role: "user", 
      content: userInput
    }
  ];

  try {
    console.log("Analyzing strategic user request...");
    assertEnvKey();

    let loopActive = true;
    let currentPass = 1;

    while (loopActive) {
      console.log(`\n--- DeepSeek Reasoning Pass #${currentPass} ---`);
      
      let respuesta;
      try {
        respuesta = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: messages,
          tools: tools,
          tool_choice: "auto"
        });
      } catch (err) {
        if (err && err.status === 403) {
          console.warn('OpenAI client returned 403 — attempting axios POST fallback to DeepSeek.');
          respuesta = await deepseekChatFallback({ model: "deepseek-chat", messages: messages, tools });
        } else {
          throw err;
        }
      }

      const choice = respuesta.choices && respuesta.choices[0];
      const mensajeDeIA = choice && choice.message;

      if (!mensajeDeIA) {
        console.error("No message received from DeepSeek API.");
        break;
      }

      if (mensajeDeIA.tool_calls && mensajeDeIA.tool_calls.length > 0) {
        console.log(`The AI requested ${mensajeDeIA.tool_calls.length} native tool call(s)...`);
        messages.push(mensajeDeIA); 

        for (const toolCall of mensajeDeIA.tool_calls) {
          const nombreFuncion = toolCall.function.name;
          const argumentos = JSON.parse(toolCall.function.arguments);
          let resultado;

          if (nombreFuncion === "getTypeInfo") {
            const typeArg = argumentos.type || argumentos.pokemon || "";
            console.log(`-> Executing native tool: getTypeInfo for query: [${typeArg}]`);
            resultado = await getTypeInfo(typeArg);
          } 
          else if (nombreFuncion === "pokemonDetails") {
            const pokeArg = argumentos.pokemon || argumentos.pokemonName || "";
            console.log(`-> Executing native tool: pokemonDetails for query: [${pokeArg}]`);
            resultado = await pokemonDetails(pokeArg);
          }
          else if (nombreFuncion === "getStats") {
            const statArg = argumentos.statName || "";
            console.log(`-> Executing native tool: getStats for query: [${statArg}]`);
            resultado = await getStats(statArg);
          }
          else if (nombreFuncion === "getAbilityDetails") {
            const abilityArg = argumentos.abilityName || argumentos.ability || "";
            console.log(`-> Executing native tool: getAbilityDetails for query: [${abilityArg}]`);
            resultado = await getAbilityDetails(abilityArg);
          } 
          else if (nombreFuncion === "getMoveDetails") {
            const moveArg = argumentos.moveName || "";
            console.log(`-> Executing native tool: getMoveDetails for query: [${moveArg}]`);
            resultado = await getMoveDetails(moveArg);
          } 
          else if (nombreFuncion === "getEvolutionChain") {
            const evoArg = argumentos.pokemonName || argumentos.pokemon || "";
            console.log(`-> Executing native tool: getEvolutionChain for query: [${evoArg}]`);
            resultado = await getEvolutionChain(evoArg);
          } 
          else if (nombreFuncion === "listPokemonByType") {
            const typeListArg = argumentos.type || "";
            console.log(`-> Executing native tool: listPokemonByType for query: [${typeListArg}]`);
            resultado = await listPokemonByType(typeListArg);
          } else if (nombreFuncion === "getHabitat") {
            const habitatArg = argumentos.pokemonName || argumentos.pokemon || "";
            console.log(`-> Executing native tool: getHabitat for query: [${habitatArg}]`);
            resultado = await getPokemonHabitat(habitatArg);
          } else if (nombreFuncion === "getLocationAreas") {
            const locationArg = argumentos.pokemonName || argumentos.pokemon || "";
            console.log(`-> Executing native tool: getLocationAreas for query: [${locationArg}]`);
            resultado = await getLocationAreas(locationArg);
          }
          else {
            console.log(`-> Warning: Model requested unknown tool: ${nombreFuncion}`);
            resultado = { error: `Tool ${nombreFuncion} not found.` };
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: nombreFuncion,
            content: JSON.stringify(resultado),
          });
        }

        currentPass++;

      } else {
        console.log("\n--- PROCESSING FINAL STRATEGIC SUMMARY AS ENCAPSULATED JSON ---");
        loopActive = false; 

        // Force a final JSON-structured turn so the response is safely isolated
        messages.push({
          role: "user",
          content: "Now format your comprehensive conclusion into a JSON object containing the keys: 'success' (boolean), 'query' (string), and 'analysis' (string containing the clean competitive markdown formatting text description)."
        });

        let finalPassResponse;
        try {
          finalPassResponse = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: messages,
            response_format: { type: "json_object" } // Enforces pure JSON output structure
          });
        } catch (err) {
          if (err && err.status === 403) {
            finalPassResponse = await deepseekChatFallback({
              model: "deepseek-chat",
              messages: messages,
              response_format: { type: "json_object" }
            });
          } else {
            throw err;
          }
        }

        const finalChoice = finalPassResponse.choices && finalPassResponse.choices[0];
        const finalMessage = finalChoice && finalChoice.message;
        
        // Return parsed pure string content object
        return JSON.parse(finalMessage.content); 
      }
    }

  } catch (error) {
    console.error("Critical Execution Error:", error);
    return { success: false, query: userInput, analysis: "Internal error processing tournament data." };
  }
}


module.exports = ejecutarAnalisisEstrategico;
