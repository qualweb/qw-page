import puppeteer from 'puppeteer';
import { Dom } from '@qualweb/dom';

describe('QualWeb page', function() {
  it('Testing qw-page injection on browser', async function() {
    this.timeout(0);

    const browser = await puppeteer.launch();

    const dom = new Dom();
    const { page } = await dom.getDOM(
      browser,
      { execute: {} },
      'https://ciencias.ulisboa.pt',
      ''
    );

    await page.addScriptTag({
      path: require.resolve('../dist/qw-page.bundle.js')
    });

    await page.evaluate(() => {
      window.qwPage = new Module.QWPage(document, window, true);
    });

    await dom.close();
    await browser.close();
  });
});