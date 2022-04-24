/*
  Rope notes:
  - binary tree
  - leaves: string and length/weight
  - non-leaf nodes: sum of lengths of leaves in left subtree
  at a non-leaf node, weight is the length of the first part of the string, contained in the leaves of the left subtree
  strings in leaves are assumed immutable
  - insertion
    - at 0: make new left-most leaf node
    - at end: make new right-most leaf node
    - in middle, not splitting existing nodes make new node and search for location
    - in middle, splitting existing nodes: break existing node up into left and right part, add new node in between
  - deletion:
    - remove entire node
    - remove characters from existing node
  - weight updates need to be propagated up tree
*/

type MapBranch = {
  left?: MapRepresentation,
  right?: MapRepresentation,
  size: number,
  kind: 'branch'
}
type MapLeaf = {
  text: string,
  kind: 'leaf'
}
type MapRepresentation = MapBranch | MapLeaf

interface IRope {
  toString: () => string,
  size: () => number,
  height: () => number,
  toMap: () => MapRepresentation,
  isBalanced: () => Boolean
}

export class RopeLeaf implements IRope {
  text: string;

  // Note: depending on your implementation, you may want to to change this constructor
  constructor(text: string) {
    this.text = text;
  }

  // just prints the stored text
  toString(): string {
    return this.text
  }

  size() {
    return this.text.length;
  }

  height() {
    return 1;
  }

  toMap(): MapLeaf {
    return {
      text: this.text,
      kind: 'leaf'
    }
  }

  isBalanced() {
    return true;
  }
}

export class RopeBranch implements IRope {
  left: IRope;
  right: IRope;
  cachedSize: number;

  constructor(left: IRope, right: IRope) {
    this.left = left;
    this.right = right;
    // Please note that this is defined differently from "weight" in the Wikipedia article.
    // You may wish to rewrite this property or create a different one.
    this.cachedSize = (left ? left.size() : 0) +
      (right ? right.size() : 0)
  }

  // how deep the tree is (I.e. the maximum depth of children)
  height(): number {
    return 1 + Math.max(this.leftHeight(), this.rightHeight())
  }
  
  // Please note that this is defined differently from "weight" in the Wikipedia article.
  // You may wish to rewrite this method or create a different one.
  size() {
    return this.cachedSize;
  }

  /*
    Whether the rope is balanced, i.e. whether any subtrees have branches
    which differ by more than one in height. 
  */
  isBalanced(): boolean {
    const leftBalanced = this.left ? this.left.isBalanced() : true
    const rightBalanced = this.right ? this.right.isBalanced() : true

    return leftBalanced && rightBalanced
      && Math.abs(this.leftHeight() - this.rightHeight()) < 2
  }

  leftHeight(): number {
    if (!this.left) return 0
    return this.left.height()
  }

  rightHeight(): number {
    if (!this.right) return 0
    return this.right.height()
  }

  // Helper method which converts the rope into an associative array
  // 
  // Only used for debugging, this has no functional purpose
  toMap(): MapBranch {
    const mapVersion: MapBranch = {
      size: this.size(),
      kind: 'branch'
    }
    if (this.right) mapVersion.right = this.right.toMap()
    if (this.left) mapVersion.left = this.left.toMap()
    return mapVersion
  }

  toString(): string {
    return (this.left ? this.left.toString() : '')
      + (this.right ? this.right.toString() : '')
  }
}


export function createRopeFromMap(map: MapRepresentation): IRope {
  if (map.kind == 'leaf') {
    return new RopeLeaf(map.text)
  }

  let left, right = null;
  if (map.left) left = createRopeFromMap(map.left)
  if (map.right) right = createRopeFromMap(map.right)
  return new RopeBranch(left, right);
}

