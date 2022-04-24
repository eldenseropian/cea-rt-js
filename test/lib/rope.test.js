import {
  insert, deleteRange,
  createRopeFromMap, rebalance, RopeBranch, RopeLeaf
} from '../../lib/rope'

const createLeaf = (text) => createRopeFromMap({
  text,
  kind: 'leaf'
})

/* 
  These tests are here as a starting point, they are not comprehensive
*/
describe("rope basics", () => {
  test("leaf constructor", () => expect(createLeaf('test').toString()).toEqual('test'));
  test("leaf size", () => expect(createLeaf('test').size()).toEqual(4));
  
  const branch = createRopeFromMap({
    kind: 'branch',
    left: {
      left: {
        kind: 'leaf',
        text: 't'
      },
      right: {
        kind: 'leaf',
        text: 'e'
      },
      kind: 'branch'
    },
    right: {
      kind: 'branch',
      right: {
        kind: 'leaf',
        text: 'st'
      }
    }
  })
  test("branch constructor", () => expect(branch.toString()).toEqual('test'));
  test("branch size", () => expect(branch.size()).toEqual(4));
});

describe("insertion", () => {
  describe("inserting into leaf", () => {
    test("simple insertion", () => expect(insert(createLeaf('test'), '123', 2).toString()).toEqual('te123st'));
    test("ending insertion", () => expect(insert(createLeaf('test'), '123', 4).toString()).toEqual('test123'));
    test("beginning insertion", () => expect(insert(createLeaf('test'), '123', 0).toString()).toEqual('123test'));
    test("example from instructions", () => expect(insert(new RopeLeaf("ABC"), "DEF", 1).toString()).toEqual("ADEFBC"));
  })
  
  describe("inserting into branch", () => {
    const rope = insert(new RopeLeaf("ABC"), "DEF", 1);
    test("split node", () => expect(insert(rope, '*', 2).toString()).toEqual('AD*EFBC'));
    test("before node", () => expect(insert(rope, '*', 0).toString()).toEqual('*ADEFBC'));
    test("after node", () => expect(insert(rope, '*', 7).toString()).toEqual('ADEFBC*'));
  })
});

describe("deletion", () => {
  describe("deleting from leaf", () => {
    test("simple deletion", () => expect(deleteRange(createLeaf('test'), 1, 3).toString()).toEqual('tt'));
    test("delete until end", () => expect(deleteRange(createLeaf('test'), 2, 4).toString()).toEqual('te'));
    test("delete beginning", () => expect(deleteRange(createLeaf('test'), 0, 2).toString()).toEqual('st'));
    test("delete then insert", () => expect(insert(deleteRange(createLeaf('test'), 1, 3), 'abc', 2).toString()).toEqual('ttabc'));
    test("example from instructions", () => expect(deleteRange(new RopeLeaf("ADEFBC"), 3, 4).toString()).toEqual("ADEBC"));
  });

  describe("deleting from branch", () => {
    test("delete first node", () => { 
      const rope = new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEF"));
      return expect(deleteRange(rope, 0, 3).toString()).toEqual("DEF");
    });

    test("delete last node", () => {
      const rope = new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEF"));
      return expect(deleteRange(rope, 3, 7).toString()).toEqual("ABC");
    })

    test("delete partially from both nodes", () => {
      const rope = new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEF"));
      return expect(deleteRange(rope, 2, 4).toString()).toEqual("ABEF");
    })

    // TODO: tests depend heavily on implementation
    test("deletions affect multiple nodes", () => {
      const rope = new RopeBranch(
        new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEFG")),
        new RopeBranch(new RopeLeaf("H"), new RopeLeaf("IJKLMNO"))
      );
      return expect(deleteRange(rope, 2, 11).toString()).toEqual("ABLMNO");
    })
  });
});

// describe('Extra Credit: tree is rebalanced', () => {
//   expect(rebalance(createRopeFromMap({
//     kind: 'branch',
//     left: { kind: 'leaf', text: 'a' },
//     right: {
//       kind: 'branch',
//       left: { kind: 'leaf', text: 'b' },
//       right: {
//         kind: 'branch',
//         left: { kind: 'leaf', text: 'c' },
//         right: { kind: 'leaf', text: 'd' }
//       }
//     },
//   }))).toEqual(createRopeFromMap({
//     kind: 'branch',
//     left: {
//       kind: 'branch',
//       left: { kind:'leaf',text: 'a' },
//       right: { kind:'leaf',text: 'b' }
//     },
//     right: {
//       kind: 'branch',
//       left: { kind:'leaf',text: 'c' },
//       right: { kind:'leaf',text: 'd' }
//     },
//   }))
// })
