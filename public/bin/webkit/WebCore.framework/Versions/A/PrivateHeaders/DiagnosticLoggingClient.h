/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "DiagnosticLoggingDomain.h"
#include <variant>
#include <wtf/CheckedPtr.h>
#include <wtf/CryptographicallyRandomNumber.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum DiagnosticLoggingResultType : uint8_t;
enum class ShouldSample : bool { No, Yes };

struct DiagnosticLoggingDictionary {
    using Payload = std::variant<String, uint64_t, int64_t, bool, double>;
    using Dictionary = HashMap<String, Payload>;
    Dictionary dictionary;
    void set(String key, Payload value) { dictionary.set(WTFMove(key), WTFMove(value)); }
};

class DiagnosticLoggingClient : public CanMakeCheckedPtr<DiagnosticLoggingClient> {
    WTF_MAKE_TZONE_ALLOCATED(DiagnosticLoggingClient);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(DiagnosticLoggingClient);
public:
    virtual void logDiagnosticMessage(const String& message, const String& description, ShouldSample) = 0;
    virtual void logDiagnosticMessageWithResult(const String& message, const String& description, DiagnosticLoggingResultType, ShouldSample) = 0;
    virtual void logDiagnosticMessageWithValue(const String& message, const String& description, double value, unsigned significantFigures, ShouldSample) = 0;
    virtual void logDiagnosticMessageWithEnhancedPrivacy(const String& message, const String& description, ShouldSample) = 0;

    using ValuePayload = DiagnosticLoggingDictionary::Payload;
    using ValueDictionary = DiagnosticLoggingDictionary;

    virtual void logDiagnosticMessageWithValueDictionary(const String& message, const String& description, const ValueDictionary&, ShouldSample) = 0;
    virtual void logDiagnosticMessageWithDomain(const String& message, DiagnosticLoggingDomain) = 0;

    static bool shouldLogAfterSampling(ShouldSample);

    virtual ~DiagnosticLoggingClient() = default;
};

inline bool DiagnosticLoggingClient::shouldLogAfterSampling(ShouldSample shouldSample)
{
    if (shouldSample == ShouldSample::No)
        return true;

    static const double selectionProbability = 0.05;
    return cryptographicallyRandomUnitInterval() <= selectionProbability;
}

} // namespace WebCore
