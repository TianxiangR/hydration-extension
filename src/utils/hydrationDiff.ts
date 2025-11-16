export type HydrationError = {
  initialRoot: string;
  hydratedRoot: string;
  isEqual: false;
}

export type HydrationSuccess = {
  isEqual: true;
}

export type HydrationResult = HydrationSuccess | HydrationError;

export const compareRoot = (initialRoot: Element, hydratedRoot: Element): HydrationResult => {
  if (initialRoot.children.length !== hydratedRoot.children.length) {
    console.log('initialRoot.children.length !== hydratedRoot.children.length', initialRoot, hydratedRoot);
    return {
      initialRoot: initialRoot.outerHTML,
      hydratedRoot: hydratedRoot.outerHTML,
      isEqual: false,
    };
  }

  // compare children
  for (let i = 0; i < initialRoot.children.length; i++) {
    const initialChild = initialRoot.children[i];
    const hydratedChild = hydratedRoot.children[i];
    const propsToCheck = ['tagName', 'id'] as const;

    for (const prop of propsToCheck) {
      if (initialChild[prop] !== hydratedChild[prop]) {
        console.log('initialChild[prop] !== hydratedChild[prop]', initialChild.outerHTML, hydratedChild.outerHTML);
        return {
          initialRoot: initialChild.outerHTML,
          hydratedRoot: hydratedChild.outerHTML,
          isEqual: false,
        };
      }
    }

    const compareChildResult = compareRoot(initialChild, hydratedChild);
    if (!compareChildResult.isEqual) {
      return compareChildResult;
    }
  }

  if (initialRoot.textContent !== hydratedRoot.textContent) {
    // console.log('initialRoot.textContent !== hydratedRoot.textContent', initialRoot.outerHTML, hydratedRoot.outerHTML);
    return {
      initialRoot: initialRoot.outerHTML,
      hydratedRoot: hydratedRoot.outerHTML,
      isEqual: false,
    };
  }

  return {
    isEqual: true,
  };
}


export const hydrationDiff = (initialHtml: string, hydratedHtml: string) => {
  const initialDoc = new DOMParser().parseFromString(initialHtml, 'text/html');
  const hydratedDoc = new DOMParser().parseFromString(hydratedHtml, 'text/html');
  
  const initialRoot = initialDoc.querySelector('#__next');
  const hydratedRoot = hydratedDoc.querySelector('#__next');

  if (!initialRoot || !hydratedRoot) {
    return null;
  }

  return compareRoot(initialRoot, hydratedRoot);
};