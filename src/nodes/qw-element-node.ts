import QWNode from './qw-node';
import {
  CSSProperties,
  CSSProperty,
  MediaProperty,
  MediaProperties,
  PseudoSelectorProperty
} from '@qualweb/qw-element';

class QWElementNode extends QWNode {
  private readonly elementsCSSRules?: Map<Element, CSSProperties>;
  private selector: string;

  constructor(node: Node | Element, elementsCSSRules?: Map<Element, CSSProperties>) {
    super(node);
    this.elementsCSSRules = elementsCSSRules;
    this.selector = '';
    const selector = (<Element>node).getAttribute('_selector');
    if (selector) {
      this.selector = selector;
    }
  }

  public getText(): string | null {
    const element = <Element>this.node;
    return element.textContent;
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

  public hasParent(parentName: string): boolean {
    const element = <Element>this.node;
    const parentElement = element.parentElement;
    return parentElement ? parentElement.tagName.trim().toLowerCase() === parentName.trim().toLowerCase() : false;
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

  public querySelector(selector: string): QWElement | null {
    const element = <Element>this.node;
    const result = element.querySelector(selector);
    if (result) {
      return this.convertToQWElementNode(result);
    } else {
      return null;
    }
  }

  public getBoundingBox(): DOMRect {
    const element = <Element>this.node;
    return element.getBoundingClientRect();
  }

  private addCSSRulesPropertyToElement(element: Element): void {
    if (this.elementsCSSRules?.has(element)) {
      element.setAttribute('_cssRules', 'true');
    }
  }

  private convertToQWElementNode(element: Element): QWElementNode {
    this.addCSSRulesPropertyToElement(element);
    return new QWElementNode(element, this.elementsCSSRules);
  }
}

export = QWElementNode;
