import QWNode from './qw-node';

class QWTextNode extends QWNode {
  constructor(node: Node) {
    super(node);
  }

  public getText(): string | null {
    return (<Text>this.node).textContent;
  }

  public getWholeText(): string {
    return (<Text>this.node).wholeText;
  }
}

export = QWTextNode;
