const { assert } = require("chai");
const { getProductInfo, getUrl } = require("./utils");

describe("Тестирование корзины.", () => {
  async function clickAddToCartButton(browser, product) {
    await browser.url(getUrl("/catalog", product.id));
    const productContainer = await browser.$(".Product");

    const addToCartButton = await productContainer.$(
      ".ProductDetails-AddToCart"
    );
    const isButtonDisplayed = await addToCartButton.isDisplayed();
    if (!isButtonDisplayed) {
      return;
    }
    product.count += 1;
    await addToCartButton.click();
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  async function clickClearShoppingCartButton(browser) {
    await browser.url(getUrl("/cart"));
    const cartContainer = await browser.$(".Cart");

    const cartTable = await cartContainer.$(".Cart-Table");

    if (!(await cartTable.isDisplayed())) {
      return;
    }

    const clearCartButton = await cartContainer.$(".Cart-Clear");
    assert.equal(
      await clearCartButton.isDisplayed(),
      true,
      "Должна существовать кнопка очистки корзины."
    );

    await clearCartButton.click();
  }

  async function assertProductsInTable(browser, products) {
    await browser.url(getUrl("/cart"));
    const table = await browser.$(".Cart-Table");

    assert.equal(
      await table.isDisplayed(),
      true,
      `Должна существовать таблица с заказом.`
    );

    let totalPrice = 0;

    for (const product of products) {
      const productRow = await table.$(`tr[data-testid="${product.id}"]`);

      assert.equal(
        await productRow.isDisplayed(),
        true,
        `Должна существовать строка с продуктом ${product.id}.`
      );

      assert.equal(
        await productRow.$(".Cart-Name").getText(),
        `${product.name}`,
        `В таблице заказа должно отображаться имя добавленного товара`
      );

      assert.equal(
        (await productRow.$(".Cart-Price").getText()).slice(1),
        `${product.price}`,
        `В таблице заказа должна отображаться цена добавленного товара`
      );

      assert.equal(
        await productRow.$(".Cart-Count").getText(),
        `${product.count}`,
        `В таблице заказа должно отображаться количество добавленного товара ${product.name}`
      );

      const productTotal = Number(product.price) * Number(product.count);

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

  it(`В шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const idsToTest = [0, 1, 2, 3, 4, 5];
    const products = [];
    for (const id of idsToTest) {
      products.push({ id, count: 0 });
      for (let i = 0; i < 3; i++) {
        await clickAddToCartButton(browser, products[products.length - 1]);
      }
    }

    const cartLinkText = await (
      await browser.$(`.Application-Menu a[href="/hw/store/cart"]`)
    ).getText();

    const shouldBeInCart = products.filter(
      (product) => product.count > 0
    ).length;

    assert.equal(
      cartLinkText,
      `Cart (${shouldBeInCart})`,
      `В шапке должно отображаться количество уникальных товаров в корзине`
    );
  });

  it(`Для каждого товара должны отображаться название, цена, количество, стоимость, а также должна отображаться общая сумма заказа`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const idsToTest = [0, 1, 2, 3];
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

  it(`В корзине должна быть кнопка "очистить корзину", по нажатию на которую все товары должны удаляться`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const idsToTest = [0];
    for (const id of idsToTest) {
      for (let i = 0; i < 3; i++) {
        await clickAddToCartButton(browser, { id, count: 0 });
      }
    }
    await clickClearShoppingCartButton(browser);
    const cartTable = await getCartTable(browser);

    assert.equal(
      await cartTable.isDisplayed(),
      false,
      "Таблица с заказом должна удалиться после очистки корзины"
    );
  });

  it(`Если корзина пустая, должна отображаться ссылка на каталог товаров`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const cartTable = await getCartTable(browser);
    assert.equal(
      await cartTable.isDisplayed(),
      false,
      "Таблица с заказом не должна отображаться, если корзина пустая."
    );

    await browser.url(getUrl("/cart"));
    const catalogLink = await browser.$('a[href="/hw/store/catalog"]');

    assert.equal(
      await catalogLink.isDisplayed(),
      true,
      "Должна отображаться ссылка на каталог."
    );
  });

  it(`После создания заказа должно появляться уведомление об успешной покупке`, async ({
    browser,
  }) => {
    await browser.setWindowSize(1024, 1000);
    browser.execute(() => window.localStorage.removeItem("example-store-cart"));

    const idsToTest = [0];
    for (const id of idsToTest) {
      for (let i = 0; i < 3; i++) {
        await clickAddToCartButton(browser, { id, count: 0 });
      }
    }
    const cartTable = await getCartTable(browser);

    if (!(await cartTable.isDisplayed())) {
      return;
    }

    const form = await browser.$(".Form");
    assert.equal(
      await form.isDisplayed(),
      true,
      "Форма заказа должна существовать."
    );

    const formInputName = await browser.$(".Form-Field_type_name");
    const formInputPhone = await browser.$(".Form-Field_type_phone");
    const formInputAddress = await browser.$(".Form-Field_type_address");

    await formInputName.addValue("Bob");
    await formInputPhone.addValue("89005553030");
    await formInputAddress.addValue("ABC");

    const submitButton = await browser.$(".Form-Submit");
    assert.equal(
      await submitButton.isDisplayed(),
      true,
      "Кнопка отправки формы должна существовать."
    );
    await submitButton.click();

    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });

    const cartSuccessCard = await browser.$(".Cart-SuccessMessage");

    assert.equal(
      await cartSuccessCard.isDisplayed(),
      true,
      "Карточка успешной покупки должна существовать."
    );

    const cardClasses = await cartSuccessCard.getAttribute("class");
    assert.include(
      cardClasses,
      "alert-success",
      "Карточка успешной покупки должна иметь класс alert-success"
    );
  });
});
