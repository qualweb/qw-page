import QWCommentNode from './qw-comment-node';
import QWElementNode from './qw-element-node';
import QWTextNode from './qw-text-node';
import { CSSProperties } from '@qualweb/qw-page';

class QWNode {
  node: Node;
  elementsCSSRules?: Map<Node, CSSProperties>;

  constructor(node: Node, elementsCSSRules?: Map<Node, CSSProperties>) {
    this.node = node;
    this.elementsCSSRules = elementsCSSRules;
  }

  public getType(): string {
    return this.node.nodeType === 1
      ? 'tag'
      : this.node.nodeType === 2
      ? 'attribute'
      : this.node.nodeType === 3
      ? 'text'
      : 'comment';
  }

  public hasChildNodes(): boolean {
    return this.node.hasChildNodes();
  }

  public hasTextNode(): boolean {
    let hasText = false;
    this.node.childNodes.forEach((child: ChildNode) => {
      if (child.nodeType === 3 && child.textContent?.trim() !== '') {
        hasText = true;
      }
    });
    return hasText;
  }

  public isHTMLElement(): boolean {
    return this.node instanceof HTMLElement;
  }

  public previousSibling(): QWElementNode | QWTextNode | QWCommentNode | QWNode | null {
    const sibling = this.node.previousSibling;
    if (sibling) {
      if (sibling.nodeType === 1) {
        return this.convertToQWElementNode(<Element>sibling);
      } else if (sibling.nodeType === 3) {
        return this.convertToQWTextNode(sibling);
      } else if (sibling.nodeType === 8) {
        return this.convertToQWCommentNode(sibling);
      } else {
        return this.convertToQWNode(sibling);
      }
    } else {
      return null;
    }
  }

  public nextSibling(): QWElementNode | QWTextNode | QWCommentNode | QWNode | null {
    const sibling = this.node.nextSibling;
    if (sibling) {
      if (sibling.nodeType === 1) {
        return this.convertToQWElementNode(<Element>sibling);
      } else if (sibling.nodeType === 3) {
        return this.convertToQWTextNode(sibling);
      } else if (sibling.nodeType === 8) {
        return this.convertToQWCommentNode(sibling);
      } else {
        return this.convertToQWNode(sibling);
      }
    } else {
      return null;
    }
  }

  public getParentNode(): QWNode | null {
    if (this.node.parentNode) {
      return this.convertToQWNode(this.node.parentNode);
    } else {
      return null;
    }
  }

  convertToQWNode(node: Node): QWNode {
    if (node instanceof Element) {
      this.addCSSRulesPropertyToElement(node);
    }
    return new QWNode(node, this.elementsCSSRules);
  }

  convertAllToQWElementNode(elements: NodeListOf<Element>): Array<QWElementNode> {
    const list = new Array<QWElementNode>();
    elements.forEach((element: Element) => {
      list.push(this.convertToQWElementNode(element));
    });
    return list;
  }

  convertToQWElementNode(element: Element): QWElementNode {
    this.addCSSRulesPropertyToElement(element);
    return new QWElementNode(element, this.elementsCSSRules);
  }

  addCSSRulesPropertyToElement(element: Element): void {
    if (this.elementsCSSRules?.has(element)) {
      element.setAttribute('_cssRules', 'true');
    }
  }

  convertToQWTextNode(node: ChildNode): QWTextNode {
    return new QWTextNode(node, this.elementsCSSRules);
  }

  convertToQWCommentNode(node: ChildNode): QWCommentNode {
    return new QWCommentNode(node, this.elementsCSSRules);
  }
}

export = QWNode;
