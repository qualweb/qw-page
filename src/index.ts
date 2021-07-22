import { CSSProperties } from '@qualweb/qw-element';
import Cache from './cache.object';
import CSSMapper from './css.mapper';
import QWElementNode from './nodes/qw-element-node';
import SelectorCalculator from './selectorCalculator.object';

class QWPage {
  private readonly cache: Cache;
  private readonly document: Document | ShadowRoot;
  private readonly url: string;
  private readonly extraDocuments: Map<string, QWPage>;
  private readonly elementsCSSRules?: Map<Node, CSSProperties>;

  constructor(document: Document | ShadowRoot, addCSSRulesToElements?: boolean) {
    this.document = document;
    this.cache = new Cache();
    this.extraDocuments = new Map<string, QWPage>();

    new SelectorCalculator(document).processElementSelector();

    if (addCSSRulesToElements) {
      this.elementsCSSRules = new CSSMapper(this.document).map();
    }
    this.url = this.document.baseURI;
    this.processIframes();
    this.processShadowDom();
  }

  public createQWElementNode(element: Element): QWElementNode {
    return new QWElementNode(element);
  }

  public processShadowDom(): void {
    const listElements = this.document.querySelectorAll('*');

    for (const element of listElements ?? []) {
      if (element.shadowRoot !== null) {
        element.innerHTML = '';
        const shadowRoot = new QWElementNode(element);
        const selector = shadowRoot.getElementSelector();
        const shadowPage = new QWPage(element.shadowRoot, true);
        this.extraDocuments.set(selector, shadowPage);
      }
    }
  }

  private processIframes(): void {
    const elements = this.document.querySelectorAll('iframe');

    for (const iframe of elements ?? []) {
      try {
        const iframeQW = new QWElementNode(iframe);
        const contentWindow = iframeQW.getContentFrame();
        const frame = contentWindow;
        if (frame && frame.defaultView) {
          const selector = iframeQW.getElementSelector();
          const iframePage = new QWPage(frame, true);
          this.extraDocuments.set(selector, iframePage);
        }
      } catch (e) {
        //console.log(e);
      }
    }
  }

  private addCSSRulesPropertyToElement(element: Element | null): void {
    if (element && this.elementsCSSRules?.has(element)) {
      element.setAttribute('_cssRules', 'true');
    }
  }

  private addIframeAttribute(elements: Array<QWElementNode>, selector: string): void {
    for (const element of elements) {
      element.setElementAttribute('_documentSelector', selector);
    }
  }

  public cacheValue(selector: string, method: string, value?: string): void {
    this.cache.put(selector + ',' + method, value);
  }

  public getCachedValue(selector: string, method: string): string | undefined {
    return this.cache.get(selector + ',' + method);
  }

  public isValueCached(selector: string, method: string): boolean {
    return this.cache.exists(selector + ',' + method);
  }

  public getURL(): string {
    return this.url;
  }

  private getElementFromDocument(selector: string): QWElementNode | null {
    const element = this.document.querySelector(selector);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElementNode(element, this.elementsCSSRules) : null;
  }

  private getElementsFromDocument(selector: string): Array<QWElementNode> {
    const elements = this.document.querySelectorAll(selector);
    const qwList = new Array<QWElementNode>();

    elements.forEach((element: Element) => {
      this.addCSSRulesPropertyToElement(element);
      qwList.push(new QWElementNode(element, this.elementsCSSRules));
    });

    return qwList;
  }

  public querySelector(
    selector: string,
    specificDocument?: QWElementNode,
    documentSelector?: string
  ): QWElementNode | null {
    let element: QWElementNode | null = null;
    let iframeSelector: string | null | undefined = null;
    if (specificDocument || !!documentSelector) {
      if (specificDocument) {
        iframeSelector = specificDocument.getAttribute('_documentSelector');
      } else {
        iframeSelector = documentSelector;
      }
      if (!!iframeSelector && !!this.extraDocuments.has(iframeSelector)) {
        const iframePage = this.extraDocuments.get(iframeSelector);
        if (iframePage) {
          element = iframePage.querySelector(selector, specificDocument);
        }
      } else {
        element = this.getElementFromDocument(selector);
      }
    } else {
      element = this.getElementFromDocument(selector);
      if (!element) {
        //search iframes
        this.extraDocuments.forEach((iframe: QWPage, key: string) => {
          if (!element) {
            element = iframe.querySelector(selector);
            iframeSelector = key;
          }
        });
        /*const iframeKeys = Array.from(this.extraDocuments.keys());
        console.log(iframeKeys);
        let i = 0;
        while (!element && i < iframeKeys.length) {
          const iframePage = this.extraDocuments.get(iframeKeys[i]);
          if (iframePage) {
            element = iframePage.getElement(selector);
            iframeSelector = iframeKeys[i];
            i++;
          }
        }*/
      }
    }

    if (element && iframeSelector) {
      this.addIframeAttribute([element], iframeSelector);
    }

    return element;
  }

