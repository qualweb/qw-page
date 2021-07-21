import QWNode from './qw-node';

class QWCommentNode extends QWNode {
  constructor(node: Node) {
    super(node);
  }

  public getData(): string | null {
    return (<Comment>this.node).textContent;
  }
}

export = QWCommentNode;
