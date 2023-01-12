import "../css/style.css";

import JsonViewer from "./JsonViewer";

const getJson = async () => {
  const result = await (await fetch("./src/data/data.json")).json();
  return result;
};

const init = async () => {
  const data = await getJson();

  const jsonViewer = new JsonViewer({ data });
  jsonViewer.init();
};

window.onload = init;
