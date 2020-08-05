import { QWElement } from '@qualweb/qw-element';
import Cache from './cache.object';
import CSSMapper from './css.mapper';
import { IframePage } from './iframepage.object';

class QWPage {

  private cache: Cache;
  private readonly document: Document;
  private readonly window: Window;
  private iframePages: Map<string, IframePage>;
  private defaultWidth: number;
  private defaultHeight: number;

  private elementsCSSRules?: Map<Element, any>;

  constructor(document: Document, window: Window, addCSSRulesToElements?: boolean) {
    this.document = document;
    this.window = window;
    this.cache = new Cache();

    this.defaultWidth = this.window.innerWidth;
    this.defaultHeight = this.window.innerHeight;
    this.iframePages = new Map<string, IframePage>();


    if (!!addCSSRulesToElements) {
      this.elementsCSSRules = new CSSMapper(this.document).map();
    }
    this.processIframes();
    console.log(this.getElements("h1"));


  }
  private processIframes(): void {
    const elements = this.document.querySelectorAll("iframe");
    let iframeQW, contentWindow, frame, iframePage, selector;
    for (let iframe of elements) {
      iframeQW = new QWElement(iframe);
      contentWindow = iframeQW.getContentFrame();
      frame = contentWindow;
      selector = iframeQW.getElementSelector()
      iframePage = new IframePage(frame, frame.defaultView, true);
      this.iframePages[selector] = iframePage;
    }
  }

  private addCSSRulesPropertyToElement(element: Element | null): void {
    if (element && this.elementsCSSRules ?.has(element)) {
      element.setAttribute('_cssRules', 'true');
    }
  }
  private addIframeAttribute(elements: QWElement[], selector: string): void {
    for (let element of elements) {
      element.setElementAttribute('_iframeSelector', selector);
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
    return this.document.URL;
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
    if (specificDocument) {
      iframeSelector = specificDocument.getElementAttribute("iframeSelector");
      if (iframeSelector) {
        let iframePage = this.iframePages[iframeSelector];
        element = iframePage.getElement(selector, specificDocument);
      } else {
        element = this.getElementFromDocument(selector);
      }
    } else {
      element = this.getElementFromDocument(selector);
      if (!element) {
        //search iframes
        let iframeKeys = Object.keys(this.iframePages);
        let i = 0;
        let iframePage;
        while (!element && i < iframeKeys.length) {
          iframePage = this.iframePages[iframeKeys[i]];
          element = iframePage.getElement(selector);
          iframeSelector = iframeKeys[i];
          i++;
        }
      }
    }
    this.addIframeAttribute([element], iframeSelector);
    return element;
  }

  public getElements(selector: string, specificDocument?: QWElement): Array<QWElement> {
    let elements: QWElement[] = [];
    if (specificDocument) {
      let iframeSelector = specificDocument.getElementAttribute("iframeSelector");
      if (iframeSelector) {
        let iframePage = this.iframePages[iframeSelector];
        elements.push(iframePage.getElements(selector, specificDocument));
        this.addIframeAttribute(elements, iframeSelector);
      } else {
        elements.push(...this.getElementsFromDocument(selector));
      }
    } else {
      elements.push(...this.getElementsFromDocument(selector));
      //search iframes
      let iframeKeys = Object.keys(this.iframePages);
      let i = 0;
      let iframePage;
      while (i < iframeKeys.length) {
        iframePage = this.iframePages[iframeKeys[i]];
        elements.push(iframePage.getElements(selector));
        this.addIframeAttribute(elements, iframeKeys[i]);
        i++;
      }
    }
    return elements;
  }

  public getElementByID(id: string, elementQW: QWElement): QWElement | null {
    const treeSelector = elementQW.getTreeSelector();
    const element = this.document.querySelector(`#${id}` + treeSelector);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElement(element, this.elementsCSSRules) : null;
  }

  public getElementByAttributeName(name: string): QWElement | null {
    const element = this.document.querySelector(`[name="${name}"]`);
    this.addCSSRulesPropertyToElement(element);
    return element ? new QWElement(element, this.elementsCSSRules) : null;
  }

  public processShadowDom(): void {
    const listElements = this.document.querySelectorAll('*');
    let shadowCounter = 0;

    for (const element of listElements || []) {
      if (element.shadowRoot !== null) {
        element.innerHTML = element.shadowRoot.innerHTML;
        const elementsFromShadowDom = element.querySelectorAll('*');
        this.setShadowAttribute(elementsFromShadowDom, shadowCounter);
        shadowCounter++;
      }
    }
  }

  private setShadowAttribute(elements: NodeListOf<Element>, counter: number): void {
    for (const element of elements || []) {
      element.setAttribute('shadowTree', counter + '');
    }
  }

  public getPageRootElement(): QWElement | null {
    const documentElement = this.document.documentElement;
    this.addCSSRulesPropertyToElement(documentElement);
    return documentElement ? new QWElement(documentElement, this.elementsCSSRules) : null;
  }

  public getHTMLContent(): string {
    return this.document.documentElement.outerHTML;
  }

  public getFocusedElement(): QWElement | null {
    const activeElement = this.document.activeElement;
    this.addCSSRulesPropertyToElement(activeElement);
    return activeElement ? new QWElement(activeElement, this.elementsCSSRules) : null
  }

  public changeToDefaultViewport(): void {
    this.window.resizeTo(this.defaultWidth, this.defaultHeight);
  }

  public changeViewport(width: number, height: number): void {
    this.window.resizeTo(width, height);
  }
}
export { QWPage };
