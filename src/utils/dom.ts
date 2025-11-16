 
export const removeAllComments = (root: Node) => {
  const ownerDocument = root.ownerDocument;
  if (!ownerDocument) {
    return;
  }
  const iterator = ownerDocument.createNodeIterator(
    root,
    NodeFilter.SHOW_COMMENT,
    null,
  );

  const comments: Comment[] = [];
  let node;

  while ((node = iterator.nextNode())) {
    comments.push(node);
  }

  comments.forEach(c => c.remove());
}