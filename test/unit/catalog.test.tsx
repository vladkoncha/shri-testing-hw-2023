import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { CartApi, ExampleApi } from "../../src/client/api";
import { ApplicationState } from "../../src/client/store";
import { commerce } from "faker";
import { Provider } from "react-redux";
import { Catalog } from "../../src/client/pages/Catalog";
import { createStore } from "redux";
import { Product } from "../../src/common/types";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { Application } from "../../src/client/Application";

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
      expect(productIdContainer).toBeInTheDocument();

      const productName = productIdContainer.querySelector(".ProductItem-Name");
      expect(productName).toBeInTheDocument();
      expect(productName).toHaveTextContent(product.name);

      const productPrice =
        productIdContainer.querySelector(".ProductItem-Price");
      expect(productPrice).toBeInTheDocument();
      expect(productPrice).toHaveTextContent(product.price.toString());

      const productDetailsLink = productIdContainer.querySelector(
        ".ProductItem-DetailsLink"
      );
      expect(productDetailsLink).toBeInTheDocument();
      expect(productDetailsLink).toBeInstanceOf(HTMLAnchorElement);
      expect(productDetailsLink.getAttribute("href")).toBe(
        `/catalog/${product.id}`
      );
    }
  });

  function testProductDescription(
    product: Product,
    initState: ApplicationState
  ) {
    it(`На странице с подробной информацией продукта ${product.id} отображаются: название товара, его описание, цена, цвет, материал и кнопка "добавить в корзину"`, () => {
      const store = createStore(() => initState);

      const { container } = render(
        <MemoryRouter initialEntries={[`/catalog/${product.id}`]}>
          <Provider store={store}>
            <Application />
          </Provider>
        </MemoryRouter>
      );

      const productDetailsContainer = container.querySelector(".Product");
      expect(productDetailsContainer).toBeInTheDocument();

      const testField = (fieldName: string, expectedValue: string) => {
        const field = productDetailsContainer.querySelector(
          `.ProductDetails-${fieldName}`
        );
        expect(field).toHaveTextContent(expectedValue);
      };

      const fieldsToTest = [
        "Name",
        "Description",
        "Price",
        "Color",
        "Material",
      ];

      fieldsToTest.forEach((field) => {
        testField(
          field,
          product[field.toLowerCase() as keyof Product].toString()
        );
      });

      testField("AddToCart", "Add to Cart");
    });
  }

  const products: Product[] = [];
  initProducts(products);
  const initState = {
    details: products,
    cart: {},
    products,
  };

  for (const product of products) {
    testProductDescription(product, initState);
  }
});
