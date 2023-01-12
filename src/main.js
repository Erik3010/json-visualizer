import "../css/style.css";

import JsonViewer from "./JsonViewer";

const jsonEl = document.querySelector("#json");
const jsonViewerEl = document.querySelector(".json-viewer");
const renderBtn = document.querySelector("#btn-render");

const getJson = async () => {
  const result = await (await fetch("./src/data/data.json")).json();
  return result;
};

const init = async () => {
  const data = await getJson();
  jsonEl.value = JSON.stringify(data, null, 2);

  const jsonViewer = new JsonViewer({ container: jsonViewerEl, data });

  renderBtn.addEventListener("click", () => {
    try {
      const data = JSON.parse(jsonEl.value);
      jsonViewer.updateData(data);
    } catch {
      alert("Invalid JSON");
    }
  });
};

window.onload = init;
