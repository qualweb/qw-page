import QWNode from './qw-node';
import {
  CSSProperties,
  CSSProperty,
  MediaProperties,
  MediaProperty,
  PseudoSelectorProperty
} from '@qualweb/qw-element';

class QWElementNode extends QWNode {
  private selector: string | undefined;

  constructor(node: Node | Element, elementsCSSRules?: Map<Node, CSSProperties>) {
    super(node, elementsCSSRules);
    const selector = (<Element>node).getAttribute('_selector');
    if (selector) {
      this.selector = selector;
    }
  }

  public hasCSSRules(): boolean {
    const element = <Element>this.node;
    return element.getAttribute('_cssRules') === 'true';
  }

  public getCSSRules(): CSSProperties | undefined {
    return this.elementsCSSRules?.get(this.node);
  }

  public hasCSSProperty(property: string, pseudoStyle?: string, media?: string): boolean {
    if (this.elementsCSSRules?.has(this.node)) {
      const rules = this.elementsCSSRules?.get(this.node);

      if (rules) {
        if (pseudoStyle && media) {
          return (
            (<PseudoSelectorProperty>(<MediaProperty>(<MediaProperties>rules.media)[media])[pseudoStyle])[property] !==
            undefined
          );
        } else if (pseudoStyle) {
          return (<PseudoSelectorProperty>rules[pseudoStyle])[property] !== undefined;
        } else if (media) {
          return <CSSProperty>(<MediaProperty>(<MediaProperties>rules.media)[media])[property] !== undefined;
        }
      }

      return !rules || rules[property] !== undefined;
    }

    return false;
  }

  public getCSSProperty(property: string, pseudoStyle?: string, media?: string): CSSProperty | undefined {
    if (this.elementsCSSRules?.has(this.node)) {
      const rules = this.elementsCSSRules?.get(this.node);

      if (rules) {
        if (pseudoStyle && media) {
          return (<PseudoSelectorProperty>(<MediaProperty>(<MediaProperties>rules.media)[media])[pseudoStyle])[
            property
          ];
        } else if (pseudoStyle) {
          return (<PseudoSelectorProperty>rules[pseudoStyle])[property];
        } else if (media) {
          return <CSSProperty>(<MediaProperty>(<MediaProperties>rules.media)[media])[property];
        } else {
          return <CSSProperty>rules[property];
        }
      }
    }

    return undefined;
  }

  public getCSSMediaRules(): MediaProperty | undefined {
    if (this.elementsCSSRules?.has(this.node)) {
      const rules = this.elementsCSSRules?.get(this.node);
      if (rules) {
        return <MediaProperty>rules['media'];
      }
    }

    return undefined;
  }

  public getCSSPseudoSelectorRules(pseudoSelector: string): PseudoSelectorProperty | undefined {
    if (this.elementsCSSRules?.has(this.node)) {
      const rules = this.elementsCSSRules?.get(this.node);
      if (rules) {
        return <PseudoSelectorProperty>rules[pseudoSelector];
      }
    }

    return undefined;
  }

  public getText(): string | null {
    const element = <Element>this.node;
    if (element.shadowRoot) {
      return element.shadowRoot.textContent;
    } else {
      return element.textContent;
    }
  }

  public getOwnText(): string | null {
    let text: string | null = null;

    const element = <Element>this.node;
    element.childNodes.forEach((child: ChildNode) => {
      if (child.nodeType === 3 && child.textContent && child.textContent.trim() !== '') {
        if (text === null) {
          text = child.textContent.trim();
        } else {
          text += child.textContent.trim();
        }
      }
    });

    return text;
  }

  public hasNonEmptyTextNode(): boolean {
    const element = <Element>this.node;

    let hasTextNode = false;
    element.childNodes.forEach((child: ChildNode) => {
      if (child.nodeType === 3 && child.textContent && child.textContent.trim() !== '') {
        hasTextNode = true;
      }
    });
    return hasTextNode;
  }

  public hasAttributes(): boolean {
    const element = <Element>this.node;
    return element.getAttributeNames().length > 0;
  }

  public hasAttribute(attribute: string): boolean {
    const element = <Element>this.node;
    return element.getAttributeNames().includes(attribute);
  }

  public hasChildren(): boolean {
    const element = <Element>this.node;
    return element.children.length > 0;
  }

  public hasChild(childName: string): boolean {
    const element = <Element>this.node;
    const children = element.children;

    let hasChild = false;
    for (let i = 0; i < children.length && !hasChild; i++) {
      const child = children.item(i);
      if (child && child.tagName.trim().toLowerCase() === childName.trim().toLowerCase()) {
        hasChild = true;
      }
    }
    return hasChild;
  }

  public getParent(): QWElementNode | null {
    const element = <Element>this.node;
    if (element.parentElement) {
      return this.convertToQWElementNode(element.parentElement);
    } else {
      return null;
    }
  }

