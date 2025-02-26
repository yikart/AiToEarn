/*
 * Copyright (C) 2018-2020 Apple Inc. All rights reserved.
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

#include <wtf/RefCounted.h>
#include <wtf/RetainPtr.h>

OBJC_CLASS PKPaymentSetupFeature;

namespace WebCore {

enum class ApplePaySetupFeatureState : uint8_t;
enum class ApplePaySetupFeatureType : bool;

class ApplePaySetupFeature : public RefCounted<ApplePaySetupFeature> {
public:
    static Ref<ApplePaySetupFeature> create(PKPaymentSetupFeature *feature)
    {
        return adoptRef(*new ApplePaySetupFeature(feature));
    }

    WEBCORE_EXPORT static bool supportsFeature(PKPaymentSetupFeature *);
    
    WEBCORE_EXPORT virtual ~ApplePaySetupFeature();

    virtual ApplePaySetupFeatureState state() const;
    virtual ApplePaySetupFeatureType type() const;

    PKPaymentSetupFeature *platformFeature() const { return m_feature.get(); }

#if ENABLE(APPLE_PAY_INSTALLMENTS)
    virtual bool supportsInstallments() const;
#endif

protected:
    WEBCORE_EXPORT ApplePaySetupFeature();

private:
    WEBCORE_EXPORT explicit ApplePaySetupFeature(PKPaymentSetupFeature *);

    RetainPtr<PKPaymentSetupFeature> m_feature;
};

} // namespace WebCore

#endif // ENABLE(APPLE_PAY)
