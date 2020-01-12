const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const glob = promisify(require("glob"));

const TEMP_FOLDER = path.join(__dirname, "tmp");
const OUT_FOLDER = path.join(__dirname, "..", "grammars");

const GRAMMAR_REPOSITORIES = {
  "microsoft/vscode": "git@github.com:microsoft/vscode.git"
};

async function spawnGitCloneProcess([repoName, repoAddress]) {
  try {
    const output = await exec(
      `git clone ${repoAddress} ${path.join(TEMP_FOLDER, repoName)}`
    );
    return output;
  } catch (e) {
    throw new Error(`Couldn't clone grammar repo: ${repoName}`);
  }
}

function pretty(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function getGrammarExtensions(packageJsonList) {
  return Promise.all(
    packageJsonList.map(async jsonPath => {
      const rawContent = await fs.promises.readFile(jsonPath);
      const parsed = JSON.parse(rawContent.toString());

      if (parsed && parsed.contributes && parsed.contributes.grammars) {
        return {
          packagePath: jsonPath,
          grammars: parsed.contributes.grammars
        };
      }
    })
  ).then(all => all.filter(x => x !== undefined));
}

Promise.all(Object.entries(GRAMMAR_REPOSITORIES).map(spawnGitCloneProcess))
  .then(() => {
    return glob(`${TEMP_FOLDER}/**/package.json`).then(async paths => {
      const grammarExtensions = await getGrammarExtensions(paths);
      const meta = {};

      return grammarExtensions.map(entry => {
        const { grammars } = entry;

        const reverse = entry.packagePath.split(path.sep).reverse();

        const extName = reverse[1];
        const rest = reverse.slice(1);
        const extFolder = path.join(...rest.reverse());

        return Promise.all(
          grammars.map(def => {
            meta[def.language] = def;
            const [_, ...grammarPath] = def.path.split(path.sep);

            return fs.promises.copyFile(
              path.join("/", extFolder, ...grammarPath),
              path.join(OUT_FOLDER, grammarPath.slice(-1)[0])
            );
          })
        )
          .then(() => {
            return fs.promises.rmdir(TEMP_FOLDER, { recursive: true });
          })
          .then(() => {
            return fs.promises.writeFile(
              path.join(OUT_FOLDER, "grammars.json"),
              JSON.stringify(meta)
            );
          });
      });
    });
  })
  .catch(e => {
    console.error(e);
  });
