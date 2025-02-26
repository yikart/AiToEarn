/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#if ENABLE(APPLE_PAY)

#include "ApplePayError.h"
#include "ApplePayPaymentOrderDetails.h"
#include <optional>
#include <wtf/RefPtr.h>
#include <wtf/Vector.h>

namespace WebCore {

struct ApplePayPaymentAuthorizationResult {
    using Status = unsigned short;
    static constexpr Status Success = 0;
    static constexpr Status Failure = 1;
    static constexpr Status InvalidBillingPostalAddress = 2;
    static constexpr Status InvalidShippingPostalAddress = 3;
    static constexpr Status InvalidShippingContact = 4;
    static constexpr Status PINRequired = 5;
    static constexpr Status PINIncorrect = 6;
    static constexpr Status PINLockout = 7;

    Status status; // required
    Vector<Ref<ApplePayError>> errors;

#if ENABLE(APPLE_PAY_PAYMENT_ORDER_DETAILS)
    std::optional<ApplePayPaymentOrderDetails> orderDetails;
#endif

    WEBCORE_EXPORT bool isFinalState() const;
};

}

#endif
