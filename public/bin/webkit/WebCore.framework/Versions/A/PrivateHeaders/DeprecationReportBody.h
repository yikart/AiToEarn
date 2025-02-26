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
#include "ViolationReportType.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WallTime.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class FormData;

class DeprecationReportBody final : public ReportBody {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(DeprecationReportBody);
public:
    WEBCORE_EXPORT static Ref<DeprecationReportBody> create(String&& id, WallTime anticipatedRemoval, String&& message, String&& sourceFile, std::optional<unsigned> lineNumber, std::optional<unsigned> columnNumber);

    const String& type() const final;
    const String& id() const { return m_id; };
    WallTime anticipatedRemoval() const { return m_anticipatedRemoval; }
    const String& message() const { return m_message; }
    const String& sourceFile() const { return m_sourceFile; }
    std::optional<unsigned> lineNumber() const { return m_lineNumber; }
    std::optional<unsigned> columnNumber() const { return m_columnNumber; }

    WEBCORE_EXPORT Ref<FormData> createReportFormDataForViolation() const;

private:
    DeprecationReportBody(String&& id, WallTime anticipatedRemoval, String&& message, String&& sourceFile, std::optional<unsigned> lineNumber, std::optional<unsigned> columnNumber);

    ViolationReportType reportBodyType() const final { return ViolationReportType::Deprecation; }

    const String m_id;
    const WallTime m_anticipatedRemoval;
    const String m_message;
    const String m_sourceFile;
    const std::optional<unsigned> m_lineNumber;
    const std::optional<unsigned> m_columnNumber;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::DeprecationReportBody)
    static bool isType(const WebCore::ReportBody& reportBody) { return reportBody.reportBodyType() == WebCore::ViolationReportType::Deprecation; }
SPECIALIZE_TYPE_TRAITS_END()
