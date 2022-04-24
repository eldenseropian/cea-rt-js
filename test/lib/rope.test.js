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

  // NOTE: tests added are influenced heavily by implementation
  // For the sake of time, tests were intentionally written in a way that was aware of how the
  // string was split up into leaf nodes. This made it easier to test edge cases around affecting
  // entire or partial nodes, but makes these tests less effective if the implementation were to change.
  // In the long term, care would be taken to provide a sufficiently wide range of tests that
  // provide enough coverage regardless of implementation.
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
      expect(deleteRange(rope, 0, 3).toString()).toEqual("DEF");
    });

    test("delete last node", () => {
      const rope = new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEF"));
      expect(deleteRange(rope, 3, 7).toString()).toEqual("ABC");
    })

    test("delete partially from multiple nodes", () => {
      const rope = new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEF"));
      expect(deleteRange(rope, 2, 4).toString()).toEqual("ABEF");
    })

    test("delete partial and full nodes", () => {
      const rope = new RopeBranch(
        new RopeBranch(new RopeLeaf("ABC"), new RopeLeaf("DEFG")),
        new RopeBranch(new RopeLeaf("H"), new RopeLeaf("IJKLMNO"))
      );
      expect(deleteRange(rope, 2, 11).toString()).toEqual("ABLMNO");
    })
  });
});

// This tests that the original rope is not mutated by insertions or deletions.
// It would be more memory-efficient to mutate the data structure in place rather than
// treating it as immutable, but it was easier to implement in a time-limited setting
// and simpler as immutable, since there's no need to account for the possibility of
// weights changing while in the middle of performing an insertion or deletion.
test("immutability", () => {
  const rope = new RopeLeaf("");
  const ropeWithContent = insert(rope, "ABC", 0);
  expect(ropeWithContent.toString()).toEqual("ABC");
  expect(rope.toString()).toEqual("");

  const truncatedRopeWithContent = deleteRange(ropeWithContent, 0, 1);
  expect(truncatedRopeWithContent.toString()).toEqual("BC");
  expect(ropeWithContent.toString()).toEqual("ABC");
  expect(rope.toString()).toEqual("");
})


// tests that combine operations on a single instance to check for bad interactions 
test("multiple operations", () => {
  let rope = new RopeLeaf("ABC");
  rope = insert(rope, "DEF", 1);
  expect(rope.toString()).toEqual("ADEFBC");
  rope = insert(rope, "****", 0);
  expect(rope.toString()).toEqual("****ADEFBC");
  rope = deleteRange(rope, 3, 5);
  expect(rope.toString()).toEqual("***DEFBC");
  rope = deleteRange(rope, 3, 5);
  expect(rope.toString()).toEqual("***FBC");
  rope = insert(rope, "012", 6);
  expect(rope.toString()).toEqual("***FBC012");

})

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
