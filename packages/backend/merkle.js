const ethers = require("ethers");
const Web3 = require("web3");
const infuraUrl = "c0be9137b39e429180c1c558673d6173";
const whiteList = require("./whiteList");
let merkleTree = {};
function getRootHash() {
  const leaves = genLeaveHashes(whiteList);
  merkleTree.leaves = leaves;
  merkleTree.root = buildMerkleTree(leaves);
  console.log("rootHash", merkleTree.root.hash);
  return merkleTree.root.hash;
}
function genLeaveHashes(chunks) {
  const leaves = [];
  chunks.forEach((data) => {
    const hash = buildHash(data);
    const node = {
      hash,
      parent: null,
    };
    leaves.push(node);
  });
  return leaves;
}
function buildMerkleTree(leaves) {
  const numLeaves = leaves.length;
  if (numLeaves === 1) {
    return leaves[0];
  }
  const parents = [];
  let i = 0;
  while (i < numLeaves) {
    const leftChild = leaves[i];
    const rightChild = i + 1 < numLeaves ? leaves[i + 1] : leftChild;
    parents.push(createParent(leftChild, rightChild));
    i += 2;
  }
  return buildMerkleTree(parents);
}
function createParent(leftChild, rightChild) {
  const hash =
    leftChild.hash < rightChild.hash
      ? buildHash(leftChild.hash, rightChild.hash)
      : buildHash(rightChild.hash, leftChild.hash);
  const parent = {
    hash,
    parent: null,
    leftChild,
    rightChild,
  };
  leftChild.parent = parent;
  rightChild.parent = parent;
  return parent;
}
function buildHash(...data) {
  console.log("data ", ...data);
  let values = [...data];

  let types = [];
  for (let i = 0; i < values.length; i++) {
    types.push("address");
  }
  const hashEther = ethers.utils.solidityKeccak256(types, values);
  //   const hashWeb3 = Web3.utils.soliditySha3(...data);
  //   console.log("hash ether ", hashEther);
  //   console.log("hash web3 ", hashWeb3);
  return hashEther;
}
function getMerklePath(data) {
  const hash = buildHash(data);
  for (let i = 0; i < merkleTree.leaves.length; i++) {
    const leaf = merkleTree.leaves[i];
    if (leaf.hash === hash) {
      return generateMerklePath(leaf);
    }
  }
}
function generateMerklePath(node, path = []) {
  if (node.hash === merkleTree.root.hash) {
    return path;
  }
  const isLeft = node.parent.leftChild === node;
  if (isLeft) {
    path.push(node.parent.rightChild.hash);
  } else {
    path.push(node.parent.leftChild.hash);
  }
  return generateMerklePath(node.parent, path);
}
function verifyPath(data, path) {
  let hash = buildHash(data);
  for (let i = 0; i < path.length; i += 1) {
    hash = hash < path[i] ? buildHash(hash, path[i]) : buildHash(path[i], hash);
  }
  return hash === merkleTree.root.hash;
}
function test() {
  const rootHash = getRootHash();
  const address = "0x0737BEf0f49abCf4A62d480A4fFcE1681f90daEE";
  const path = getMerklePath(address);
  console.log("path", path);
  const verify = verifyPath(address, path);
  console.log("verify", verify);
}
test();
