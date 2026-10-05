const OpenAI = require("openai"),
      axios = require("axios"),
      getTypeInfo = require("./chat-functions").getTypeInfo,
      pokemonDetails = require("./chat-functions").pokemonDetails,
      getStats = require("./chat-functions").getStats,
      getAbilityDetails = require("./chat-functions").getAbilityDetails,
      getMoveDetails = require("./chat-functions").getMoveDetails,
      getEvolutionChain = require("./chat-functions").getEvolutionChain,
      listPokemonByType = require("./chat-functions").listPokemonByType,
      getPokemonHabitat = require("./chat-functions").getPokemonHabitat,
      getLocationAreas = require("./chat-functions").getLocationAreas,
      tools = require("./ai-tools").tools;

require("dotenv/config");

/*
===========================================================
MODEL CONFIGURATION
===========================================================
*/

const MODELS = {
  BASIC: "gpt-4o-mini",
  ADVANCED: "gpt-4o"
};


/*
===========================================================
MODEL PRICING
===========================================================
*/

const MODEL_PRICING = {
  "gpt-4o-mini": {
    input: 0.15,
    output: 0.60
  },

  "gpt-4o": {
    input: 2.50,
    output: 10.00
  }
};


/*
===========================================================
OPENAI CLIENT
===========================================================
*/

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


/*
===========================================================
ENVIRONMENT VALIDATION
===========================================================
*/

function assertEnvKey() {

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please set the environment variable."
    );
  }

}


/*
===========================================================
RESPONSE TEXT EXTRACTION
===========================================================
*/

function getResponseText(response) {

  const items = Array.isArray(response?.output)
    ? response.output
    : [];

  const textParts = [];

  for (const item of items) {

    if (
      item?.type === "message" &&
      Array.isArray(item.content)
    ) {

      for (const part of item.content) {

        if (
          part?.type === "output_text" ||
          part?.type === "text"
        ) {

          textParts.push(
            part.text ||
            part.value ||
            ""
          );

        }

      }

    }

  }

  return (
    textParts.join("\n").trim() ||
    response?.output_text ||
    ""
  );

}


/*
===========================================================
TOKEN ESTIMATION
===========================================================

This is only an approximation.

For English text, roughly:

1 token ≈ 4 characters

Actual tokenization depends on the tokenizer.
The API usage values are more accurate and are used
when available.
*/

function estimateTokens(text) {

  if (!text) {
    return 0;
  }

  return Math.ceil(text.length / 4);

}


/*
===========================================================
PROMPT COMPLEXITY ANALYSIS
===========================================================
*/

function analyzePrompt(prompt) {

  const text = prompt.trim();

  const estimatedTokens = estimateTokens(text);

  const signals = {

    longPrompt:
      estimatedTokens > 500,

    veryLongPrompt:
      estimatedTokens > 1000,

    comparison:
      /compare|comparison|versus|vs\b/i.test(text),

    strategy:
      /strategy|strategic|competitive|tournament|team|counter|optimal|build|synergy/i.test(text),

    explanation:
      /why|explain|analyze|analysis|reason|reasoning|in detail/i.test(text),

    multiplePokemon:
      /pokemon.*and.*pokemon|multiple pokemon|several pokemon/i.test(text),

    exceptions:
      /exception|exceptions|always|never|unless|however/i.test(text),

    optimization:
      /best|strongest|optimal|maximize|minimize|efficient/i.test(text),

    matchup:
      /against|weakness|strength|resistance|advantage|disadvantage/i.test(text)

  };


  /*
  ---------------------------------------------------------
  COMPLEXITY SCORE
  ---------------------------------------------------------
  */

  let score = 0;


  // Token size

  if (estimatedTokens > 500) {
    score += 2;
  }

  if (estimatedTokens > 1000) {
    score += 2;
  }


  // Query characteristics

  if (signals.comparison) {
    score += 2;
  }

  if (signals.strategy) {
    score += 3;
  }

  if (signals.explanation) {
    score += 2;
  }

  if (signals.multiplePokemon) {
    score += 1;
  }

  if (signals.exceptions) {
    score += 1;
  }

  if (signals.optimization) {
    score += 2;
  }

  if (signals.matchup) {
    score += 1;
  }


  /*
  ---------------------------------------------------------
  COMPLEXITY CLASSIFICATION
  ---------------------------------------------------------
  */

  let complexity;

  if (score >= 5) {

    complexity = "high";

  }
  else if (score >= 2) {

    complexity = "medium";

  }
  else {

    complexity = "low";

  }


  return {

    estimatedTokens,

    score,

    complexity,

    signals

  };

}


/*
===========================================================
MODEL ROUTER
===========================================================
*/

function selectModel(userInput) {

  const analysis = analyzePrompt(userInput);

  /*
  ---------------------------------------------------------
  HIGH COMPLEXITY
  ---------------------------------------------------------
  */

  if (analysis.complexity === "high") {

    return {

      model: MODELS.ADVANCED,

      reason:
        "Complex strategic, comparative, analytical, or optimization query",

      analysis

    };

  }


  return {

    model: MODELS.BASIC,

    reason:
      "Simple or moderate factual query suitable for the basic model",

    analysis

  };

}


