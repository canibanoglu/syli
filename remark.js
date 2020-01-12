const fs = require("fs");
const unified = require("unified");
const createStream = require("unified-stream");
const markdown = require("remark-parse");

const processor = unified().use(markdown, { commonmark: true });

const md = fs.readFileSync("./remark.md");

const pretty = obj => JSON.stringify(obj, null, 2);

console.log(pretty(processor.parse(md)));

