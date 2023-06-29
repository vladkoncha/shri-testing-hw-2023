const { assert } = require("chai");

let bugId = "";
if (process.env.BUG_ID !== undefined) {
  bugId = process.env.BUG_ID;
}

function getUrl(route, productId = "") {
  return `/hw/store${route}/${productId}` + (bugId && `?bug_id=${bugId}`);
}

describe("Тестирование корзины", () => {
  async function clickAddToCartButton(browser, product) {
    await browser.url(getUrl("/catalog", product.id));
    const productContainer = await browser.$(".Product");

    const addToCartButton = await productContainer.$(
      ".ProductDetails-AddToCart"
    );
    await addToCartButton.click();
    product.count += 1;
  }

  async function clickClearShoppingCartButton(browser) {
    await browser.url(getUrl("/cart"));
    const cartContainer = await browser.$(".Cart");

    const cartClearButton = await cartContainer.$(".Cart-Clear");
    await cartClearButton.click();
  }

  async function getProductInfo(browser, productId) {
    await browser.url(getUrl("/catalog", productId));
    const productContainer = await browser.$(".Product");

    const name = await productContainer.$(".ProductDetails-Name").getText();
    const price = await productContainer.$(".ProductDetails-Price").getText();

    return {
      id: productId,
      name,
      price,
      count: 0,
    };
  }

  async function assertProductsInTable(browser, products) {
    await browser.url(getUrl("/cart"));
    const table = await browser.$(".Cart-Table");

    let totalPrice = 0;

    for (const product of products) {
      const productRow = await table.$(`tr[data-testid="${product.id}"]`);

      assert.equal(
        await productRow.$(".Cart-Name").getText(),
        `${product.name}`,
        `В таблице заказа должно отображаться имя добавленного товара`
      );

      assert.equal(
        await productRow.$(".Cart-Price").getText(),
        `${product.price}`,
        `В таблице заказа должна отображаться цена добавленного товара`
      );

      assert.equal(
        await productRow.$(".Cart-Count").getText(),
        `${product.count}`,
        `В таблице заказа должно отображаться количество добавленного товара`
      );

      const productTotal =
        Number(product.price.trim().slice(1)) * Number(product.count);

      assert.equal(
        Number((await productRow.$(".Cart-Total").getText()).trim().slice(1)),
        productTotal,
        `В таблице заказа должна отображаться общая сумма для добавленного товара`
      );

      totalPrice += productTotal;
    }

    assert.equal(
      Number((await table.$(".Cart-OrderPrice").getText()).trim().slice(1)),
      totalPrice,
      `В таблице заказа должна отображаться общая сумма всего заказа`
    );
  }

  async function getCartTable(browser) {
    await browser.refresh();
    await browser.url(getUrl("/cart"));
    return await browser.$(".Cart-Table");
  }

  function testHeaderCartCount() {
    it(`В шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней`, async ({
      browser,
    }) => {
      await browser.setWindowSize(1024, 1000);

      browser.execute(() =>
        window.localStorage.removeItem("example-store-cart")
      );

      const idsToTest = [0, 1, 2, 3, 4, 5];
      for (const id of idsToTest) {
        for (let i = 0; i < 3; i++) {
          await clickAddToCartButton(browser, { id, count: 0 });
        }
      }

      const cartLinkText = await (
        await browser.$(`.Application-Menu a[href="/hw/store/cart"]`)
      ).getText();

      assert.equal(
        cartLinkText,
        `Cart (${idsToTest.length})`,
        `В шапке должно отображаться количество уникальных товаров в корзине`
      );
    });
  }

  function testCartTable() {
    it(`Для каждого товара должны отображаться название, цена, количество, стоимость, а также должна отображаться общая сумма заказа`, async ({
      browser,
    }) => {
      await browser.setWindowSize(1024, 1000);
      browser.execute(() =>
        window.localStorage.removeItem("example-store-cart")
      );

      const idsToTest = [0, 1, 2, 3, 4, 5];
      const products = [];
      for (const id of idsToTest) {
        const product = await getProductInfo(browser, id);
        products.push(product);
      }

      for (const product of products) {
        for (let i = 0; i < 3; i++) {
          await clickAddToCartButton(browser, product);
        }
      }

      await assertProductsInTable(browser, products);
    });
  }

  testHeaderCartCount();
  testCartTable();
});
