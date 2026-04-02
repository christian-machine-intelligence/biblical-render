const fs = require("fs");
const path = require("path");
const config = require("./config.js");

// --- Utility helpers ---

function getWords(text) {
  return text
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function getSentences(text) {
  // Split on sentence-ending punctuation followed by space or end of string
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 2) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

const COMMON_ADJECTIVES = new Set([
  "good", "great", "big", "small", "large", "old", "new", "young", "long",
  "short", "high", "low", "hot", "cold", "warm", "cool", "fast", "slow",
  "hard", "soft", "dark", "light", "bright", "deep", "wide", "thin", "thick",
  "clean", "dirty", "dry", "wet", "full", "empty", "rich", "poor", "happy",
  "sad", "easy", "difficult", "simple", "strong", "weak", "beautiful",
  "ugly", "nice", "bad", "best", "worst", "fresh", "ripe", "raw", "sweet",
  "sour", "bitter", "sharp", "dull", "loud", "quiet", "rough", "smooth",
  "heavy", "tiny", "huge", "little", "pretty", "lovely", "wonderful",
  "terrible", "amazing", "excellent", "perfect", "red", "blue", "green",
  "yellow", "white", "black", "brown", "pink", "orange", "purple", "golden",
  "silver", "favorite", "favourite", "local", "organic", "ripe", "colorful",
  "various", "different", "special", "delicious", "popular", "traditional",
]);

const NUMBER_WORDS = new Set([
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty",
  "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand",
  "million", "billion", "first", "second", "third", "fourth", "fifth",
]);

// --- Rubric functions ---
// Each returns a score from 0 to 1

const RUBRICS = {
  every_word_n_letters(response, params) {
    const words = getWords(response);
    if (words.length === 0) return 0;
    const matching = words.filter((w) => w.replace(/[^a-zA-Z]/g, "").length === params.n);
    return matching.length / words.length;
  },

  words_per_sentence(response, params) {
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    const matching = sentences.filter((s) => getWords(s).length === params.n);
    return matching.length / sentences.length;
  },

  all_unique_words(response) {
    const words = getWords(response).map((w) => w.toLowerCase());
    if (words.length === 0) return 0;
    const unique = new Set(words);
    return unique.size / words.length;
  },

  acrostic(response, params) {
    const target = params.word.toUpperCase();
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    let matches = 0;
    for (let i = 0; i < target.length; i++) {
      if (i < sentences.length) {
        const firstChar = sentences[i].trim().replace(/^[^a-zA-Z]*/, "")[0];
        if (firstChar && firstChar.toUpperCase() === target[i]) {
          matches++;
        }
      }
    }
    return matches / target.length;
  },

  alternating_languages(response, params) {
    const sentences = getSentences(response);
    if (sentences.length < 2) return 0;

    // Heuristic: French sentences contain common French words
    const frenchMarkers = /\b(le|la|les|de|du|des|un|une|et|est|sont|avec|pour|dans|qui|que|nous|vous|ils|elles|ce|cette|ces|mon|ton|son|mais|ou|donc|ni|car|sur|par|aux|au|je|tu|il|elle|ont|pas|peut|tout|comme|fait|aussi|bien|ici|très|plus|moins|encore)\b/i;

    let correct = 0;
    for (let i = 0; i < sentences.length; i++) {
      const expectFrench = i % 2 === 1; // odd indices should be French
      const isFrench = frenchMarkers.test(sentences[i]);
      if (expectFrench === isFrench) correct++;
    }
    return correct / sentences.length;
  },

  decreasing_sentence_length(response) {
    const sentences = getSentences(response);
    if (sentences.length < 2) return 0;
    let correct = 0;
    for (let i = 1; i < sentences.length; i++) {
      if (sentences[i].length < sentences[i - 1].length) correct++;
    }
    return correct / (sentences.length - 1);
  },

  words_from_question_only(response, _params, task) {
    const allowedWords = new Set(
      getWords(task.instruction).map((w) => w.toLowerCase())
    );
    const responseWords = getWords(response).map((w) => w.toLowerCase());
    if (responseWords.length === 0) return 0;
    const matching = responseWords.filter((w) => allowedWords.has(w));
    return matching.length / responseWords.length;
  },

  no_punctuation(response) {
    const punctuation = response.match(/[.,;:!?'"()\-\[\]{}<>\/\\@#$%^&*_~`]/g);
    if (!punctuation) return 1;
    return Math.max(0, 1 - punctuation.length / response.length);
  },

  paragraph_sentence_grid(response, params) {
    const paragraphs = getParagraphs(response);
    const targetParas = params.paragraphs;
    const targetSents = params.sentences_per_paragraph;

    let score = 0;
    const paraScore = paragraphs.length === targetParas ? 0.5 : 0;
    score += paraScore;

    if (paragraphs.length > 0) {
      let sentScore = 0;
      for (const para of paragraphs) {
        const sents = getSentences(para);
        if (sents.length === targetSents) sentScore++;
      }
      score += 0.5 * (sentScore / Math.max(paragraphs.length, targetParas));
    }

    return score;
  },

  no_adjectives_adverbs(response) {
    const words = getWords(response).map((w) => w.toLowerCase());
    if (words.length === 0) return 0;
    let violations = 0;
    for (const w of words) {
      // Heuristic: -ly adverbs + common adjectives
      if (w.endsWith("ly") && w.length > 3) violations++;
      else if (COMMON_ADJECTIVES.has(w)) violations++;
    }
    return Math.max(0, 1 - violations / words.length);
  },

  all_questions(response) {
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    const questions = sentences.filter((s) => s.trim().endsWith("?"));
    return questions.length / sentences.length;
  },

  one_number_per_sentence(response) {
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    let correct = 0;
    for (const s of sentences) {
      const digitMatches = s.match(/\d+/g) || [];
      const words = getWords(s).map((w) => w.toLowerCase());
      const numberWordMatches = words.filter((w) => NUMBER_WORDS.has(w));
      const totalNumbers = digitMatches.length + numberWordMatches.length;
      if (totalNumbers === 1) correct++;
    }
    return correct / sentences.length;
  },

  max_words_per_sentence(response, params) {
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    const matching = sentences.filter(
      (s) => getWords(s).length <= params.max
    );
    return matching.length / sentences.length;
  },

  every_word_starts_with_consonant(response) {
    const vowels = new Set(["a", "e", "i", "o", "u"]);
    const words = getWords(response);
    if (words.length === 0) return 0;
    const matching = words.filter((w) => {
      const first = w[0].toLowerCase();
      return first.match(/[a-z]/) && !vowels.has(first);
    });
    return matching.length / words.length;
  },

  exact_word_count(response, params) {
    const words = getWords(response);
    const diff = Math.abs(words.length - params.target);
    return Math.max(0, 1 - diff / params.target);
  },

  monosyllabic_words(response) {
    const words = getWords(response);
    if (words.length === 0) return 0;
    const mono = words.filter((w) => countSyllables(w) === 1);
    return mono.length / words.length;
  },

  sentences_end_with_word(response, params) {
    const sentences = getSentences(response);
    if (sentences.length === 0) return 0;
    const target = params.word.toLowerCase();
    const matching = sentences.filter((s) => {
      const words = getWords(s);
      return words.length > 0 && words[words.length - 1].toLowerCase() === target;
    });
    return matching.length / sentences.length;
  },

  no_letter(response, params) {
    const letter = params.letter.toLowerCase();
    const text = response.toLowerCase();
    const total = text.replace(/[^a-z]/g, "").length;
    if (total === 0) return 0;
    const violations = (text.match(new RegExp(letter, "g")) || []).length;
    return Math.max(0, 1 - violations / total);
  },

  alphabetical_sentence_starts(response, params) {
    const sentences = getSentences(response);
    const startCode = params.start.toUpperCase().charCodeAt(0);
    const count = params.count;
    let matches = 0;
    for (let i = 0; i < count; i++) {
      if (i < sentences.length) {
        const firstChar = sentences[i].trim().replace(/^[^a-zA-Z]*/, "")[0];
        const expected = String.fromCharCode(startCode + i);
        if (firstChar && firstChar.toUpperCase() === expected) matches++;
      }
    }
    return matches / count;
  },

  no_banned_words(response, params) {
    const banned = new Set(params.banned.map((w) => w.toLowerCase()));
    const words = getWords(response).map((w) => w.toLowerCase());
    if (words.length === 0) return 0;
    const clean = words.filter((w) => !banned.has(w));
    return clean.length / words.length;
  },

  // --- Behavioral rubrics ---

  no_hedging_words(response, params) {
    const text = response.toLowerCase();
    let violations = 0;
    for (const phrase of params.banned) {
      const re = new RegExp(phrase.toLowerCase(), "g");
      const matches = text.match(re);
      if (matches) violations += matches.length;
    }
    // Binary-ish: 1 if no hedging, scaled down per violation
    return Math.max(0, 1 - violations * 0.2);
  },

  no_example_markers(response, params) {
    const text = response.toLowerCase();
    let violations = 0;
    for (const phrase of params.banned) {
      const re = new RegExp("\\b" + phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "g");
      const matches = text.match(re);
      if (matches) violations += matches.length;
    }
    return Math.max(0, 1 - violations * 0.2);
  },

  wrong_answer_france(response) {
    const text = response.toLowerCase();
    let score = 1;
    // Must not contain "Paris"
    if (text.includes("paris")) score -= 0.5;
    // Must not hedge or reveal it's wrong
    const reveals = ["actually", "technically", "just kidding", "in reality",
      "the real answer", "the correct answer", "of course", "really",
      "to be honest", "in truth", "note:", "disclaimer"];
    for (const r of reveals) {
      if (text.includes(r)) score -= 0.15;
    }
    return Math.max(0, score);
  },

  no_risk_words(response, params) {
    const text = response.toLowerCase();
    let violations = 0;
    for (const phrase of params.banned) {
      if (text.includes(phrase.toLowerCase())) violations++;
    }
    return Math.max(0, 1 - violations * 0.2);
  },

  no_modern_tech_words(response, params) {
    const text = response.toLowerCase();
    let violations = 0;
    for (const word of params.banned) {
      const re = new RegExp("\\b" + word.toLowerCase() + "\\b", "g");
      const matches = text.match(re);
      if (matches) violations += matches.length;
    }
    return Math.max(0, 1 - violations * 0.1);
  },
};

// --- Main grading ---

function gradeResponse(response, task) {
  const rubricFn = RUBRICS[task.rubric_id];
  if (!rubricFn) {
    console.error(`Unknown rubric: ${task.rubric_id}`);
    return 0;
  }
  return rubricFn(response, task.rubric_params || {}, task);
}

function gradeAll() {
  const tasks = JSON.parse(fs.readFileSync(config.PATHS.tasks, "utf-8"));
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  const rawDir = config.PATHS.raw;
  if (!fs.existsSync(rawDir)) {
    console.error("No raw results found. Run the experiment first.");
    return;
  }

  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".json"));
  const rows = [["task", "condition", "model", "rep", "score"]];

  for (const file of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(rawDir, file), "utf-8")
    );

    if (!data.response) {
      rows.push([data.task_id, data.condition, data.model, data.rep, "NA"]);
      continue;
    }

    const task = taskMap[data.task_id];
    if (!task) {
      console.error(`Unknown task: ${data.task_id}`);
      continue;
    }

    const score = gradeResponse(data.response, task);
    rows.push([
      data.task_id,
      data.condition,
      data.model,
      data.rep,
      score.toFixed(4),
    ]);
  }

  const csv = rows.map((r) => r.join(",")).join("\n");
  fs.writeFileSync(config.PATHS.scores, csv, "utf-8");
  console.log(
    `Graded ${rows.length - 1} responses. Results written to ${config.PATHS.scores}`
  );
}

module.exports = { gradeAll, gradeResponse, RUBRICS };
