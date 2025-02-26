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

#include "ContextDestructionObserver.h"
#include "ViolationReportType.h"
#include <wtf/Deque.h>
#include <wtf/HashCountedSet.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class String;
}

namespace WebCore {

class Report;
class ReportingObserver;
class ScriptExecutionContext;

class WEBCORE_EXPORT ReportingScope final : public RefCountedAndCanMakeWeakPtr<ReportingScope>, public ContextDestructionObserver {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(ReportingScope, WEBCORE_EXPORT);
public:
    static Ref<ReportingScope> create(ScriptExecutionContext&);
    virtual ~ReportingScope();

    void removeAllObservers();
    void clearReports();

    void registerReportingObserver(ReportingObserver&);
    void unregisterReportingObserver(ReportingObserver&);
    void notifyReportObservers(Ref<Report>&&);
    void appendQueuedReportsForRelevantType(ReportingObserver&);

    bool containsObserver(const ReportingObserver&) const;

    static MemoryCompactRobinHoodHashMap<String, String> parseReportingEndpointsFromHeader(const String&, const URL& baseURL);
    void parseReportingEndpoints(const String&, const URL& baseURL);

    String endpointURIForToken(const String&) const;

    void generateTestReport(String&& message, String&& group);

private:
    explicit ReportingScope(ScriptExecutionContext&);

    Vector<Ref<ReportingObserver>> m_reportingObservers;
    Deque<Ref<Report>> m_queuedReports;
    HashCountedSet<ViolationReportType, IntHash<ViolationReportType>, WTF::StrongEnumHashTraits<ViolationReportType>> m_queuedReportTypeCounts;

    MemoryCompactRobinHoodHashMap<String, String> m_reportingEndpoints;
};

}