// This is an internal API. You can implement it however you want. 
// (E.g. you can choose to mutate the input rope or not)
function splitAt(rope: IRope, position: number): { left: IRope, right: IRope } {
  if (rope instanceof RopeBranch) {
    return { left: rope.left, right: rope.right};
  }

  // TODO handle this more cleanly
  if (!(rope instanceof RopeLeaf)) {
    throw new Error("unexpected implementor of IRope");
  }

  // TODO: what if position is beginningend of string?
  return {
    left: new RopeLeaf(rope.text.substring(0, position)), // TODO: check for off by one errors
    right: new RopeLeaf(rope.text.substring(position))
  }
}

export function deleteRange(rope: IRope, start: number, end: number): IRope {
  if (rope instanceof RopeLeaf) {
    return deleteAtLeaf(rope, start, end);
  }

  // TODO handle this more cleanly
  if (!(rope instanceof RopeBranch)) {
    throw new Error("unexpected implementor of IRope");
  }

  if (start > rope.left.size()) {
    // TODO - check for off by one errors
    const newRight = deleteRange(rope.right, start - rope.left.size(), end - rope.left.size());
    if (newRight === undefined) {
      // right branch was completely eliminated
      return rope.left;
    }
    return new RopeBranch(rope.left, newRight);
  }

  if (end < rope.left.size()) {
    const newLeft = deleteRange(rope.left, start, end);
    if (newLeft === undefined) {
      // left branch was completely eliminated
      return rope.right;
    }
    return new RopeBranch(newLeft, rope.right);
  }

  return new RopeBranch(deleteRange(rope.left, start, end), deleteRange(rope.right, start - rope.left.size(), end - rope.right.size()));
}

export function insert(rope: IRope, text: string, location: number): IRope {
  if (rope instanceof RopeLeaf) {
    return insertAtLeaf(rope, text, location);
  }

  // TODO handle this more cleanly
  if (!(rope instanceof RopeBranch)) {
    throw new Error("unexpected implementor of IRope");
  }

  if (location < rope.left.size()) {
      return new RopeBranch(insert(rope.left, text, location), rope.right);// todo check for shallow copying
  }
  
  return new RopeBranch(rope.left, insert(rope.right, text, location - rope.left.size()));
}

/**
 * @param ropeLeaf the leaf around which to insert the new text
 * @param text the text to be inserted
 * @param location the location to insert the new text at, relative to the ropeLeaf
 *    i.e. 0 <= location <= ropeLeaf.size()
 * @returns a new RopeBranch with the old and new leaf
 */
function insertAtLeaf(ropeLeaf: RopeLeaf, text: string, location: number): RopeBranch {
  if (location === 0) {
    return new RopeBranch(
      new RopeLeaf(text),
      ropeLeaf
    )
  }
  
  if (location === ropeLeaf.size()) {
    return new RopeBranch(ropeLeaf, new RopeLeaf(text));
  }

  const splitRope = splitAt(ropeLeaf, location);
  return new RopeBranch(splitRope.left, new RopeBranch(new RopeLeaf(text), splitRope.right));
}

function deleteAtLeaf(ropeLeaf: RopeLeaf, start: number, end: number): IRope | undefined {
  // remove the entire node
  if (start === 0 && end === ropeLeaf.size()) {
    console.log("total removal");
    return new RopeLeaf(""); // TODO: clean these empty nodes up
  }

  // remove the beginning of the string
  if (start === 0) {
      return new RopeLeaf(ropeLeaf.text.substring(end))
  }

  // remove the end of the string
  if (end === ropeLeaf.size()) {
    return new RopeLeaf(ropeLeaf.text.substring(0, start))
  }

  // remove from the middle of the string, splitting it into two nodes
  // TODO: or should this be one new leaf node just with the middle removed? think about with rebalancing
  // this could use split at, but would require two separate calls - this seems simpler
  console.log("split removal");
  return new RopeBranch(
    new RopeLeaf(ropeLeaf.text.substring(0, start)),
    new RopeLeaf(ropeLeaf.text.substring(end))
  );
}

export function rebalance(rope: IRope): IRope {
  // TODO
}