/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Forward.h>

namespace WebCore {

enum class ApplePayFeature : uint8_t {
#if ENABLE(APPLE_PAY_LATER)
    ApplePayLater,
#endif
#if ENABLE(APPLE_PAY_LATER_AVAILABILITY)
    ApplePayLaterAvailability,
#endif
#if ENABLE(APPLE_PAY_PAYMENT_ORDER_DETAILS)
    AuthorizationResultOrderDetails,
#endif
    LineItemPaymentTiming,
#if ENABLE(APPLE_PAY_AUTOMATIC_RELOAD_PAYMENTS)
    PaymentRequestAutomaticReload,
#endif
#if ENABLE(APPLE_PAY_COUPON_CODE)
    PaymentRequestCouponCode,
#endif
#if ENABLE(APPLE_PAY_MERCHANT_CATEGORY_CODE)
    PaymentRequestMerchantCategoryCode,
#endif
#if ENABLE(APPLE_PAY_MULTI_MERCHANT_PAYMENTS)
    PaymentRequestMultiTokenContexts,
#endif
#if ENABLE(APPLE_PAY_RECURRING_PAYMENTS)
    PaymentRequestRecurring,
#endif
#if ENABLE(APPLE_PAY_SHIPPING_CONTACT_EDITING_MODE)
    PaymentRequestShippingContactEditingMode,
#endif
#if ENABLE(APPLE_PAY_AUTOMATIC_RELOAD_LINE_ITEM)
    PaymentTimingAutomaticReload,
#endif
#if ENABLE(APPLE_PAY_DEFERRED_PAYMENTS)
    PaymentRequestDeferred,
#endif
#if ENABLE(APPLE_PAY_DEFERRED_LINE_ITEM)
    PaymentTimingDeferred,
#endif
    PaymentTimingImmediate,
#if ENABLE(APPLE_PAY_RECURRING_LINE_ITEM)
    PaymentTimingRecurring,
#endif
#if ENABLE(APPLE_PAY_SHIPPING_CONTACT_EDITING_MODE)
    ShippingContactEditingModeEnabled,
    ShippingContactEditingModeStorePickup,
#endif
#if ENABLE(APPLE_PAY_SHIPPING_METHOD_DATE_COMPONENTS_RANGE)
    ShippingMethodDateComponentsRange,
#endif
#if ENABLE(APPLE_PAY_DISBURSEMENTS)
    PaymentRequestDisbursements,
#endif
};

} // namespace WebCore

