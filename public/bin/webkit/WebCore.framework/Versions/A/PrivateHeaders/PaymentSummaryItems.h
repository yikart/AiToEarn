/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

OBJC_CLASS NSArray;
OBJC_CLASS NSDecimalNumber;
OBJC_CLASS PKAutomaticReloadPaymentSummaryItem;
OBJC_CLASS PKDeferredPaymentSummaryItem;
OBJC_CLASS PKPaymentSummaryItem;
OBJC_CLASS PKRecurringPaymentSummaryItem;

#if HAVE(PASSKIT_DISBURSEMENTS)
OBJC_CLASS PKDisbursementSummaryItem;
OBJC_CLASS PKInstantFundsOutFeeSummaryItem;
#endif // HAVE(PASSKIT_DISBURSEMENTS)

namespace WebCore {

struct ApplePayLineItem;

#if HAVE(PASSKIT_RECURRING_SUMMARY_ITEM)
WEBCORE_EXPORT PKRecurringPaymentSummaryItem *platformRecurringSummaryItem(const ApplePayLineItem&);
#endif

#if HAVE(PASSKIT_DEFERRED_SUMMARY_ITEM)
WEBCORE_EXPORT PKDeferredPaymentSummaryItem *platformDeferredSummaryItem(const ApplePayLineItem&);
#endif

#if HAVE(PASSKIT_AUTOMATIC_RELOAD_SUMMARY_ITEM)
WEBCORE_EXPORT PKAutomaticReloadPaymentSummaryItem *platformAutomaticReloadSummaryItem(const ApplePayLineItem&);
#endif

#if HAVE(PASSKIT_DISBURSEMENTS)
WEBCORE_EXPORT PKDisbursementSummaryItem *platformDisbursementSummaryItem(const ApplePayLineItem&);
WEBCORE_EXPORT PKInstantFundsOutFeeSummaryItem *platformInstantFundsOutFeeSummaryItem(const ApplePayLineItem&);
#endif // HAVE(PASSKIT_DISBURSEMENTS)

WEBCORE_EXPORT PKPaymentSummaryItem *platformSummaryItem(const ApplePayLineItem&);
WEBCORE_EXPORT NSArray *platformDisbursementSummaryItems(const Vector<ApplePayLineItem>&);
WEBCORE_EXPORT NSArray *platformSummaryItems(const ApplePayLineItem& total, const Vector<ApplePayLineItem>&);

WEBCORE_EXPORT NSDecimalNumber *toDecimalNumber(const String& amount);

} // namespace WebCore

#endif // ENABLE(APPLE_PAY)
