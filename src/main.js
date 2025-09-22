/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   const editedDiscount = 1 - (discount / 100)
   return sale_price * quantity * editedDiscount
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15
    } else if (index === total - 1) {
        return 0
    } else if (index === 1 || index === 2) {
        return profit * 0.1
    } else {
        return profit * 0.05
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data || !options) {
        throw new Error("Некорректные входные данные")
    }
    const { calculateRevenue, calculateBonus } = options;
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    })); 
   
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]))
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]))

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
        seller.sales_count += 1;
        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue({discount: item.discount, sale_price: item.sale_price, quantity: item.quantity}, product)
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost
            // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += profit

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity
        });
    });
    sellerStats.sort((a, b) => b.profit - a.profit) 
    const arrLength = sellerStats.length
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, arrLength, seller)
        seller.top_products = Object.entries(seller.products_sold)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
    })
    
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: Object.fromEntries(seller.top_products),
        bonus: +seller.bonus.toFixed(2)
    }))
}

