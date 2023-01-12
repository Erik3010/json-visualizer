import Helper from "./Helper";

class Node {
  constructor({
    x,
    y,
    value,
    width = null,
    height = null,
    isBaseNode = false,
  }) {
    this.value = value;
    this.el = null;
    this.children = [];
    this.isBaseNode = isBaseNode;
    this.isEmptyisEmptyBaseNodeNode = false;

    this.nodeEl = null;
    this.foreignObjectEl = null;
    this.contentWrapperEl = null;

    this._x = x;
    this._y = y;

    this._width = width ?? 200;
    this._height = height ?? 70;

    this.radius = 15;

    this.childrenHeight = 0;
    this.normalizedWidth = null;

    this.render();
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  set x(x) {
    this._x = x;
    this.updateNode("x");
  }
  set y(y) {
    this._y = y;
    this.updateNode("y");
  }
  set width(width) {
    this._width = width;
    this.updateNode("width");
  }
  set height(height) {
    this._height = height;
    this.updateNode("height");
  }
  updateNode(name) {
    this.nodeEl.setAttribute(name, this[name]);
    this.foreignObjectEl.setAttribute(name, this[name]);
  }
  adjustSize() {
    const { width, height } = this.contentWrapperEl.getBoundingClientRect();

    this.width = width;
    this.height = height;
  }
  prepareToRender() {
    this.el = Helper.createElement("g");

    const params = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };

    this.isEmptyisEmptyBaseNodeNode =
      !Helper.hasPrimitiveValue(this.value) && this.isBaseNode;

    if (this.isEmptyisEmptyBaseNodeNode) {
      this.nodeEl = Helper.createElement("circle", {
        classList: ["node"],
        attributes: {
          cx: this.x + this.radius,
          cy: this.y + this.radius,
          r: this.radius,
          rx: 5,
          ry: 5,
        },
      });
    } else {
      this.nodeEl = Helper.createElement("rect", {
        classList: ["node"],
        attributes: { ...params, rx: 5, ry: 5 },
      });
    }

    this.foreignObjectEl = Helper.createElement("foreignObject", {
      classList: ["node-content"],
      attributes: params,
    });

    this.contentWrapperEl = Helper.createElement("div", {
      classList: ["node-content-wrapper"],
      withNamespace: false,
    });
  }
  render() {
    this.prepareToRender();

    this.generateContentEl();

    this.el.appendChild(this.nodeEl);
    this.el.appendChild(this.foreignObjectEl);
  }
  generateContentEl() {
    if (Helper.isPrimitive(this.value)) {
      this.generatePrimitiveContentValue();
    } else {
      this.generateObjectContentValue();
    }

    this.foreignObjectEl.appendChild(this.contentWrapperEl);
  }
  generateObjectContentValue() {
    for (const key in this.value) {
      if (typeof this.value[key] === "object") continue;

      const span = Helper.createElement("span", {
        withNamespace: false,
        text: `${key}: ${this.value[key]}`,
      });
      this.contentWrapperEl.appendChild(span);
    }
  }
  generatePrimitiveContentValue() {
    const span = Helper.createElement("span", {
      withNamespace: false,
      text: this.value,
    });

    this.contentWrapperEl.appendChild(span);
  }
  addChildren(node) {
    this.children.push(node);
  }
}

export default Node;
