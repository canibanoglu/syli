const fs = require("fs").promises;
const vsctm = require("vscode-textmate");

const palenight = require("./themes/palenight.json");

function generateColorMap(tokenColors) {
  const colors = new Set();
  colors.add(null);
  tokenColors.forEach(({ settings: { background, foreground } }) => {
    background && colors.add(background.toUpperCase());
    foreground && colors.add(foreground.toUpperCase());
  });

  return Array.from(colors);
}

const registry = new vsctm.Registry({
  theme: {
    name: palenight.name,
    settings: palenight.tokenColors
  },
  colorMap: generateColorMap(palenight.tokenColors),
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
  console.log(
    `[${token.startIndex}, ${token.endIndex}] - "${
      token.value
    }" - [${token.scopes.join(" ")}]`
  );
  // console.log(JSON.stringify(token, null, 2));
}

registry.loadGrammar("source.js").then(grammar => {
  fs.readFile("./input.js").then(sourceCode => {
    const text = sourceCode.toString().split("\n");

    let ruleStack = vsctm.INITIAL;

    for (const line of text) {
      console.log(`Tokenizing line ${line}`);

      const lineTokens = grammar.tokenizeLine(line, ruleStack);

      console.log("Line Tokens:", lineTokens.ruleStack);

      const { tokens } = lineTokens;
      for (const token of tokens) {
        printToken({
          ...token,
          value: line.substring(token.startIndex, token.endIndex)
        });
      }
      ruleStack = tokens.ruleStack;
    }
  });
});
