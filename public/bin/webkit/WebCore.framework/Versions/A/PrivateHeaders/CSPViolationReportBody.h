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

#include "ReportBody.h"
#include "SecurityPolicyViolationEvent.h"
#include "ViolationReportType.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FormData;

struct CSPInfo;
struct SecurityPolicyViolationEventInit;

class CSPViolationReportBody final : public ReportBody {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CSPViolationReportBody);
public:
    using Init = SecurityPolicyViolationEventInit;

    WEBCORE_EXPORT static Ref<CSPViolationReportBody> create(Init&&);
    WEBCORE_EXPORT static Ref<CSPViolationReportBody> create(String&& documentURL, String&& referrer, String&& blockedURL, String&& effectiveDirective, String&& originalPolicy, String&& sourceFile, String&& sample, SecurityPolicyViolationEventDisposition, unsigned short statusCode, unsigned long lineNumber, unsigned long columnNumber);

    const String& type() const final;
    const String& documentURL() const { return m_documentURL; }
    const String& referrer() const { return m_referrer; }
    const String& blockedURL() const { return m_blockedURL; }
    const String& effectiveDirective() const { return m_effectiveDirective; }
    const String& originalPolicy() const { return m_originalPolicy; }
    const String& sourceFile() const { return m_sourceFile; }
    const String& sample() const { return m_sample; }
    SecurityPolicyViolationEventDisposition disposition() const { return m_disposition; }
    unsigned short statusCode() const { return m_statusCode; }
    unsigned long lineNumber() const { return m_lineNumber; }
    unsigned long columnNumber() const { return m_columnNumber; }
    
    WEBCORE_EXPORT Ref<FormData> createReportFormDataForViolation(bool usesReportTo, bool isReportOnly) const;

private:
    CSPViolationReportBody(Init&&);
    CSPViolationReportBody(String&& documentURL, String&& referrer, String&& blockedURL, String&& effectiveDirective, String&& originalPolicy, String&& sourceFile, String&& sample, SecurityPolicyViolationEventDisposition, unsigned short statusCode, unsigned long lineNumber, unsigned long columnNumber);

    ViolationReportType reportBodyType() const final { return ViolationReportType::ContentSecurityPolicy; }

    const String m_documentURL;
    const String m_referrer;
    const String m_blockedURL;
    const String m_effectiveDirective;
    const String m_originalPolicy;
    const String m_sourceFile;
    const String m_sample;
    const SecurityPolicyViolationEventDisposition m_disposition;
    const unsigned short m_statusCode;
    const unsigned long m_lineNumber;
    const unsigned long m_columnNumber;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CSPViolationReportBody)
    static bool isType(const WebCore::ReportBody& reportBody) { return reportBody.reportBodyType() == WebCore::ViolationReportType::ContentSecurityPolicy; }
SPECIALIZE_TYPE_TRAITS_END()
