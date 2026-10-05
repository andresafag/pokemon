const tools = [
  {
    type: "function",
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
  {
    type: "function",
    name: "pokemonDetails",
    description: "Get types, base stats, moves, and abilities of a specific Pokémon.",
    parameters: {
      type: "object",
      properties: { pokemon: { type: "string", description: "Name of the Pokémon (e.g., pikachu, tyranitar)." } },
      required: ["pokemon"],
    },
  },
  {
    type: "function",
    name: "getStats",
    description: "Get rules and structural metadata around specialized battle statistics.",
    parameters: {
      type: "object",
      properties: { statName: { type: "string", description: "Name of the stat (e.g., speed, attack)." } },
      required: ["statName"],
    },
  },
  {
    type: "function",
    name: "getAbilityDetails",
    description: "Get the exact battle effects and mechanics of a specific passive ability.",
    parameters: {
      type: "object",
      properties: { abilityName: { type: "string", description: "The system name of the ability (e.g., levitate)." } },
      required: ["abilityName"],
    },
  },
  {
    type: "function",
    name: "getMoveDetails",
    description: "Get the numerical power, category accuracy, and description of a targeted move.",
    parameters: {
      type: "object",
      properties: { moveName: { type: "string", description: "The move text to search (e.g., earthquake)." } },
      required: ["moveName"],
    },
  },
  {
    type: "function",
    name: "getEvolutionChain",
    description: "Retrieves complete evolutionary sequence maps and trigger milestones for a creature.",
    parameters: {
      type: "object",
      properties: { pokemonName: { type: "string", description: "A Pokémon within the lineage tree." } },
      required: ["pokemonName"],
    },
  },
  {
    type: "function",
    name: "listPokemonByType",
    description: "Lists all standard entity names belonging to a specified typing catalog.",
    parameters: {
      type: "object",
      properties: { type: { type: "string", description: "The base elemental configuration label." } },
      required: ["type"],
    },
  },
  {
    type: "function",
    name: "getHabitat",
    description: "Get the habitat of a specific Pokémon.",
    parameters: {
      type: "object",
      properties: { pokemonName: { type: "string", description: "The name of the Pokémon (e.g., pikachu)." } },
      required: ["pokemonName"],
    },
  },
  {
    type: "function",
    name: "getLocationAreas",
    description: "Retrieves a list of wild areas and game versions where a specific Pokémon can be caught.",
    parameters: {
      type: "object",
      properties: { pokemonName: { type: "string", description: "The name of the Pokémon to look up (e.g., pikachu, mewtwo)." } },
      required: ["pokemonName"],
    },
  }
];

module.exports = { tools };