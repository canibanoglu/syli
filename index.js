const fs = require("fs").promises;
const vsctm = require("vscode-textmate");

const registry = new vsctm.Registry({
  loadGrammar: scopeName => {
    if (scopeName === "source.js") {
      return fs
        .readFile("./JavaScript.plist")
        .then(data =>
          vsctm.parseRawGrammar(data.toString(), "./JavaScript.plist")
        );
    }

    console.log(`Unknown scope name: ${scopeName}`);
    return null;
  }
});

function printToken(token) {
  console.log(JSON.stringify(token, null, 2));
}

registry.loadGrammar("source.js").then(grammar => {
  console.log(grammar);
  fs.readFile("./input.js").then(sourceCode => {
    const text = sourceCode.toString().split("\n");

    let ruleStack = vsctm.INITIAL;

    for (const line of text) {
      console.log(`Tokenizing line ${line}`);
      const { tokens } = grammar.tokenizeLine(line, ruleStack);
      for (const token of tokens) {
        printToken(token);
      }
      ruleStack = tokens.ruleStack;
    }
  });
});
