
async function main() {

  window.addEventListener('run-script', (e: Event) => {
    if (!(e instanceof CustomEvent) || typeof e.detail.script !== 'string') {
      return;
    }
    const fn = new Function(e.detail.script);
    fn();
  })
}

main();
export {};