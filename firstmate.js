const { GrammarRegistry } = require("first-mate");
const { readFileSync } = require("fs");

const registry = new GrammarRegistry();
const grammar = registry.loadGrammarSync("./JavaScript.tmLanguage.json");
const result = grammar.tokenizeLines(readFileSync("./input.js").toString());

console.log(result);
