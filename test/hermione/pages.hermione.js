let bugId = "";
if (process.env.BUG_ID !== undefined) {
  bugId = process.env.BUG_ID;
}

function getUrl(page) {
  return "/hw/store/" + page + (bugId && `?bug_id=${bugId}`);
}

describe("Тестирование страниц", () => {
  function testAdaptiveWidth(page) {
    it(`Страница ${page} должна иметь статическое содержимое`, async ({
      browser,
    }) => {
      await browser.setWindowSize(1024, 1000);
      await browser.url(getUrl(page === "home" ? "" : page));
      await browser.$(".Application");
      await browser.assertView(`plain-static-${page}`, ".Application", {
        ignoreElements: [".Application-Menu"],
      });
    });
  }

  const pagesToTest = ["home", "delivery", "contacts"];
  pagesToTest.forEach((width) => testAdaptiveWidth(width));
});
