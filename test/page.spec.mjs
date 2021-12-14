import puppeteer from 'puppeteer';
import { Dom } from '@qualweb/dom';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

describe('QualWeb page', function () {
  it('Testing qw-page injection on browser', async function () {
    this.timeout(0);

    const browser = await puppeteer.launch({ headless: false });
    const incognito = await browser.createIncognitoBrowserContext();
    const page = await incognito.newPage();

    const dom = new Dom(page);
    await dom.process({ execute: {} }, 'https://ciencias.ulisboa.pt', '');

    await page.addScriptTag({
      path: require.resolve('../dist/qw-page.bundle.js')
    });

    await page.evaluate(() => {
      window.console.log(window.qwPage);
    });

    /*await page.close();
    await incognito.close();
    await browser.close();*/
  });
});