  public hasParent(parentName: string): boolean {
    const element = <Element>this.node;
    const parentElement = element.parentElement;
    return parentElement ? parentElement.tagName.trim().toLowerCase() === parentName.trim().toLowerCase() : false;
  }

  public getParentAllContexts(): QWElementNode | null {
    const element = <Element>this.node;
    let parent = element.parentElement;
    if (!parent) {
      const context = element.getAttribute('_documentSelector');
      if (context) {
        parent = document.querySelector(context);
      }
    }
    if (parent) {
      return this.convertToQWElementNode(parent);
    } else {
      return null;
    }
  }

  public getAttribute(attribute: string): string | null {
    const element = <Element>this.node;
    return element.getAttribute(attribute);
  }

  public getAttributes(): { [attr: string]: string } {
    const element = <Element>this.node;
    const attributes: { [attr: string]: string } = {};
    for (const attr of element.getAttributeNames() ?? []) {
      const value = element.getAttribute(attr);
      if (value) {
        attributes[attr] = value;
      }
    }
    return attributes;
  }

  public getElementAttributesName(): Array<string> {
    const element = <Element>this.node;
    return element.getAttributeNames();
  }

  public setElementAttribute(attribute: string, value: string): void {
    const element = <Element>this.node;
    element.setAttribute(attribute, value);
  }

  public querySelector(selector: string): QWElementNode | null {
    const element = <Element>this.node;
    const result = element.querySelector(selector);
    if (result) {
      return this.convertToQWElementNode(result);
    } else {
      return null;
    }
  }

  public querySelectorAll(selector: string): Array<QWElementNode> {
    const element = <Element>this.node;
    return this.convertAllToQWElementNode(element.querySelectorAll(selector));
  }

