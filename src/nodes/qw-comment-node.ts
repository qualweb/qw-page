import QWNode from './qw-node';
import { CSSProperties } from '@qualweb/qw-element';

class QWCommentNode extends QWNode {
  constructor(node: Node, elementsCSSRules?: Map<Node, CSSProperties>) {
    super(node, elementsCSSRules);
  }

  public getData(): string | null {
    return (<Comment>this.node).textContent;
  }
}

export = QWCommentNode;
