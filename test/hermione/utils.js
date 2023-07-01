const { assert } = require("chai");

let bugId = "";
if (process.env.BUG_ID !== undefined) {
  bugId = process.env.BUG_ID;
}

function getUrl(route, productId = "") {
  return `/hw/store${route}/${productId}` + (bugId && `?bug_id=${bugId}`);
}

async function checkExistence(element, elementName) {
  assert.equal(
    await element.isDisplayed(),
    true,
    `Должен отображаться элемент: ${elementName}`
  );
}

async function getProductInfo(browser, productId) {
  await browser.url(getUrl("/catalog", productId));
  const productContainer = await browser.$(".Product");

  let name = await productContainer.$(".ProductDetails-Name");
  await checkExistence(name, "название товара");
  name = await name.getText();

  let price = await productContainer.$(".ProductDetails-Price");
  await checkExistence(price, "цена товара");
  price = (await price.getText()).trim().slice(1);

  let description = await productContainer.$(".ProductDetails-Description");
  await checkExistence(description, "описание товара");
  description = await description.getText();

  let color = await productContainer.$(".ProductDetails-Color");
  await checkExistence(color, "цвет товара");
  color = await color.getText();

  let material = await productContainer.$(".ProductDetails-Material");
  await checkExistence(material, "материал товара");
  material = await material.getText();

  return {
    id: productId,
    name,
    price,
    description,
    color,
    material,
    count: 0,
  };
}

module.exports.getProductInfo = getProductInfo;
module.exports.getUrl = getUrl;
