import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Application } from "../../src/client/Application";
import React from "react";
import { CartApi, ExampleApi } from "../../src/client/api";
import { initStore } from "../../src/client/store";
import { render, screen } from "@testing-library/react";

function createApp() {
  const basename = "/";
  const api = new ExampleApi(basename);
  const cart = new CartApi();
  const store = initStore(api, cart);
  const application = (
    <BrowserRouter basename={basename}>
      <Provider store={store}>
        <Application />
      </Provider>
    </BrowserRouter>
  );
  return render(application);
}

describe("Тестирование общих требований: шапка", () => {
  it("В шапке отображаются ссылки на страницы магазина", () => {
    const { container } = createApp();

    const navBar = container.querySelector(".navbar-nav");

    const navLinks = navBar.querySelectorAll(".nav-link");

    const linksToContain = ["/catalog", "/delivery", "/contacts", "/cart"];
    const linksContained: string[] = [];
    navLinks.forEach((link) => {
      expect(link).toBeInstanceOf(HTMLAnchorElement);
      linksContained.push(link.getAttribute("href"));
    });

    expect(linksContained).toStrictEqual(linksToContain);
  });

  it("Название магазина в шапке должно быть ссылкой на главную страницу", () => {
    createApp();
    const storeNameLink = screen.queryByText("Example store", { exact: true });

    expect(storeNameLink).not.toBe(null);
    expect(storeNameLink).toBeInstanceOf(HTMLAnchorElement);
    expect(storeNameLink.getAttribute("href")).toBe("/");
  });
});
