abstract class QWNode {
  protected readonly node: Node;

  constructor(node: Node) {
    this.node = node;
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
}

export = QWNode;
