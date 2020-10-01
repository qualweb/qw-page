import { QWElement } from '@qualweb/qw-element';
import Cache from './cache.object';
import CSSMapper from './css.mapper';
import SelectorCalculator from './selectorCalculator.object ';

class QWPage {

  private cache: Cache;
  private readonly document: Document | ShadowRoot;
  private url: string;
  private extraDocuments: Map<string, QWPage>;
  private elementsCSSRules?: Map<Element, any>;
  private readonly window: Window;

  constructor(document: Document | ShadowRoot, window: Window, addCSSRulesToElements?: boolean, url?: string) {
    this.document = document;
    this.cache = new Cache();
    this.extraDocuments = new Map<string, QWPage>();
    this.url = "";
    this.window = window;
    let selectorCalculator = new SelectorCalculator(document);
    selectorCalculator.processElementSelector();

    if (!!addCSSRulesToElements) {
      this.elementsCSSRules = new CSSMapper(this.document).map();
    }
    this.url = this.document.baseURI;
    this.processIframes();
    this.processShadowDom();
  }


  public processShadowDom(): void {
    const listElements = this.document.querySelectorAll('*');
    let shadowRoot, selector, shadowPage;

    for (const element of listElements || []) {
      if (element.shadowRoot !== null) {
        element.innerHTML = "";
        shadowRoot = new QWElement(element);
        selector = shadowRoot.getElementSelector();
        shadowPage = new QWPage(element.shadowRoot, this.window, true, this.url);
        this.extraDocuments[selector] = shadowPage;
      }
    }
  }
  private processIframes(): void {
    const elements = this.document.querySelectorAll("iframe");
    let iframeQW, contentWindow, frame, iframePage, selector;
    for (let iframe of elements) {
      try {
        iframeQW = new QWElement(iframe);
        contentWindow = iframeQW.getContentFrame();
        frame = contentWindow;
        selector = iframeQW.getElementSelector()
        iframePage = new QWPage(frame, frame.defaultView, true);
        this.extraDocuments[selector] = iframePage;
      }
      catch (e) {
        //console.log(e);
      }
    }
  }

  private addCSSRulesPropertyToElement(element: Element | null): void {
    if (element && this.elementsCSSRules ?.has(element)) {
      element.setAttribute('_cssRules', 'true');
    }
  }
  private addIframeAttribute(elements: QWElement[], selector: string): void {
    for (let element of elements) {
      element.setElementAttribute('_documentSelector', selector);
    }
  }

  public cacheValue(selector: string, method: string, value: string | undefined): void {
    this.cache.put(selector + "," + method, value);
  }
  public getCachedValue(selector: string, method: string): string | undefined {
    return this.cache.get(selector + "," + method);
  }
  public isValueCached(selector: string, method: string): boolean {
    return this.cache.exists(selector + "," + method);
  }

  public getURL(): string {
    return this.url;

  }
  private getElementFromDocument(selector: string): QWElement | null {
    const element = this.document.querySelector(selector);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElement(element, this.elementsCSSRules) : null;
  }

  private getElementsFromDocument(selector: string): Array<QWElement> {
    const elements = this.document.querySelectorAll(selector);
    const qwList: Array<QWElement> = [];

    for (const element of elements || []) {
      this.addCSSRulesPropertyToElement(element);
      qwList.push(new QWElement(element, this.elementsCSSRules));
    }

    return qwList;
  }

  public getElement(selector: string, specificDocument?: QWElement): QWElement | null {

    let element, iframeSelector;
    if (!!specificDocument) {
      iframeSelector = specificDocument.getElementAttribute("_documentSelector");
      if (!!iframeSelector && !!this.extraDocuments[iframeSelector]) {
        let iframePage = this.extraDocuments[iframeSelector];
        element = iframePage.getElement(selector, specificDocument);
      } else {
        element = this.getElementFromDocument(selector);
      }
    } else {
      element = this.getElementFromDocument(selector);
      if (!element) {
        //search iframes
        let iframeKeys = Object.keys(this.extraDocuments);
        let i = 0;
        let iframePage;
        while (!element && i < iframeKeys.length) {
          iframePage = this.extraDocuments[iframeKeys[i]];
          element = iframePage.getElement(selector);
          iframeSelector = iframeKeys[i];
          i++;
        }
      }
    }
    if (!!element)
      this.addIframeAttribute([element], iframeSelector);
    return element;
  }

  public getElements(selector: string, specificDocument?: QWElement): Array<QWElement> {
    let elements: QWElement[] = [];
    if (!!specificDocument) {
      let iframeSelector = specificDocument.getElementAttribute("_documentSelector");
      if (!!iframeSelector && !!this.extraDocuments[iframeSelector]) {
        let iframePage = this.extraDocuments[iframeSelector];
        elements.push(...iframePage.getElements(selector, specificDocument));
        this.addIframeAttribute(elements, iframeSelector);
      } else {
        elements.push(...this.getElementsFromDocument(selector));
      }
    } else {
      // console.log(this.getElementsFromDocument(selector));
      elements.push(...this.getElementsFromDocument(selector));
      //search iframes
      let iframeKeys = Object.keys(this.extraDocuments);
      let i = 0;
      let iframePage, iframeElements;
      while (i < iframeKeys.length) {
        iframePage = this.extraDocuments[iframeKeys[i]];
        iframeElements = iframePage.getElements(selector)
        this.addIframeAttribute(iframeElements, iframeKeys[i]);
        elements.push(...iframeElements);
        i++;
      }
    }
    return elements;
  }

  public getElementByID(id: string, elementQW: QWElement): QWElement | null {
    const element = this.document.querySelector(`#${id}`);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElement(element, this.elementsCSSRules) : null;
  }

  public getElementByAttributeName(name: string): QWElement | null {
    const element = this.document.querySelector(`[name="${name}"]`);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElement(element, this.elementsCSSRules) : null;
  }

  public getPageRootElement(): QWElement | null {
    if (this.document instanceof Document) {
      const documentElement = this.document.documentElement;
      this.addCSSRulesPropertyToElement(documentElement);
      return documentElement ? new QWElement(documentElement, this.elementsCSSRules) : null;
    } else {
      return null;
    }
  }

  public getHTMLContent(): string {
    if (this.document instanceof ShadowRoot) {
      return this.document.innerHTML;
    }
    else {
      return this.document.documentElement.outerHTML;
    }
  }

  public getFocusedElement(): QWElement | null {
    const activeElement = this.document.activeElement;
    this.addCSSRulesPropertyToElement(activeElement);
    return activeElement ? new QWElement(activeElement, this.elementsCSSRules) : null
  }

  public cleanAllElements(): void {
    const html = this.document.querySelector('html');
    if (!!html) {
      html.removeAttribute('_selector');
      html.removeAttribute('_cssrules');
      html.removeAttribute("_documentSelector")
      let children = html.children;
      if (!!children)
        this.cleanAllElementsAux([...children]);
    };
  }


  private cleanAllElementsAux(elements: Element[]): void {
    for (let element of elements) {
      element.removeAttribute('_selector');
      element.removeAttribute('_cssrules');
      element.removeAttribute("_documentSelector");
      let children = element.children;
      if (children && children.length > 0) {
        this.cleanAllElementsAux([...children]);
      }
    }
  }

}

/*
  public changeToDefaultViewport(): void {
    this.window.resizeTo(this.defaultWidth, this.defaultHeight);
  }
 
  public changeViewport(width: number, height: number): void {
    this.window.resizeTo(width, height);
  }*/

export { QWPage };
