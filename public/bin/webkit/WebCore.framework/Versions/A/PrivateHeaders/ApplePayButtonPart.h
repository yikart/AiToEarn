/*
 * Copyright (C) 2023 Apple Inc. All Rights Reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(APPLE_PAY)

#include "ControlPart.h"

namespace WebCore {

enum class ApplePayButtonType : uint8_t {
    Plain,
    Buy,
    SetUp,
    Donate,
    CheckOut,
    Book,
    Subscribe,
#if ENABLE(APPLE_PAY_NEW_BUTTON_TYPES)
    Reload,
    AddMoney,
    TopUp,
    Order,
    Rent,
    Support,
    Contribute,
    Tip,
#endif // ENABLE(APPLE_PAY_NEW_BUTTON_TYPES)
};

enum class ApplePayButtonStyle : uint8_t {
    White,
    WhiteOutline,
    Black,
};

class ApplePayButtonPart : public ControlPart {
public:
    static Ref<ApplePayButtonPart> create();
    WEBCORE_EXPORT static Ref<ApplePayButtonPart> create(ApplePayButtonType, ApplePayButtonStyle, const String& locale);

    ApplePayButtonType buttonType() const { return m_buttonType; }
    void setButtonType(ApplePayButtonType buttonType) { m_buttonType = buttonType; }

    ApplePayButtonStyle buttonStyle() const { return m_buttonStyle; }
    void setButtonStyle(ApplePayButtonStyle buttonStyle) { m_buttonStyle = buttonStyle; }

    String locale() const { return m_locale; }
    void setLocale(String locale) { m_locale = locale; }

private:
    ApplePayButtonPart(ApplePayButtonType, ApplePayButtonStyle, const String& locale);

    std::unique_ptr<PlatformControl> createPlatformControl() override;

    ApplePayButtonType m_buttonType;
    ApplePayButtonStyle m_buttonStyle;
    String m_locale;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CONTROL_PART(ApplePayButton)

#endif // ENABLE(APPLE_PAY)
