import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ApplicationState } from "../../src/client/store";
import { commerce } from "faker";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { CartState, Product } from "../../src/common/types";
import { MemoryRouter } from "react-router-dom";
import { Application } from "../../src/client/Application";

function createCatalog(initState: ApplicationState, productId?: string) {
  const store = createStore(() => initState);

  const url = `/catalog/${productId ?? ""}`;
  const application = (
    <MemoryRouter initialEntries={[url]}>
      <Provider store={store}>
        <Application />
      </Provider>
    </MemoryRouter>
  );
  return render(application);
}

function initProducts(): Product[] {
  const products: Product[] = [];
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
  return products;
}

describe("Тестирование каталога", () => {
  it("В каталоге должны отображаться товары, список которых приходит с сервера", () => {
    const products = initProducts();
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
    const products = initProducts();
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
      const { container } = createCatalog(initState, product.id.toString());

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

  const products = initProducts();
  const initState = {
    details: products,
    cart: {},
    products,
  };
  for (const product of products) {
    testProductDescription(product, initState);
  }
});

describe("Если товар уже добавлен в корзину", () => {
  const products = initProducts();

  const idsInCart = [0, 1];
  const cart: CartState = {};

  idsInCart.forEach((id) => {
    cart[id] = {
      name: products[id].name,
      price: products[id].price,
      count: 1,
    };
  });

  const initState = {
    details: products,
    cart,
    products,
  };

  it("В каталоге должно отображаться сообщение об этом", () => {
    createCatalog(initState);

    for (const id of idsInCart) {
      const productIdContainer = screen.queryAllByTestId(id.toString())[0];
      expect(productIdContainer).toBeInTheDocument();

      const cartBadge = productIdContainer.querySelector(".CartBadge");
      expect(cartBadge).toBeInTheDocument();
      expect(cartBadge).toHaveTextContent("Item in cart");
    }
  });

  it("На странице товара должно отображаться сообщение об этом", () => {
    for (const id of idsInCart) {
      const { container } = createCatalog(initState, id.toString());

      const productIdContainer = container.querySelector(".Product");
      expect(productIdContainer).toBeInTheDocument();

      const cartBadge = productIdContainer.querySelector(".CartBadge");
      expect(cartBadge).toBeInTheDocument();
      expect(cartBadge).toHaveTextContent("Item in cart");
    }
  });
});
