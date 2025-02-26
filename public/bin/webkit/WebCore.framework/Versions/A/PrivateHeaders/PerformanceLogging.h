/*
 * Copyright (C) 2016 Apple Inc. All Rights Reserved.
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

#include <wtf/HashCountedSet.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Page;

enum class ShouldIncludeExpensiveComputations : bool { No, Yes };

class PerformanceLogging {
    WTF_MAKE_TZONE_ALLOCATED(PerformanceLogging);
    WTF_MAKE_NONCOPYABLE(PerformanceLogging);
public:
    explicit PerformanceLogging(Page&);

    enum PointOfInterest {
        MainFrameLoadStarted,
        MainFrameLoadCompleted,
    };

    void didReachPointOfInterest(PointOfInterest);

    WEBCORE_EXPORT static HashCountedSet<const char*> javaScriptObjectCounts();
    WEBCORE_EXPORT static Vector<std::pair<ASCIILiteral, size_t>> memoryUsageStatistics(ShouldIncludeExpensiveComputations);
    WEBCORE_EXPORT static std::optional<uint64_t> physicalFootprint();

private:
    static void getPlatformMemoryUsageStatistics(Vector<std::pair<ASCIILiteral, size_t>>&);

    Page& m_page;
};

}
