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
  constructor({ container, data }) {
    this.container = container;
    this.data = data;

    this.mouseDownHandler = this.handleMouseDown.bind(this);
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    this.mouseUpHandler = this.handleMouseUp.bind(this);
    this.mouseWheelHandler = this.handleMouseWheel.bind(this);

    this.init();
  }
  initState() {
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

    this.selectedNode = null;
    this.unactiveNodes = [];
  }
  init() {
    this.initState();

    const { height } = this.container.getBoundingClientRect();
    this.baseNode = new Node({
      id: Helper.randomId(),
      hoverCb: this.handleHoverNode.bind(this),
      unHoverCb: this.handleUnHoverNode.bind(this),
      value: this.data,
      x: 50,
      y: height / 2,
      isBaseNode: true,
    });

    this.container.replaceChildren();

    this.setSVG();
    this.registListener();
    this.render();
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
  registListener() {
    this.container.addEventListener("mousedown", this.mouseDownHandler);
    this.container.addEventListener("mousemove", this.mouseMoveHandler);
    this.container.addEventListener("mouseup", this.mouseUpHandler);
    this.container.addEventListener("wheel", this.mouseWheelHandler);
  }
  unRegistListener() {
    this.container.removeEventListener("mousedown", this.mouseDownHandler);
    this.container.removeEventListener("mousemove", this.mouseMoveHandler);
    this.container.removeEventListener("mouseup", this.mouseUpHandler);
    this.container.removeEventListener("wheel", this.mouseWheelHandler);
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
  updateData(data) {
    this.data = data;
    this.unRegistListener();
    this.init();
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
      id: Helper.randomId(),
      x: parent.x + parent.width,
      y: parent.y + parent.height / 2,
      hoverCb: this.handleHoverNode.bind(this),
      unHoverCb: this.handleUnHoverNode.bind(this),
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
  render() {
    this.buildTree(this.baseNode);
    this.renderTree();
    this.computeTreePosition();
    this.updateTreePosition();
    this.renderLine();

    console.log(this.baseNode);
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
  buildPath(stack, to) {
    const path = [to];
    let parent = stack.find((node) => node.to.id === to.id)?.from;
    while (parent) {
      path.push(parent);
      parent = stack.find((node) => node.to.id === parent.id)?.from;
    }

    return path;
  }
  findChildren(nodeId) {
    const stack = [];
    const queue = [this.baseNode];
    const visited = new Set();

    while (queue.length) {
      const node = queue.shift();

      if (visited.has(node.id)) continue;
      visited.add(node.id);

      if (node.id === nodeId) return this.buildPath(stack, node);
      // if (node.id === nodeId) return stack;

      for (const child of node.children) {
        if (visited.has(child.id)) continue;

        queue.push(child);
        stack.push({ from: node, to: child });
      }
    }

    return [];
  }
  handleHoverNode(event, node) {
    if (node.id === this.selectedNode?.id) return;

    this.selectedNode = node;

    const path = this.findChildren(node.id);

    for (const pathNode of path) {
      if (pathNode.isBaseNode) continue;

      const line = this.lines.find((line) => line.to.id === pathNode.id);
      line.highlight = true;
    }

    const traverseTree = (node) => {
      if (!path.find((pathNode) => pathNode.id === node.id)) {
        node.unactive = true;
        this.unactiveNodes.push(node);

        if (!node.isBaseNode) {
          const line = this.lines.find((line) => line.to.id === node.id);
          line.unactive = true;
        }
      }

      for (const child of node.children) {
        traverseTree(child);
      }
    };

    traverseTree(this.baseNode);
  }
  handleUnHoverNode(event, node) {
    for (const line of this.lines) {
      line.highlight = false;
      line.unactive = false;
    }

    for (const unactiveNode of this.unactiveNodes) {
      unactiveNode.unactive = false;
    }

    this.unactiveNodes = [];
    this.selectedNode = null;

    // console.log(node.id);
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
  getMousePosition(event) {
    const { top, left } = this.container.getBoundingClientRect();

    return {
      x: event.clientX - left,
      y: event.clientY - top,
    };
  }
}

export default JsonViewer;
