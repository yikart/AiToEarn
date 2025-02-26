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

#include "Timer.h"
#include <wtf/CPUTime.h>
#include <wtf/CheckedPtr.h>
#include <wtf/Function.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class CPUMonitor final : public CanMakeCheckedPtr<CPUMonitor> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CPUMonitor, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(CPUMonitor);
public:
    using ExceededCPULimitHandler = Function<void(double)>;
    WEBCORE_EXPORT CPUMonitor(Seconds checkInterval, ExceededCPULimitHandler&&);

    WEBCORE_EXPORT void setCPULimit(const std::optional<double>&);

private:
    void timerFired();

    Seconds m_checkInterval;
    ExceededCPULimitHandler m_exceededCPULimitHandler;
    Timer m_timer;
    std::optional<double> m_cpuLimit;
    std::optional<CPUTime> m_lastCPUTime;
};

} // namespace WebCore
