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

#include "CrossOriginEmbedderPolicy.h"
#include "FetchOptions.h"
#include "ReportBody.h"
#include "ViolationReportType.h"
#include <wtf/ArgumentCoder.h>

namespace WebCore {

class CORPViolationReportBody : public ReportBody {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(CORPViolationReportBody);
public:
    WEBCORE_EXPORT static Ref<CORPViolationReportBody> create(COEPDisposition, const URL& blockedURL, FetchOptions::Destination);

    String disposition() const;
    const String& type() const final;
    const String& blockedURL() const { return m_blockedURL.string(); }
    FetchOptions::Destination destination() const { return m_destination; }

private:
    friend struct IPC::ArgumentCoder<CORPViolationReportBody, void>;
    CORPViolationReportBody(COEPDisposition, const URL& blockedURL, FetchOptions::Destination);

    ViolationReportType reportBodyType() const final { return ViolationReportType::CORPViolation; }

    COEPDisposition m_disposition;
    URL m_blockedURL;
    FetchOptions::Destination m_destination;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CORPViolationReportBody)
    static bool isType(const WebCore::ReportBody& reportBody) { return reportBody.reportBodyType() == WebCore::ViolationReportType::CORPViolation; }
SPECIALIZE_TYPE_TRAITS_END()
