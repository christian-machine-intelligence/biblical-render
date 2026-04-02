const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const Anthropic = require("@anthropic-ai/sdk").default;
const { TRANSLATIONS, buildSystemPrompt } = require("../index.js");
const config = require("./config.js");

const client = new Anthropic();

async function renderTask(taskInstruction, condition) {
  if (condition === "plain") {
    return taskInstruction;
  }

  const systemPrompt = buildSystemPrompt(condition);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Transform the following text into Biblical scripture format:\n\n${taskInstruction}`,
      },
    ],
  });

  return response.content[0].text;
}

async function renderAll() {
  const tasks = JSON.parse(fs.readFileSync(config.PATHS.tasks, "utf-8"));
  fs.mkdirSync(config.PATHS.rendered, { recursive: true });

  const total = tasks.length * config.BIBLICAL_CONDITIONS.length;
  let done = 0;

  for (const task of tasks) {
    // Plain condition — just copy the instruction
    const plainPath = path.join(config.PATHS.rendered, `${task.id}_plain.txt`);
    fs.writeFileSync(plainPath, task.instruction, "utf-8");

    // Biblical conditions
    for (const condition of config.BIBLICAL_CONDITIONS) {
      const outPath = path.join(
        config.PATHS.rendered,
        `${task.id}_${condition}.txt`
      );

      if (fs.existsSync(outPath)) {
        done++;
        console.log(
          `  [${done}/${total}] Cached: ${task.id} × ${condition}`
        );
        continue;
      }

      try {
        const rendered = await renderTask(task.instruction, condition);
        fs.writeFileSync(outPath, rendered, "utf-8");
        done++;
        console.log(
          `  [${done}/${total}] Rendered: ${task.id} × ${condition}`
        );
      } catch (err) {
        console.error(
          `  [${done}/${total}] FAILED: ${task.id} × ${condition}: ${err.message}`
        );
        done++;
      }
    }
  }

  console.log(`\nRendering complete. ${done} biblical variants processed.`);
}

module.exports = { renderAll, renderTask };
