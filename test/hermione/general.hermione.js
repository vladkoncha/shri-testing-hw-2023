const { assert } = require("chai");

let bugId = "";
if (process.env.BUG_ID !== undefined) {
  bugId = process.env.BUG_ID;
}

function getUrl() {
  return "/hw/store" + (bugId && `?bug_id=${bugId}`);
}

describe("Тестирование общих требований: адаптивная верстка", () => {
  function testAdaptiveWidth(width) {
    it(`Вёрстка должна адаптироваться под ширину экрана ${width}px`, async ({
      browser,
    }) => {
      await browser.setWindowSize(width, 1000);
      await browser.url(getUrl());
      await browser.$(".Application");
      await browser.assertView(`plain-w${width}px`, ".Application", {
        ignoreElements: [".Application-Menu"],
      });
    });
  }

  const widthToTest = [575, 768, 1024, 1200];
  widthToTest.forEach((width) => testAdaptiveWidth(width));
});

describe('Тестирование общих требований: "Гамбургер"', () => {
  it('На ширине меньше 576px навигационное меню должно скрываться за "Гамбургер"', async ({
    browser,
  }) => {
    await browser.setWindowSize(575, 1000);
    await browser.url(getUrl());

    const menu = await browser.$(".Application-Menu");
    const toggler = await browser.$(".Application-Toggler");

    assert.equal(
      await menu.isDisplayed(),
      false,
      "Меню должно скрыться за гамбургер"
    );
    assert.equal(
      await toggler.isDisplayed(),
      true,
      '"Гамбургер" должен быть отображен'
    );
  });

  it('При выборе элемента из меню "Гамбургера", меню должно закрываться', async ({
    browser,
  }) => {
    await browser.setWindowSize(575, 1000);
    await browser.url(getUrl());

    const menu = await browser.$(".Application-Menu");
    const toggler = await browser.$(".Application-Toggler");

    assert.equal(
      await menu.isDisplayed(),
      false,
      'Меню должно скрыться за "Гамбургер"'
    );

    await toggler.click();

    assert.equal(
      await menu.isDisplayed(),
      true,
      'Меню должно появиться по клику на "Гамбургер"'
    );

    const menuItems = await browser.$$(".nav-link");
    await menuItems[0].click();

    assert.equal(
      await menu.isDisplayed(),
      false,
      "Меню должно закрыться по клику на элемент"
    );
  });
});
