import React from "react";
import { render, screen } from "@testing-library/react";
import { CartApi, ExampleApi } from "../../src/client/api";
import { ApplicationState } from "../../src/client/store";
import { commerce } from "faker";
import { Provider } from "react-redux";
import { Catalog } from "../../src/client/pages/Catalog";
import { createStore } from "redux";
import { Product } from "../../src/common/types";
import { BrowserRouter } from "react-router-dom";

function createCatalog(initState: ApplicationState) {
  const basename = "/";
  const api = new ExampleApi(basename);
  const cart = new CartApi();
  const store = createStore(() => initState);
  const application = (
    <BrowserRouter basename={basename}>
      <Provider store={store}>
        <Catalog />
      </Provider>
    </BrowserRouter>
  );
  return render(application);
}

describe("Тестирование каталога", () => {
  function initProducts(products: Product[]) {
    for (let id = 0; id < 10; id++) {
      products.push({
        id,
        name: `${commerce.productAdjective()} ${commerce.product()}`,
        description: commerce.productDescription(),
        price: Number(commerce.price()),
        color: commerce.color(),
        material: commerce.productMaterial(),
      });
    }
  }

  it("В каталоге должны отображаться товары, список которых приходит с сервера", () => {
    const products: Product[] = [];
    initProducts(products);
    const initState = {
      details: {},
      cart: {},
      products,
    };

    createCatalog(initState);

    for (const product of products) {
      const productIdExist = screen.queryAllByTestId(product.id.toString());
      expect(productIdExist).not.toBe([]);
    }
  });

  it("Для каждого товара в каталоге отображается название, цена и ссылка на страницу с подробной информацией о товаре", () => {
    const products: Product[] = [];
    initProducts(products);
    const initState = {
      details: {},
      cart: {},
      products,
    };

    createCatalog(initState);

    for (const product of products) {
      const productIdContainer = screen.queryAllByTestId(
        product.id.toString()
      )[0];
      expect(productIdContainer).toBeDefined();
      expect(productIdContainer).not.toBeNull();

      const productName = productIdContainer.querySelector(".ProductItem-Name");
      expect(productName).not.toBeNull();
      expect(productName.textContent).toBe(product.name);

      const productPrice =
        productIdContainer.querySelector(".ProductItem-Price");
      expect(productPrice).not.toBeNull();
      expect(productPrice.textContent).toContain(product.price.toString());

      const productDetailsLink = productIdContainer.querySelector(
        ".ProductItem-DetailsLink"
      );
      expect(productDetailsLink).not.toBeNull();
      expect(productDetailsLink).toBeInstanceOf(HTMLAnchorElement);
      expect(productDetailsLink.getAttribute("href")).toBe(
        `/catalog/${product.id}`
      );
    }
  });
});
