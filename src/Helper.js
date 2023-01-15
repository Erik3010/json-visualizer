class Helper {
  static createElement(
    tagName,
    { attributes = {}, classList = [], withNamespace = true, text = null } = {}
  ) {
    const namespace = "http://www.w3.org/2000/svg";
    const element = withNamespace
      ? document.createElementNS(namespace, tagName)
      : document.createElement(tagName);

    for (const key in attributes) {
      element.setAttribute(key, attributes[key]);
    }

    for (const key in classList) {
      element.classList.add(classList[key]);
    }

    text && (element.textContent = text);

    return element;
  }
  static isObject(value) {
    return value instanceof Object && value.constructor === Object;
  }
  static isArray(value) {
    return Array.isArray(value);
  }
  static isPrimitive(value) {
    return value !== Object(value);
  }
  static hasPrimitiveValue(obj) {
    for (const key in obj) {
      if (Helper.isPrimitive(obj[key])) return true;
    }

    return false;
  }
  static randomId() {
    const S4 = () =>
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  }
}

export default Helper;
