class SelectorCalculator {
  private readonly document: Document | ShadowRoot;

  constructor(document: Document | ShadowRoot) {
    this.document = document;
  }

  public processElementSelector(): void {
    if (this.document instanceof Document) {
      const html = this.document.querySelector('html');
      if (html) {
        html.setAttribute('_selector', 'html');
        const children = html.children;
        if (children.length > 0) {
          this.processElementSelectorAux([...children]);
        }
      }
    } else {
      const elements = this.document.querySelectorAll('*');
      let i = 1;
      for (const element of elements ?? []) {
        element.setAttribute('_selector', `${element.tagName.toLowerCase()}:nth-child(${i})`);
        const children = element.children;
        if (children.length > 0) {
          this.processElementSelectorAux([...children]);
        }
        i++;
      }
    }
  }

  private processElementSelectorAux(elements: Array<Element>): void {
    const parent = elements[0].parentElement;
    if (parent) {
      const selector = parent.getAttribute('_selector');
      if (selector) {
        this.addSelectorAttribute(elements, selector);
        for (const element of elements ?? []) {
          const children = element.children;
          if (children && children.length > 0) {
            this.processElementSelectorAux([...children]);
          }
        }
      }
    }
  }

  private addSelectorAttribute(elements: Array<Element>, selector: string): void {
    let index = 1;
    for (const element of elements) {
      const name = element.tagName.toLowerCase();
      element.setAttribute('_selector', `${selector} > ${name}:nth-child('${index}')`);
      index++;
    }
  }
}

export = SelectorCalculator;
