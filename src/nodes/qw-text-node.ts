import QWNode from './qw-node';
import { CSSProperties } from '@qualweb/qw-element';

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

export = QWTextNode;
