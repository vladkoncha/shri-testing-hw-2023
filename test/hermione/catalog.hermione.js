const { assert } = require("chai");
const axios = require("axios");
const { getProductInfo, getUrl } = require("./utils");
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
        (await productName.getText()).length > 0,
        true,
        `Название продукта  не должно быть пустым`
      );
      assert.equal(
        (await productName.getText()) || "",
        product.name || "",
        `Название продукта должно соответствовать полученному с сервера`
      );

      assert.equal(
        (await productPrice.getText()).trim().slice(1).length > 0,
        true,
        `Цена продукта не должна быть пустой`
      );
      assert.equal(
        (await productPrice.getText()).trim().slice(1) || "",
        product.price || "",
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
      const url = "http://localhost:3000" + getUrl("/api/products", product.id);
      const serverProductInfo = (await axios.get(url)).data;

      const fieldsToAssert = [
        "id",
        "name",
        "price",
        "description",
        "color",
        "material",
      ];

      for (const field of fieldsToAssert) {
        assert.equal(
          clientProductInfo[field].toString().length > 0,
          true,
          `Значение ${field} продукта не должно быть пустым`
        );

        assert.equal(
          clientProductInfo[field].toString().toLowerCase(),
          (serverProductInfo[field] ?? "").toString().toLowerCase(),
          `Значение ${field} продукта должно соответствовать полученному с сервера`
        );
      }
    }
  });
});
