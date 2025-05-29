"use strict";
// ** Write your module here **
// It must send an event "order_details" from the page containing an Order object,
// which describes all the relevant data points on the page.
// The order_details data you are sending should match the `expected_output` object in `test.js`

module.exports = function extract_order() {
  try {
    const bodyText = document.body.textContent || '';
    const orderMatch = bodyText.match(/Order\s+#(\d+)/);
    const orderNumber = orderMatch ? orderMatch[1] : '';

    const iframe = document.querySelector('iframe');
    const iframeUrl = iframe?.src || '';
    const queryString = iframeUrl.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    const rawPrices = urlParams.get('item_prices');
    const rawQuantities = urlParams.get('item_quantities');
    const prices = rawPrices ? rawPrices.split(',').map(Number) : [];
    const quantities = rawQuantities ? rawQuantities.split(',').map(Number) : [];

    const itemsContainer = document.querySelector('[data-testid="collapsedItemList"]');
    const imageTags = itemsContainer ? itemsContainer.querySelectorAll('img[alt]') : [];
    const productNames = Array.from(imageTags).map(img => img.alt);

    // Combine product info into objects
    const products = productNames.map((name, i) => {
      const unitPrice = prices[i] || 0;
      const qty = quantities[i] || 1;
      return {
        'Product Name': name,
        'Unit Price': unitPrice.toFixed(2),
        'Quantity': qty.toString(),
        'Line Total': (unitPrice * qty).toFixed(2)
      };
    });

    const html = document.body.innerHTML;
    const totalMatch = html.match(/<span class="b">\$(\d+\.\d{2})<\/span>/);
    const grandTotal = totalMatch ? totalMatch[1] : '0.00';
    const subtotal = urlParams.get('subtotal') || '0.00';

    const taxAmount = (parseFloat(grandTotal) - parseFloat(subtotal)).toFixed(2);

    function detectPaymentMethod() {
      const divs = document.querySelectorAll('div');
      for (let div of divs) {
        if (div.className.includes('flex w-70 f6 f5-m items-center')) {
          const paymentImg = div.querySelector('img[alt]');
          if (paymentImg) {
            return paymentImg.alt.trim();
          }
        }
      }
      return 'Unknown';
    }

    const orderDetails = {
      'Order Number': orderNumber,
      "Products": products,
      "Shipping": '0',
      "Subtotal": subtotal,
      'Grand Total': grandTotal,
      "Tax": taxAmount,
      'Payment Type': detectPaymentMethod()
    };

    console.log('Order Details:', orderDetails);

    document.dispatchEvent(new CustomEvent('order_details', { detail: orderDetails }));
  } catch (e) {
    console.error(e);
  }
};