  public shadowQuerySelector(selector: string): QWElementNode | null {
    const element = <Element>this.node;
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const result = shadowRoot.querySelector(selector);
      if (result) {
        return this.convertToQWElementNode(result);
      }
    }
    return null;
  }

  public shadowQuerySelectorAll(selector: string): Array<QWElementNode> {
    const element = <Element>this.node;
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      this.convertAllToQWElementNode(shadowRoot.querySelectorAll(selector));
    }
    return [];
  }

  public previousElementSibling(): QWElementNode | null {
    const element = <Element>this.node;
    if (element.previousElementSibling) {
      return this.convertToQWElementNode(element.previousElementSibling);
    } else {
      return null;
    }
  }

  public nextElementSibling(): QWElementNode | null {
    const element = <Element>this.node;
    if (element.nextElementSibling) {
      return this.convertToQWElementNode(element.nextElementSibling);
    } else {
      return null;
    }
  }

  public getNumberOfSiblingsWithTheSameTag(tag: string): number {
    const element = <Element>this.node;

    let count = 1;
    let nextSibling = element.nextElementSibling;

    while (nextSibling) {
      if (nextSibling.tagName.toLowerCase() === tag.toLowerCase().trim()) {
        count++;
      }
      nextSibling = nextSibling.nextElementSibling;
    }

    return count;
  }

  public getChildren(): Array<QWElementNode> {
    const element = <Element>this.node;
    const list = new Array<QWElementNode>();
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child) {
        list.push(this.convertToQWElementNode(child));
      }
    }
    return list;
  }

  public getChildTextContent(childName: string): string | null {
    const element = <Element>this.node;
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child && child.tagName.toLowerCase() === childName.trim().toLowerCase()) {
        return child.textContent;
      }
    }
    return null;
  }

  public concatAccessibleNames(aNames: Array<string>): string {
    const element = <Element>this.node;
    const children = element.childNodes;

    let result = '';
    let textContent: string | null;
    let i = 0;
    let counter = 0;
    children.forEach((child: ChildNode) => {
      textContent = child.textContent;
      if (child.nodeType === 3 && !!textContent && textContent.trim() !== '') {
        result = result + (counter === 0 ? '' : ' ') + textContent.trim();
        counter++;
      } else if (child.nodeType === 1) {
        result = result + (counter > 0 && !!aNames[i] ? ' ' : '') + aNames[i];
        i++;
      }
    });

    if (!result) {
      result = '';
    }

    return result;
  }

  public getElementProperty(property: string): unknown {
    const element = <Element>this.node;
    //@ts-ignore
    return element[property];
  }

  public getTagName(): string {
    const element = <Element>this.node;
    return element.tagName.toLowerCase();
  }

  public toString(withText: boolean, fullElement: boolean): string {
    const element = <Element>this.node;
    const cssRules = element.getAttribute('_cssRules');
    const selector = element.getAttribute('_selector');
    const documentSelector = element.getAttribute('_documentSelector');
    element.removeAttribute('_cssRules');
    element.removeAttribute('_selector');
    element.removeAttribute('_documentSelector');

    let result;
    if (fullElement) {
      const children = element.children;
      const attributeArray = new Array<{ [attr: string]: string | null }>();
      for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        if (child) {
          const cssRulesValue = child.getAttribute('_cssRules');
          const selectorValue = child.getAttribute('_selector');
          const documentSelectorValue = child.getAttribute('_documentSelector');

          attributeArray.push({
            cssRulesValue,
            selectorValue,
            documentSelectorValue
          });
          child.removeAttribute('_cssRules');
          child.removeAttribute('_selector');
          child.removeAttribute('_documentSelector');
        }
      }

      result = element.outerHTML;

      for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        if (child) {
          const attributes = attributeArray[i];
          if (attributes.cssRulesValue) {
            child.setAttribute('_cssRules', attributes.cssRulesValue);
          }
          if (attributes.selectorValue) {
            child.setAttribute('_selector', attributes.selectorValue);
          }
          if (attributes.documentSelectorValue) {
            child.setAttribute('_documentSelector', attributes.documentSelectorValue);
          }
        }
      }
    } else if (withText) {
      const clonedElem = <Element>element.cloneNode(false);
      const text = element.textContent;
      clonedElem.innerHTML = text !== null ? text : '';
      result = clonedElem.outerHTML;
    } else {
      const clonedElem = <Element>element.cloneNode(false);
      clonedElem.innerHTML = '';
      result = clonedElem.outerHTML;
    }
    if (cssRules) {
      element.setAttribute('_cssRules', cssRules);
    }
    if (selector) {
      element.setAttribute('_selector', selector);
    }
    if (documentSelector) {
      element.setAttribute('_documentSelector', documentSelector);
    }
    return result;
  }

  public isOffScreen(): boolean {
    const scrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );

    const scrollWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.body.clientWidth,
      document.documentElement.clientHeight
    );

    const bounding = this.getBoundingBox();
    const left = bounding.left;
    const right = bounding.right;
    const bottom = bounding.bottom;
    const top = bounding.top;

    const noParentScrollTop = this.noParentScrolled(bottom);

    return (
      left > scrollWidth ||
      right < 0 ||
      (bottom < 0 && noParentScrollTop) ||
      top > scrollHeight ||
      (right === 0 && left === 0)
    );
  }

  public getContentFrame(): Document | null {
    const element = <Element>this.node;
    if (element.tagName.toLowerCase() === 'iframe') {
      const iframe = <HTMLIFrameElement>element;
      const contentWindow = iframe.contentWindow;

      if (contentWindow) {
        return contentWindow.document;
      }
    }

    return null;
  }

  public focusElement(): void {
    const htmlElement = <HTMLElement>this.node;
    htmlElement.focus();
  }

  public click(): void {
    const htmlElement = <HTMLElement>this.node;
    htmlElement.click();
  }

  public getBoundingBox(): DOMRect {
    const element = <Element>this.node;
    return element.getBoundingClientRect();
  }

  public getElementSelector(): string {
    if (this.selector) {
      const element = <Element>this.node;
      if (element.tagName.toLowerCase() === 'html') {
        return 'html';
      } else if (element.tagName.toLowerCase() === 'head') {
        return 'html > head';
      } else if (element.tagName.toLowerCase() === 'body') {
        return 'html > body';
      }
      let selector = '';
      const parents = new Array<string>();
      let parent = element.parentElement;
      while (parent) {
        parents.unshift(this.getSelfLocationInParent(parent));
        parent = parent['parentElement'];
      }
      if (parents.length > 0) {
        selector += parents.join(' > ');
        selector += ' > ' + this.getSelfLocationInParent(element);
      } else {
        selector += this.getSelfLocationInParent(element);
      }

      const documentSelector = element.getAttribute('_documentSelector');
      if (documentSelector) {
        selector = documentSelector + selector;
      }
      this.selector = selector;
      return selector;
    } else {
      return this.selector ?? '';
    }
  }

  private getSelfLocationInParent(element: Element): string {
    let selector = '';

    if (element.tagName.toLowerCase() === 'body' || element.tagName.toLowerCase() === 'head') {
      return element.tagName.toLowerCase();
    }

    let sameEleCount = 0;

    let prev = element.previousElementSibling;
    while (prev) {
      if (prev.tagName.toLowerCase() === element.tagName.toLowerCase()) {
        sameEleCount++;
      }
      prev = prev.previousElementSibling;
    }

    selector += `${element.tagName.toLowerCase()}:nth-of-type(${sameEleCount + 1})`;

    return selector;
  }

  private noParentScrolled(offset: number): boolean {
    const element = <Element>this.node;
    let parent = element.parentElement;
    while (parent && parent.nodeName.toLowerCase() !== 'html') {
      if (element.scrollTop) {
        offset += element.scrollTop;
        if (offset >= 0) {
          return false;
        }
      }
      parent = parent.parentElement;
    }
    return true;
  }
}

export = QWElementNode;
