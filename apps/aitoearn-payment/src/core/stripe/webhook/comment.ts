export enum IWebhookType {
  'payment_intent.created' = 'payment_intent.created', // --status 2  订单创建成功等待支付
  'charge.refunded' = 'charge.refunded', // --status 3  退款成功
  'checkout.session.expired' = 'checkout.session.expired', // --status 4 订单取消
  'customer.subscription.created' = 'customer.subscription.created', // 创建订阅
  'customer.subscription.deleted' = 'customer.subscription.deleted', // 取消订阅
  'checkout.session.completed' = 'checkout.session.completed', // 订单完成  -- status： 1   支付成功
}

//
// export enum IWebhookType {
//   'charge.succeeded' = 1,   //  -- status： 1   支付成功
//   'payment_intent.created' = 2,  // --status 2  订单创建成功等待支付
//   'charge.refunded' = 3,  // --status 3  退款成功
//   'checkout.session.expired' = 4, // --status 4 订单取消
//   'customer.subscription.created' = 5, // 创建订阅
//   'customer.subscription.deleted' = 6, // 取消订阅
// }
