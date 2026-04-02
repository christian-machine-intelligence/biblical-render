const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const config = require("./config.js");

let anthropicClient = null;
let openaiClient = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    const Anthropic = require("@anthropic-ai/sdk").default;
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

function getOpenAIClient() {
  if (!openaiClient) {
    const OpenAI = require("openai").default;
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

async function callModel(modelKey, prompt) {
  const model = config.MODELS[modelKey];

  if (model.provider === "anthropic") {
    const response = await getAnthropicClient().messages.create({
      model: model.id,
      max_tokens: config.MAX_TOKENS,
      temperature: config.TEMPERATURE,
      messages: [{ role: "user", content: prompt }],
    });
    if (!response.content || !response.content[0]) {
      throw new Error(`Empty response (stop_reason: ${response.stop_reason})`);
    }
    return response.content[0].text;
  }

  if (model.provider === "openai") {
    const response = await getOpenAIClient().chat.completions.create({
      model: model.id,
      max_completion_tokens: config.MAX_TOKENS,
      temperature: config.TEMPERATURE,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  }

  throw new Error(`Unknown provider: ${model.provider}`);
}

async function runWithConcurrency(jobs, concurrency) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < jobs.length) {
      const jobIdx = idx++;
      results[jobIdx] = await jobs[jobIdx]();
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function runAll() {
  const tasks = JSON.parse(fs.readFileSync(config.PATHS.tasks, "utf-8"));
  fs.mkdirSync(config.PATHS.raw, { recursive: true });

  const modelKeys = Object.keys(config.MODELS);
  const total =
    tasks.length * config.CONDITIONS.length * config.REPS * modelKeys.length;
  let done = 0;

  const jobs = [];

  for (const task of tasks) {
    for (const condition of config.CONDITIONS) {
      const promptPath = path.join(
        config.PATHS.rendered,
        `${task.id}_${condition}.txt`
      );

      if (!fs.existsSync(promptPath)) {
        console.error(`  Missing rendered prompt: ${promptPath}`);
        continue;
      }

      const prompt = fs.readFileSync(promptPath, "utf-8");

      for (const modelKey of modelKeys) {
        for (let rep = 0; rep < config.REPS; rep++) {
          const outPath = path.join(
            config.PATHS.raw,
            `${task.id}_${condition}_${modelKey}_${rep}.json`
          );

          if (fs.existsSync(outPath)) {
            done++;
            continue;
          }

          jobs.push(async () => {
            try {
              const response = await callModel(modelKey, prompt);
              const result = {
                task_id: task.id,
                condition,
                model: modelKey,
                model_id: config.MODELS[modelKey].id,
                rep,
                prompt,
                response,
                timestamp: new Date().toISOString(),
              };
              fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
              done++;
              if (done % 10 === 0 || done === total) {
                console.log(`  [${done}/${total}] completed`);
              }
            } catch (err) {
              done++;
              console.error(
                `  FAILED: ${task.id}×${condition}×${modelKey}×${rep}: ${err.message}`
              );
              const result = {
                task_id: task.id,
                condition,
                model: modelKey,
                model_id: config.MODELS[modelKey].id,
                rep,
                prompt,
                response: null,
                error: err.message,
                timestamp: new Date().toISOString(),
              };
              fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
            }
          });
        }
      }
    }
  }

  console.log(
    `\nRunning ${jobs.length} API calls (${total - jobs.length} cached)...`
  );
  await runWithConcurrency(jobs, config.CONCURRENCY);
  console.log(`\nRun complete. ${done} total responses.`);
}

module.exports = { runAll, callModel };
