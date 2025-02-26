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

#include "ApplePayErrorCode.h"
#include "ApplePayErrorContactField.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class ApplePayError final : public RefCounted<ApplePayError> {
public:

    enum class Domain : uint8_t {
        Disbursement
    };

    static Ref<ApplePayError> create(ApplePayErrorCode code, std::optional<ApplePayErrorContactField> contactField, const String& message, std::optional<ApplePayError::Domain> domain = { })
    {
        return adoptRef(*new ApplePayError(code, contactField, message, domain));
    }

    virtual ~ApplePayError() = default;

    ApplePayErrorCode code() const { return m_code; }
    void setCode(ApplePayErrorCode code) { m_code = code; }

    std::optional<ApplePayErrorContactField> contactField() const { return m_contactField; }
    void setContactField(std::optional<ApplePayErrorContactField> contactField) { m_contactField = contactField; }

    String message() const { return m_message; }
    void setMessage(String&& message) { m_message = WTFMove(message); }

    std::optional<Domain> domain() const { return m_domain; }
    void setDomain(std::optional<Domain> domain) { m_domain = domain; }


private:
    ApplePayError(ApplePayErrorCode code, std::optional<ApplePayErrorContactField> contactField, const String& message, std::optional<ApplePayError::Domain> domain)
        : m_code(code)
        , m_contactField(contactField)
        , m_message(message)
        , m_domain(domain)
    {
    }

    ApplePayErrorCode m_code;
    std::optional<ApplePayErrorContactField> m_contactField;
    String m_message;

    std::optional<ApplePayError::Domain> m_domain;
};

} // namespace WebCore

#endif
