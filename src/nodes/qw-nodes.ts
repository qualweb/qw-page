import { CSSProperties, CSSProperty, MediaProperties, MediaProperty, PseudoSelectorProperty } from '@qualweb/qw-page';

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

  public previousSibling(): QWNode | null {
    const sibling = this.node.previousSibling;
    if (sibling) {
      return this.convertToQWNode(sibling);
    } else {
      return null;
    }
  }

  public nextSibling(): QWNode | null {
    const sibling = this.node.nextSibling;
    if (sibling) {
      return this.convertToQWNode(sibling);
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
    return new QWNode(node, this.elementsCSSRules);
  }

  toQWElementNode(): QWElementNode {
    if (this.node instanceof Element) {
      return new QWElementNode(this.node, this.elementsCSSRules);
    }
    throw new Error(`Node of type ${this.getType()} can't be converted to QWElement.`);
  }

  toQWTextNode(): QWTextNode {
    return new QWTextNode(this.node, this.elementsCSSRules);
  }

  toQWCommentNode(): QWCommentNode {
    return new QWCommentNode(this.node, this.elementsCSSRules);
  }
}

class QWElementNode extends QWNode {
  selector: string | undefined;

  constructor(node: Node | Element, elementsCSSRules?: Map<Node, CSSProperties>) {
    super(node, elementsCSSRules);
    if (node instanceof Element) {
      this.addCSSRulesPropertyToElement(node);
    }
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

  public getComputedStyle(property: string, pseudoStyle: string | null): string {
    const element = <Element>this.node;
    const styles = getComputedStyle(element, pseudoStyle);
    return styles.getPropertyValue(property);
  }

  public getText(): string | null {
    const element = <Element>this.node;

    let text = element.textContent;

    if (element.shadowRoot) {
      if (text) {
        text += element.shadowRoot.textContent ?? '';
      } else {
        text = element.shadowRoot.textContent;
      }
    }

    return text;
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

    if (element.shadowRoot) {
      element.shadowRoot.childNodes.forEach((child: ChildNode) => {
        if (child.nodeType === 3 && child.textContent && child.textContent.trim() !== '') {
          if (text === null) {
            text = child.textContent.trim();
          } else {
            text += child.textContent.trim();
          }
        }
      });
    }

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
    if (!hasTextNode && element.shadowRoot) {
      element.shadowRoot.childNodes.forEach((child: ChildNode) => {
        if (child.nodeType === 3 && child.textContent && child.textContent.trim() !== '') {
          hasTextNode = true;
        }
      });
    }
    return hasTextNode;
  }

  public hasVisualTextContent(): boolean {
    if (!this.isVisible()) {
      return false;
    } else if (this.hasNonEmptyTextNode()) {
      return true;
    } else {
      const element = <Element>this.node;
      let hasVisualTextContent = false;
      for (const child of element.children) {
        hasVisualTextContent ||= this.convertToQWElementNode(child).hasVisualTextContent();
        if (hasVisualTextContent) {
          break;
        }
      }
      return hasVisualTextContent;
    }
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
    /*const element = <Element>this.node;
    if (element.parentElement) {
      return this.convertToQWElementNode(element.parentElement);
    } else {
      return null;
    }*/
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

  public getAttributeNames(): Array<string> {
    const element = <Element>this.node;
    return element.getAttributeNames();
  }

  public setAttribute(attribute: string, value: string): void {
    const element = <Element>this.node;
    element.setAttribute(attribute, value);
  }

  public find(selector: string): QWElementNode | null {
    const element = <Element>this.node;
    const result = element.querySelector(selector);
    if (result) {
      return this.convertToQWElementNode(result);
    } else {
      return null;
    }
  }

  public findAll(selector: string): Array<QWElementNode> {
    const element = <Element>this.node;
    return this.convertAllToQWElementNode(element.querySelectorAll(selector));
  }

  //TODO: uncomment next build
  /*public findVisible(selector: string): QWElementNode | null {
    const elements = this.findAllVisible(selector);
    return elements[0] ?? null;
  }

  public findAllVisible(selector: string): Array<QWElementNode> {
    const element = <Element>this.node;

    const elements = new Array<QWElementNode>();
    for (const ele of this.convertAllToQWElementNode(element.querySelectorAll(selector))) {
      if (ele.isVisible()) {
        elements.push(ele);
      }
    }

    return elements;
  }*/

  public shadowFind(selector: string): QWElementNode | null {
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

  public shadowFindAll(selector: string): Array<QWElementNode> {
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

  //TODO: uncomment next build
  /*public previousElementSiblings(): Array<QWElementNode> {
    const siblings = new Array<QWElementNode>();
    const element = <Element>this.node;
    let sibling = element.previousElementSibling;
    while (sibling !== null) {
      siblings.push(this.convertToQWElementNode(sibling));
      sibling = sibling.previousElementSibling;
    }
    return siblings;
  }*/

  public nextElementSibling(): QWElementNode | null {
    const element = <Element>this.node;
    if (element.nextElementSibling) {
      return this.convertToQWElementNode(element.nextElementSibling);
    } else {
      return null;
    }
  }

  //TODO: uncomment next build
  /*public nextElementSiblings(): Array<QWElementNode> {
    const siblings = new Array<QWElementNode>();
    const element = <Element>this.node;
    let sibling = element.nextElementSibling;
    while (sibling !== null) {
      siblings.push(this.convertToQWElementNode(sibling));
      sibling = sibling.nextElementSibling;
    }
    return siblings;
  }*/

  public getNumberOfSiblingsWithTheSameTag(): number {
    const element = <Element>this.node;

    let count = 1;
    let nextSibling = element.nextElementSibling;

    while (nextSibling) {
      if (nextSibling.tagName.toLowerCase() === element.tagName.toLowerCase().trim()) {
        count++;
      }
      nextSibling = nextSibling.nextElementSibling;
    }

    let previousSibling = element.previousElementSibling;

    while (previousSibling) {
      if (previousSibling.tagName.toLowerCase() === element.tagName.toLowerCase().trim()) {
        count++;
      }
      previousSibling = previousSibling.previousElementSibling;
    }

    return count;
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

  //TODO: uncomment next build
  /*public getElementReferencedByHREF(): QWElementNode | null {
    return window.DomUtils.getElementReferencedByHREF(this);
  }*/

  public getProperty(property: string): unknown {
    const element = <Element>this.node;
    //@ts-ignore
    return element[property];
  }

  public getMediaDuration(): number | null {
    if (this.node instanceof HTMLMediaElement) {
      return (<HTMLMediaElement>this.node).duration;
    } else {
      return null;
    }
  }

  public hasMediaControls(): boolean | null {
    if (this.node instanceof HTMLMediaElement) {
      return (<HTMLMediaElement>this.node).controls;
    } else {
      return null;
    }
  }

  public isMediaMuted(): boolean | null {
    if (this.node instanceof HTMLMediaElement) {
      return (<HTMLMediaElement>this.node).muted;
    } else {
      return null;
    }
  }

  public isMediaWithAutoplay(): boolean | null {
    if (this.node instanceof HTMLMediaElement) {
      return (<HTMLMediaElement>this.node).autoplay;
    } else {
      return null;
    }
  }

  public videoHasAudio(): boolean {
    return window.DomUtils.objectElementIsNonText(this);
  }

  public getScrollHeight(): number {
    const element = <Element>this.node;
    return element.scrollHeight;
  }

  public getScrollWidth(): number {
    const element = <Element>this.node;
    return element.scrollWidth;
  }

  public getClientHeight(): number {
    const element = <Element>this.node;
    return element.clientHeight;
  }

  public getClientWidth(): number {
    const element = <Element>this.node;
    return element.clientWidth;
  }

  public getTagName(): string {
    const element = <Element>this.node;
    return element.tagName.toLowerCase();
  }

  public toString(withText = true, fullElement = false): string {
    const element = <Element>this.node.cloneNode(true);
    const cssRules = element.getAttribute('_cssRules');
    const selector = element.getAttribute('_selector');
    const documentSelector = element.getAttribute('_documentSelector');
    element.removeAttribute('_cssRules');
    element.removeAttribute('_selector');
    element.removeAttribute('_documentSelector');

    if (element.tagName.toLowerCase() === 'html' || element.tagName.toLowerCase() === 'head') {
      const scripts = element.querySelectorAll(
        '#qw-script-page, #qw-script-util, #qw-script-act, #qw-script-wcag, #qw-script-bp, #qw-script-counter'
      );

      for (const script of scripts ?? []) {
        script.remove();
      }
    }

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

  public isVisible(): boolean {
    return window.DomUtils.isElementVisible(this);
  }

  public isHidden(): boolean {
    return window.DomUtils.isElementHidden(this);
  }

  public isInTheAccessibilityTree(): boolean {
    return window.AccessibilityUtils.isElementInAT(this);
  }

  public isWidget(): boolean {
    return window.AccessibilityUtils.isElementWidget(this);
  }

  public isDescendantOf(names: Array<string>, roles: Array<string>): boolean {
    return window.DomUtils.isElementADescendantOf(this, names, roles);
  }

  public isDescendantOfExplicitRole(names: Array<string>, roles: Array<string>): boolean {
    return window.DomUtils.isElementADescendantOfExplicitRole(this, names, roles);
  }

  public allowsNameFromContent(): boolean {
    return window.AccessibilityUtils.allowsNameFromContent(this);
  }

  public getAccessibleName(): string | undefined {
    if (this.node instanceof SVGElement || this.isDescendantOf(['svg'], [])) {
      return window.AccessibilityUtils.getAccessibleNameSVG(this);
    } else {
      return window.AccessibilityUtils.getAccessibleName(this);
    }
  }

  public getAccessibleNameSVG(): string | undefined {
    return window.AccessibilityUtils.getAccessibleNameSVG(this);
  }

  public getAccessibleNameSelector(): Array<string> | undefined {
    return window.AccessibilityUtils.getAccessibleNameSelector(this);
  }

  public getRole(): string | null {
    return window.AccessibilityUtils.getElementRole(this);
  }

  public getImplicitRole(accessibleName: string | undefined): string | null {
    return window.AccessibilityUtils.getImplicitRole(this, accessibleName);
  }

  public getValidExplicitRole(): string | null {
    return window.AccessibilityUtils.getElementValidExplicitRole(this);
  }

  public hasGlobalARIAPropertyOrAttribute(): boolean {
    return window.AccessibilityUtils.elementHasGlobalARIAPropertyOrAttribute(this);
  }

  public hasValidRole(): boolean {
    return window.AccessibilityUtils.elementHasValidRole(this);
  }

  public getAriaOwner(): QWElementNode | null {
    return window.AccessibilityUtils.getAriaOwner(this);
  }

  public getLinkContext(): Array<string> {
    return window.AccessibilityUtils.getLinkContext(this);
  }

  public getOwnerElement(): QWElementNode | null {
    return window.AccessibilityUtils.getOwnerElement(this);
  }

  public getOwnedElements(): Array<QWElementNode> {
    return window.AccessibilityUtils.getOwnedElements(this);
  }

  public getValueFromEmbeddedControl(): string {
    return window.AccessibilityUtils.getValueFromEmbeddedControl(this);
  }

  public isDataTable(): boolean {
    return window.AccessibilityUtils.isDataTable(this);
  }

  public isChildPresentational(): boolean {
    return window.AccessibilityUtils.isElementChildPresentational(this);
  }

  public isOfTypeControl(): boolean {
    return window.AccessibilityUtils.isElementControl(this);
  }

  public isFocusable(): boolean {
    return window.AccessibilityUtils.isElementFocusable(this);
  }

  public isReferencedByAriaLabel(): boolean {
    return window.AccessibilityUtils.isElementReferencedByAriaLabel(this);
  }

  public isFocused(): boolean {
    return window.AccessibilityUtils.isFocusableBrowser(this);
  }

  public isPartOfSequentialFocusNavigation(): boolean {
    return window.AccessibilityUtils.isPartOfSequentialFocusNavigation(this);
  }

  public getSelector(): string {
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
        parent = parent.parentElement;
      }
      if (parents.length > 0) {
        selector += parents.join(' > ');
        selector += ' > ' + this.getSelfLocationInParent(element);
      } else {
        selector += this.getSelfLocationInParent(element);
      }

      const documentSelector = element.getAttribute('_documentSelector');
      if (documentSelector) {
        selector = documentSelector + ' > ' + selector;
      }
      element.setAttribute('_selector', selector);
      this.selector = selector;
      return selector;
    } else {
      return this.selector ?? '';
    }
  }

  getSelfLocationInParent(element: Element): string {
    let selector = '';

    if (
      element.tagName.toLowerCase() === 'html' ||
      element.tagName.toLowerCase() === 'body' ||
      element.tagName.toLowerCase() === 'head'
    ) {
      return element.tagName.toLowerCase();
    }

    let sameEleCount = 0;

    let prev = element.previousElementSibling;
    while (prev) {
      sameEleCount++;
      prev = prev.previousElementSibling;
    }

    selector += `${element.tagName.toLowerCase()}:nth-child(${sameEleCount + 1})`;

    return selector;
  }

  noParentScrolled(offset: number): boolean {
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
}

class QWCommentNode extends QWNode {
  constructor(node: Node, elementsCSSRules?: Map<Node, CSSProperties>) {
    super(node, elementsCSSRules);
  }

  public getData(): string | null {
    return (<Comment>this.node).textContent;
  }
}

class QWTextNode extends QWNode {
  constructor(node: Node, elementsCSSRules?: Map<Node, CSSProperties>) {
    super(node, elementsCSSRules);
  }

  public getText(): string | null {
    return (<Text>this.node).textContent;
  }

  public getWholeText(): string {
    return (<Text>this.node).wholeText;
  }
}

export { QWNode, QWElementNode, QWTextNode, QWCommentNode };