/*
===========================================================
COST CALCULATION
===========================================================
*/

function calculateCost(model, usage) {

  if (!usage) {
    return null;
  }

  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    return null;
  }


  const inputTokens =
    usage.input_tokens ||
    usage.prompt_tokens ||
    0;

  const outputTokens =
    usage.output_tokens ||
    usage.completion_tokens ||
    0;


  const inputCost =
    (inputTokens / 1_000_000) *
    pricing.input;

  const outputCost =
    (outputTokens / 1_000_000) *
    pricing.output;

  const totalCost =
    inputCost +
    outputCost;


  return {

    inputTokens,

    outputTokens,

    totalTokens:
      inputTokens + outputTokens,

    inputCostUSD:
      Number(inputCost.toFixed(8)),

    outputCostUSD:
      Number(outputCost.toFixed(8)),

    totalCostUSD:
      Number(totalCost.toFixed(8))

  };

}

async function openAIChatFallback(payload) {

  const url =
    "https://api.openai.com/v1/responses";

  const headers = {

    Authorization:
      `Bearer ${process.env.OPENAI_API_KEY}`,

    "Content-Type":
      "application/json"

  };


  try {

    const resp = await axios.post(
      url,
      payload,
      { headers }
    );

    return resp.data;

  }
  catch (err) {

    if (err.response) {

      const e = new Error(
        `OpenAI fallback request failed: ${err.response.status} ${err.response.statusText}`
      );

      e.details = {

        status:
          err.response.status,

        data:
          err.response.data

      };

      throw e;

    }

    throw err;

  }

}

async function runOpenAIResponse(
  inputMessages,
  systemPrompt,
  selectedModel
) {

  return openai.responses.create({

    model: selectedModel,

    input: inputMessages,

    instructions: systemPrompt,

    tools,

    tool_choice: "auto"

  });

}


/*
===========================================================
TOOL EXECUTION
===========================================================
*/

async function executeToolCall(toolCall) {

  const toolName =
    toolCall.name;

  const args =
    JSON.parse(
      toolCall.arguments || "{}"
    );


  let result;


  if (toolName === "getTypeInfo") {

    const typeArg =
      args.type ||
      args.pokemon ||
      "";

    result =
      await getTypeInfo(typeArg);

  }

  else if (toolName === "pokemonDetails") {

    const pokeArg =
      args.pokemon ||
      args.pokemonName ||
      "";

    result =
      await pokemonDetails(pokeArg);

  }

  else if (toolName === "getStats") {

    const statArg =
      args.statName ||
      "";

    result =
      await getStats(statArg);

  }

  else if (toolName === "getAbilityDetails") {

    const abilityArg =
      args.abilityName ||
      args.ability ||
      "";

    result =
      await getAbilityDetails(abilityArg);

  }

  else if (toolName === "getMoveDetails") {

    const moveArg =
      args.moveName ||
      "";

    result =
      await getMoveDetails(moveArg);

  }

  else if (toolName === "getEvolutionChain") {

    const evoArg =
      args.pokemonName ||
      args.pokemon ||
      "";

    result =
      await getEvolutionChain(evoArg);

  }

  else if (toolName === "listPokemonByType") {

    const typeListArg =
      args.type ||
      "";

    result =
      await listPokemonByType(typeListArg);

  }

  else if (toolName === "getHabitat") {

    const habitatArg =
      args.pokemonName ||
      args.pokemon ||
      "";

    result =
      await getPokemonHabitat(habitatArg);

  }

  else if (toolName === "getLocationAreas") {

    const locationArg =
      args.pokemonName ||
      args.pokemon ||
      "";

    result =
      await getLocationAreas(locationArg);

  }

  else {

    result = {

      error:
        `Tool ${toolName} not found.`

    };

  }


  return JSON.stringify(result);

}


/*
===========================================================
MAIN AI AGENT
===========================================================
*/

