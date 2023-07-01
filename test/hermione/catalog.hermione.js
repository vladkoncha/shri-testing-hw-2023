const { assert } = require("chai");
const axios = require("axios");

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

  async function getProductInfo(browser, productId) {
    await browser.url(getUrl("/catalog", productId));
    const productContainer = await browser.$(".Product");

    const name = await productContainer.$(".ProductDetails-Name").getText();
    const price = (await productContainer.$(".ProductDetails-Price").getText())
      .trim()
      .slice(1);
    const description = await productContainer
      .$(".ProductDetails-Description")
      .getText();
    const color = await productContainer.$(".ProductDetails-Color").getText();
    const material = await productContainer
      .$(".ProductDetails-Material")
      .getText();

    return {
      id: productId,
      name,
      price,
      description,
      color,
      material,
    };
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

  const idsToTest = [0];
  for (const id of idsToTest) {
    testAddingProductToCart(id.toString());
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

  it(`Содержимое корзины должно сохраняться между перезагрузками страницы`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

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

  it(`В каталоге должны отображаться товары, список которых приходит с сервера`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const serverCatalog = (
      await axios.get("http://localhost:3000" + getUrl("/api/products"))
    ).data;

    await browser.url(getUrl("/catalog"));
    for (const product of serverCatalog) {
      const productCard = await browser.$(`div[data-testid="${product.id}"]`);
      const productName = await productCard.$(".ProductItem-Name");
      const productPrice = await productCard.$(".ProductItem-Price");

      assert.equal(
        await productName.getText(),
        product.name,
        `Название продукта должно соответствовать полученному с сервера`
      );
      assert.equal(
        (await productPrice.getText()).trim().slice(1),
        product.price,
        `Цена продукта должна соответствовать полученной с сервера`
      );
    }
  });

  it(`На странице с подробной информацией отображаются: название товара, его описание, цена, цвет, материал и кнопка "добавить в корзину"`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const serverCatalog = (
      await axios.get("http://localhost:3000" + getUrl("/api/products"))
    ).data;

    for (const product of serverCatalog) {
      const clientProductInfo = await getProductInfo(browser, product.id);
      const serverProductInfo = (
        await axios.get(
          "http://localhost:3000" + getUrl("/api/products", product.id)
        )
      ).data;

      for (const field of Object.keys(clientProductInfo)) {
        assert.equal(
          clientProductInfo[field].toString().toLowerCase(),
          serverProductInfo[field].toString().toLowerCase(),
          `Значение ${field} продукта должно соответствовать полученному с сервера`
        );
      }
    }
  });
});
