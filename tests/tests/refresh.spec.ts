import { test, expect } from '@playwright/test';

function withResolvers() {
  if (Promise.withResolvers) {
    return Promise.withResolvers();
  }
  let resolve = null;
  let reject = null;
  const promise = new Promise((_resolve, _reject) => {
    reject = _reject;
    resolve = _resolve;
  });
  return { resolve, reject, promise };
}

for (let widget of ['zeit', 'wetter', 'termine', 'aussicht', 'sensor']) {
  test(widget, async ({ page, context }) => {
    let step = Promise.resolve();
    context.route('https://wttr.in/**', (route, request) => {
      step.then(() => route.fulfill({body: request.url().match(/time=(\d+|null)$/)[1] }))
    });
    context.route('https://cam.spacesquad.de/images/live.jpg*', route => {
      step.then(() => route.fulfill({body: ""}))
    });
    context.route('https://api.opensensemap.org/boxes/*/sensors', route => {
      step.then(() => route.fulfill({body: '{"sensors": []}'}))
    });

    await page.goto('/');
    let elem = page.locator(`#${widget}`);
    const text = await elem.textContent();
    let { promise, resolve } = withResolvers();
    step = promise; // Pause routes
    await expect(elem).toContainText(/Neu laden \(Stand: \d{1,2}:\d\d:\d\d/);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Make sure a second passes
    await elem.getByText('Neu laden').click();
    if (!["zeit", "termine"].includes(widget)) {
      await expect(elem).toContainText(text, {timeout: 1});
    }
    resolve(); // Continue routes
    await expect(elem).not.toContainText(text);
    await expect(elem).toContainText(/Neu laden \(Stand: \d{1,2}:\d\d:\d\d/);
    step = Promise.resolve();
  });
}