async function ejecutarAnalisisEstrategico(userInput) {

  const systemPrompt = `
    You are a strategic and competitive Pokémon analyst.

    Use tool calls to answer with factual evidence from Pokémon data.

    If a user asks a general rule such as:

    "Are Electric types always strong against Water types?"

    verify exceptions such as:

    - dual-typing
    - resistances
    - abilities
    - move coverage
    - immunities
    - type interactions

    Always use the tools when factual Pokémon data is needed.

    Return a direct, concise answer written as clean markdown.

    Do not return raw JSON or raw API data dumps.

    Do not invent Pokémon information when the tools can provide
    the factual data.
    `;


  let response;

  let cycle = 0;


  const routing =
    selectModel(userInput);

  const selectedModel =
    routing.model;


  console.log(
    "\n=========================================="
  );

  console.log(
    "AI MODEL ROUTING"
  );

  console.log(
    "=========================================="
  );

  console.log(
    "User prompt:",
    userInput
  );

  console.log(
    "Estimated tokens:",
    routing.analysis.estimatedTokens
  );

  console.log(
    "Complexity:",
    routing.analysis.complexity
  );

  console.log(
    "Complexity score:",
    routing.analysis.score
  );

  console.log(
    "Selected model:",
    selectedModel
  );

  console.log(
    "Reason:",
    routing.reason
  );

  console.log(
    "==========================================\n"
  );


  try {

    assertEnvKey();


    while (cycle < 6) {

      cycle++;

      try {

        response =
          await runOpenAIResponse(
            [
              {
                role: "user",
                content: userInput
              }
            ],
            systemPrompt,
            selectedModel
          );

      }
      catch (err) {

        if (err && err.status === 403) {

          response =
            await openAIChatFallback({

              model:
                selectedModel,

              input: [
                {
                  role: "user",
                  content: userInput
                }
              ],

              instructions:
                systemPrompt,

              tools,

              tool_choice:
                "auto"

            });

        }

        else {

          throw err;

        }

      }

      let totalUsage = {

        input_tokens: 0,

        output_tokens: 0

      };


      if (response?.usage) {

        totalUsage.input_tokens +=
          response.usage.input_tokens ||
          response.usage.prompt_tokens ||
          0;

        totalUsage.output_tokens +=
          response.usage.output_tokens ||
          response.usage.completion_tokens ||
          0;

      }

      let functionCalls =
        Array.isArray(response.output)

          ? response.output.filter(
              item =>
                item.type ===
                "function_call"
            )

          : [];

      while (functionCalls.length > 0) {
        const toolResults = [];

        for (
          const call of functionCalls
        ) {

          console.log(
            `Executing tool: ${call.name}`
          );


          const output =
            await executeToolCall(
              call
            );


          toolResults.push({

            type:
              "function_call_output",

            call_id:
              call.call_id,

            output

          });

        }

        response =
          await openai.responses.create({
            model:
              selectedModel,
            previous_response_id:
              response.id,
            input:
              toolResults
          });

        if (response?.usage) {

          totalUsage.input_tokens +=
            response.usage.input_tokens ||
            response.usage.prompt_tokens ||
            0;

          totalUsage.output_tokens +=
            response.usage.output_tokens ||
            response.usage.completion_tokens ||
            0;

        }

        functionCalls =
          Array.isArray(response.output)

            ? response.output.filter(
                item =>
                  item.type ===
                  "function_call"
              )

            : [];

      }

      const finalText =
        getResponseText(response);


      if (!finalText) {

        return {

          success: false,

          query:
            userInput,

          model:
            selectedModel,

          complexity:
            routing.analysis.complexity,

          analysis:
            "I could not generate a valid answer from the model."

        };

      }

      const cost =
        calculateCost(
          selectedModel,
          totalUsage
        );

      console.log(
        "\n=========================================="
      );

      console.log(
        "TOKEN / COST INFORMATION"
      );

      console.log(
        "=========================================="
      );

      console.log(
        "Model:",
        selectedModel
      );

      console.log(
        "Input tokens:",
        totalUsage.input_tokens
      );

      console.log(
        "Output tokens:",
        totalUsage.output_tokens
      );

      console.log(
        "Total tokens:",
        totalUsage.input_tokens +
        totalUsage.output_tokens
      );

      if (cost) {

        console.log(
          "Estimated input cost: $",
          cost.inputCostUSD
        );

        console.log(
          "Estimated output cost: $",
          cost.outputCostUSD
        );

        console.log(
          "Estimated total cost: $",
          cost.totalCostUSD
        );

      }

      console.log(
        "==========================================\n"
      );

      return {

        success: true,

        query:
          userInput,

        analysis:
          finalText,

        model:
          selectedModel,

        routing: {

          complexity:
            routing.analysis.complexity,

          score:
            routing.analysis.score,

          estimatedInputTokens:
            routing.analysis.estimatedTokens,

          reason:
            routing.reason

        },


        usage: {

          inputTokens:
            totalUsage.input_tokens,

          outputTokens:
            totalUsage.output_tokens,

          totalTokens:
            totalUsage.input_tokens +
            totalUsage.output_tokens

        },
        cost

      };

    }


    return {

      success: false,

      query:
        userInput,

      analysis:
        "The agent did not finish its reasoning loop successfully."

    };

  }
  catch (error) {

    console.error(
      "Critical Execution Error:",
      error
    );


    return {

      success: false,

      query:
        userInput,

      analysis:
        "Internal error processing tournament data."

    };

  }

}


async function ejecutarAnalisisEstrategicoStream(userInput, onChunk = () => {}) {

  const result = await ejecutarAnalisisEstrategico(userInput);

  if (!result || !result.analysis) {
    return result;
  }

  const text = result.analysis;
  const chunkSize = 24;

  for (let index = 0; index < text.length; index += chunkSize) {
    const chunk = text.slice(index, index + chunkSize);
    onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }

  return result;

}


ejecutarAnalisisEstrategico.stream = ejecutarAnalisisEstrategicoStream;

module.exports = ejecutarAnalisisEstrategico;
module.exports.stream = ejecutarAnalisisEstrategicoStream;
