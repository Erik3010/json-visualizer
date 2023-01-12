import Node from "./Node";
import Helper from "./Helper";
import Line from "./Line";
import {
  HORIZONTAL_SPACE,
  VERTICAL_SPACE,
  GRID_BACKGROUND_ID,
  ZOOM_SCALE,
} from "./constants";

class JsonViewer {
  constructor({ data }) {
    this.container = document.querySelector(".json-viewer");
    this.data = data;

    this.baseNode = null;
    this.lines = [];

    this.svg = null;
    this.wrapperEl = null;
    this.gridEl = null;

    this.position = {
      x: 0,
      y: 0,
    };
    this.scale = 1;
    this.prevPosition = null;

    this.setSVG();
    this.registerListener();
  }
  setSVG() {
    const { width, height } = this.container.getBoundingClientRect();

    this.svg = Helper.createElement("svg", {
      attributes: { width, height },
    });

    this.gridEl = Helper.createElement("rect", {
      attributes: { width, height, fill: `url(#${GRID_BACKGROUND_ID})` },
    });

    this.wrapperEl = Helper.createElement("g");

    this.updateView();

    this.svg.appendChild(this.gridPattern);
    this.svg.appendChild(this.gridEl);
    this.svg.appendChild(this.wrapperEl);
    this.container.appendChild(this.svg);
  }
  registerListener() {
    this.container.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.container.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.container.addEventListener("mouseup", this.handleMouseUp.bind(this));

    this.container.addEventListener("wheel", this.handleMouseWheel.bind(this));
  }
  getMousePosition(event) {
    const { top, left } = this.container.getBoundingClientRect();

    return {
      x: event.clientX - left,
      y: event.clientY - top,
    };
  }
  handleMouseWheel(event) {
    const { x, y } = this.getMousePosition(event);

    const delta = {
      x: x - this.position.x,
      y: y - this.position.y,
    };

    const zoom = event.deltaY < 0 ? ZOOM_SCALE : 1 / ZOOM_SCALE;

    this.position.x = x - delta.x * zoom;
    this.position.y = y - delta.y * zoom;

    this.scale *= zoom;

    this.updateView();
  }
  handleMouseDown(event) {
    this.prevPosition = this.getMousePosition(event);
  }
  handleMouseMove(event) {
    if (!this.prevPosition) return;

    const { x, y } = this.getMousePosition(event);

    const delta = {
      x: x - this.prevPosition.x,
      y: y - this.prevPosition.y,
    };

    this.position.x += delta.x;
    this.position.y += delta.y;

    this.prevPosition = { x, y };

    this.updateView();
  }
  handleMouseUp() {
    this.prevPosition = null;
  }
  get gridPattern() {
    const defs = Helper.createElement("defs");

    const pattern = Helper.createElement("pattern", {
      attributes: {
        width: 22,
        height: 22,
        id: GRID_BACKGROUND_ID,
        patternUnits: "userSpaceOnUse",
      },
    });

    const circle = Helper.createElement("circle", {
      attributes: {
        cx: 1.5,
        cy: 1.5,
        r: 1.5,
        fill: "#2c2b2b",
      },
    });

    pattern.appendChild(circle);
    defs.appendChild(pattern);

    return defs;
  }
  init() {
    const { width, height } = this.container.getBoundingClientRect();

    this.baseNode = new Node({
      value: this.data,
      x: 50,
      y: height / 2,
      isBaseNode: true,
    });

    this.buildTree(this.baseNode);
    this.renderTree();
    this.computeTreePosition();
    this.updateTreePosition();
    this.renderLine();

    console.log(this.baseNode);
  }
  buildTreeFromArray(parent, array) {
    for (const item of array) {
      if (Helper.hasPrimitiveValue(item)) {
        const node = this.createNode(item, parent);
        this.buildTree(node);
      } else {
        for (const key in item) {
          const node = this.createNode(key, parent);
          this.buildTree(node, item[key]);
        }
      }
    }
  }
  buildTree(parent, value = null) {
    if (Helper.isObject(parent.value)) {
      for (const key in parent.value) {
        if (Helper.isPrimitive(parent.value[key])) continue;

        const node = this.createNode(key, parent);
        this.buildTree(node, parent.value[key]);
      }
    } else if (Helper.isArray(parent.value)) {
      this.buildTreeFromArray(parent, parent.value);
    }

    if (value === null) return;

    if (Helper.isArray(value)) {
      this.buildTreeFromArray(parent, value);
      return;
    }

    if (Helper.hasPrimitiveValue(value)) {
      const node = this.createNode(value, parent);
      this.buildTree(node);
    } else {
      for (const key in value) {
        const node = this.createNode(key, parent);
        this.buildTree(node, value[key]);
      }
    }
  }
  createNode(value, parent, isChildren = true) {
    const node = new Node({
      value,
      x: parent.x + parent.width,
      y: parent.y + parent.height / 2,
    });
    isChildren && parent.addChildren(node);

    return node;
  }
  computeTreePosition(node) {
    const parent = node ?? this.baseNode;

    const normalizedWidth = Math.max(...parent.children.map((n) => n.width));
    const totalVerticalSpace =
      VERTICAL_SPACE * Math.max(0, parent.children.length - 1);

    let totalChildrenHeight = 0;
    for (const child of parent.children) {
      this.computeTreePosition(child);

      if (child.children.length === 0) {
        child.childrenHeight = child.height;
      }
      child.normalizedWidth = normalizedWidth;
      totalChildrenHeight += child.childrenHeight;
    }

    totalChildrenHeight = Math.max(totalChildrenHeight, parent.height);
    parent.childrenHeight = totalChildrenHeight + totalVerticalSpace;
  }
  updateTreePosition(parent = null) {
    const node = parent ?? this.baseNode;

    for (const [index, child] of node.children.entries()) {
      const prevHeight = node.children
        .filter((_, idx) => idx < index)
        .reduce((total, node) => total + node.childrenHeight, 0);

      const verticalSpace = index > 0 ? VERTICAL_SPACE * index : 0;
      const nodeWidth = node.normalizedWidth ?? node.width;

      child.y = node.y + prevHeight + verticalSpace;
      child.x = node.x + nodeWidth + HORIZONTAL_SPACE;

      this.updateTreePosition(child);
    }
  }
  updateView() {
    const { x, y } = this.position;

    this.wrapperEl.setAttribute(
      "transform",
      `translate(${x}, ${y}) scale(${this.scale})`
    );
  }
  renderTree(parent = null) {
    const node = parent ?? this.baseNode;

    this.wrapperEl.appendChild(node.el);
    node.adjustSize();

    for (const child of node.children) {
      this.renderTree(child);
    }
  }
  renderLine(parent = null) {
    const node = parent ?? this.baseNode;

    for (const child of node.children) {
      this.renderLine(child);

      const line = new Line({ from: node, to: child });
      this.lines.push(line);

      this.wrapperEl.appendChild(line.el);
    }
  }
}

export default JsonViewer;
