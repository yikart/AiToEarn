/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#include "ApplePaySessionPaymentRequest.h"
#include <wtf/Expected.h>
#include <wtf/Function.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {
class PaymentCoordinator;
}

namespace WebCore {

class ApplePaySetupFeature;
class Document;
class Payment;
class PaymentCoordinatorClient;
class PaymentContact;
class PaymentMerchantSession;
class PaymentMethod;
class PaymentSession;
class PaymentSessionError;
struct ApplePayCouponCodeUpdate;
struct ApplePayPaymentAuthorizationResult;
struct ApplePayPaymentMethodUpdate;
struct ApplePaySetupConfiguration;
struct ApplePayShippingContactUpdate;
struct ApplePayShippingMethod;
struct ApplePayShippingMethodUpdate;
struct ExceptionDetails;

class PaymentCoordinator final : public RefCountedAndCanMakeWeakPtr<PaymentCoordinator> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PaymentCoordinator, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static Ref<PaymentCoordinator> create(Ref<PaymentCoordinatorClient>&&);
    WEBCORE_EXPORT ~PaymentCoordinator();

    PaymentCoordinatorClient& client() { return m_client.get(); }

    bool supportsVersion(Document&, unsigned version) const;
    bool canMakePayments();
    void canMakePaymentsWithActiveCard(Document&, const String& merchantIdentifier, Function<void(bool)>&& completionHandler);
    void openPaymentSetup(Document&, const String& merchantIdentifier, Function<void(bool)>&& completionHandler);

    bool hasActiveSession() const { return m_activeSession; }

    bool beginPaymentSession(Document&, PaymentSession&, const ApplePaySessionPaymentRequest&);
    void completeMerchantValidation(const PaymentMerchantSession&);
    void completeShippingMethodSelection(std::optional<ApplePayShippingMethodUpdate>&&);
    void completeShippingContactSelection(std::optional<ApplePayShippingContactUpdate>&&);
    void completePaymentMethodSelection(std::optional<ApplePayPaymentMethodUpdate>&&);
#if ENABLE(APPLE_PAY_COUPON_CODE)
    void completeCouponCodeChange(std::optional<ApplePayCouponCodeUpdate>&&);
#endif
    void completePaymentSession(ApplePayPaymentAuthorizationResult&&);
    void abortPaymentSession();
    void cancelPaymentSession();

    WEBCORE_EXPORT void validateMerchant(URL&& validationURL);
    WEBCORE_EXPORT void didAuthorizePayment(const Payment&);
    WEBCORE_EXPORT void didSelectPaymentMethod(const PaymentMethod&);
    WEBCORE_EXPORT void didSelectShippingMethod(const ApplePayShippingMethod&);
    WEBCORE_EXPORT void didSelectShippingContact(const PaymentContact&);
#if ENABLE(APPLE_PAY_COUPON_CODE)
    WEBCORE_EXPORT void didChangeCouponCode(String&& couponCode);
#endif
    WEBCORE_EXPORT void didCancelPaymentSession(PaymentSessionError&&);

    std::optional<String> validatedPaymentNetwork(Document&, unsigned version, const String&) const;

    void getSetupFeatures(const ApplePaySetupConfiguration&, const URL&, CompletionHandler<void(Vector<Ref<ApplePaySetupFeature>>&&)>&&);
    void beginApplePaySetup(const ApplePaySetupConfiguration&, const URL&, Vector<Ref<ApplePaySetupFeature>>&&, CompletionHandler<void(bool)>&&);
    void endApplePaySetup();

protected:
    WEBCORE_EXPORT explicit PaymentCoordinator(Ref<PaymentCoordinatorClient>&&);

private:
    Ref<PaymentCoordinatorClient> m_client;
    RefPtr<PaymentSession> m_activeSession;
};

}

#endif
