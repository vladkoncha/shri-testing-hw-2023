const { assert } = require("chai");

let bugId = "";
if (process.env.BUG_ID !== undefined) {
  bugId = process.env.BUG_ID;
}

function getUrl(route, productId = "") {
  return `/hw/store${route}/${productId}` + (bugId && `?bug_id=${bugId}`);
}

describe("Тестирование каталога.", () => {
  async function clickAddToCartButton(browser, productId) {
    await browser.url(getUrl("/catalog", productId));
    const productContainer = await browser.$(".Product");

    const addToCartButton = await productContainer.$(
      ".ProductDetails-AddToCart"
    );
    await addToCartButton.click();
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  async function getProductCount(browser, productId) {
    await browser.url(getUrl("/cart"));
    const productRow = await browser.$(`tr[data-testid="${productId}"]`);

    assert.equal(
      await productRow.isDisplayed(),
      true,
      `Должна существовать строка с продуктом ${productId}.`
    );

    return (await productRow.$(".Cart-Count")).getText();
  }

  async function getCartTable(browser) {
    await browser.refresh();
    await browser.url(getUrl("/cart"));
    return await browser.$(".Cart-Table");
  }

  function testAddingProductToCart(productId) {
    it(`Если товар ${productId} уже добавлен в корзину, повторное нажатие кнопки "добавить в корзину" должно увеличивать его количество`, async ({
      browser,
    }) => {
      await browser.setWindowSize(1024, 1000);
      browser.execute(() =>
        window.localStorage.removeItem("example-store-cart")
      );

      for (let i = 1; i <= 3; i++) {
        await clickAddToCartButton(browser, productId);
        assert.equal(
          await getProductCount(browser, productId),
          i,
          `Продукт с id=${productId} должен быть в корзине`
        );
      }
    });
  }

  function testCartPageReload() {
    it(`Содержимое корзины должно сохраняться между перезагрузками страницы`, async ({
      browser,
    }) => {
      await browser.setWindowSize(1024, 1000);
      browser.execute(() =>
        window.localStorage.removeItem("example-store-cart")
      );

      const tables = [];

      tables.push(await getCartTable(browser));

      for (let i = 1; i < 5; i++) {
        tables.push(await getCartTable(browser));

        assert.equal(
          tables[i - 1].outerHTML,
          tables[i].outerHTML,
          `Содержимое корзины должно сохраняться между перезагрузками страницы`
        );
      }
    });
  }

  const idsToTest = [0];
  for (const id of idsToTest) {
    testAddingProductToCart(id.toString());
  }

  testCartPageReload();
});
