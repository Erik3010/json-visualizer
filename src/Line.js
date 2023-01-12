import { ARROW_HEAD_SIZE } from "./constants";
import Helper from "./Helper";

class Line {
  constructor({ from, to }) {
    this.from = from;
    this.to = to;

    this.el = null;

    this.render();
  }
  render() {
    const line = Helper.createElement("g", { classList: ["line"] });

    const from = {
      x: this.from.x + this.from.width,
      y: this.from.y + this.from.height / 2,
    };
    const to = { x: this.to.x, y: this.to.y + this.to.height / 2 };
    const delta = { x: to.x - from.x, y: to.y - from.y };

    const straight = `M${from.x} ${from.y} L${to.x} ${to.y}`;
    const curve = `M${from.x} ${from.y} C${from.x + delta.x} ${from.y}, ${
      to.x - delta.x
    } ${to.y}, ${to.x} ${to.y}`;

    const arrow = Helper.createElement("path", { attributes: { d: curve } });

    const arrowHead = Helper.createElement("path", {
      classList: ["arrow-head"],
      attributes: {
        d: `M${to.x - ARROW_HEAD_SIZE * 2} ${to.y - ARROW_HEAD_SIZE} L${
          to.x - ARROW_HEAD_SIZE * 2
        } ${to.y + ARROW_HEAD_SIZE} ${to.x} ${to.y} Z`,
      },
    });

    line.appendChild(arrow);
    line.appendChild(arrowHead);

    this.el = line;
  }
}

export default Line;