  public querySelectorAll(
    selector: string,
    specificDocument?: QWElementNode,
    documentSelector?: string
  ): Array<QWElementNode> {
    let iframeSelector;
    const elements = new Array<QWElementNode>();
    if (specificDocument || !!documentSelector) {
      if (specificDocument) {
        iframeSelector = specificDocument.getAttribute('_documentSelector');
      } else {
        iframeSelector = documentSelector;
      }

      if (!!iframeSelector && !!this.extraDocuments.has(iframeSelector)) {
        const iframePage = this.extraDocuments.get(iframeSelector);
        if (iframePage) {
          elements.push(...iframePage.querySelectorAll(selector, specificDocument));
          this.addIframeAttribute(elements, iframeSelector);
        }
      } else {
        elements.push(...this.getElementsFromDocument(selector));
      }
    } else {
      // console.log(this.getElementsFromDocument(selector));
      elements.push(...this.getElementsFromDocument(selector));
      //search iframes
      this.extraDocuments.forEach((iframe: QWPage, key: string) => {
        const iframeElements = iframe.querySelectorAll(selector);
        this.addIframeAttribute(iframeElements, key);
        elements.push(...iframeElements);
      });
      /*const iframeKeys = Array.from(this.extraDocuments.keys());
      for (const key of iframeKeys ?? []) {
        const iframePage = this.extraDocuments.get(key);
        if (iframePage) {
          const iframeElements = iframePage.getElements(selector);
          this.addIframeAttribute(iframeElements, key);
          elements.push(...iframeElements);
        }
      }*/
    }
    return elements;
  }

  public getElementById(id: string): QWElementNode | null {
    const element = this.document.querySelector(`[id='${id}']`);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElementNode(element, this.elementsCSSRules) : null;
  }

  public getElementByAttributeName(name: string): QWElementNode | null {
    const element = this.document.querySelector(`[name='${name}']`);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElementNode(element, this.elementsCSSRules) : null;
  }

  public getPageRootElement(): QWElementNode | null {
    if (this.document instanceof Document) {
      const documentElement = this.document.documentElement;
      this.addCSSRulesPropertyToElement(documentElement);
      return documentElement ? new QWElementNode(documentElement, this.elementsCSSRules) : null;
    } else {
      return null;
    }
  }

  public toString(): string {
    if (this.document instanceof ShadowRoot) {
      return this.document.innerHTML;
    } else {
      return this.document.documentElement.outerHTML;
    }
  }

  public getFocusedElement(): QWElementNode | null {
    const activeElement = this.document.activeElement;
    this.addCSSRulesPropertyToElement(activeElement);
    return activeElement ? new QWElementNode(activeElement, this.elementsCSSRules) : null;
  }

  public cleanAllElements(): void {
    const html = this.document.querySelector('html');
    if (html) {
      html.removeAttribute('_selector');
      html.removeAttribute('_cssRules');
      html.removeAttribute('_documentSelector');
      const children = html.children;
      if (children) this.cleanAllElementsAux([...children]);
    }
  }

  private cleanAllElementsAux(elements: Array<Element>): void {
    for (const element of elements ?? []) {
      element.removeAttribute('_selector');
      element.removeAttribute('_cssRules');
      element.removeAttribute('_documentSelector');
      const children = element.children;
      if (children && children.length > 0) {
        this.cleanAllElementsAux([...children]);
      }
    }
  }
}

window.qwPage = new QWPage(document, true);

export { QWPage };
