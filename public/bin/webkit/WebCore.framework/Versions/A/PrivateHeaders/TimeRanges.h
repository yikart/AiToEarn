/*
 * Copyright (C) 2007, 2009 Apple Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "PlatformTimeRanges.h"

namespace WebCore {

class TimeRanges : public RefCounted<TimeRanges> {
public:
    WEBCORE_EXPORT static Ref<TimeRanges> create();
    WEBCORE_EXPORT static Ref<TimeRanges> create(double start, double end);
    static Ref<TimeRanges> create(const PlatformTimeRanges&);

    WEBCORE_EXPORT ExceptionOr<double> start(unsigned index) const;
    WEBCORE_EXPORT ExceptionOr<double> end(unsigned index) const;

    WEBCORE_EXPORT Ref<TimeRanges> copy() const;
    void invert();
    WEBCORE_EXPORT void intersectWith(const TimeRanges&);
    void unionWith(const TimeRanges&);
    
    WEBCORE_EXPORT unsigned length() const;

    WEBCORE_EXPORT void add(double start, double end, AddTimeRangeOption = AddTimeRangeOption::None);
    bool contain(double time) const;
    
    size_t find(double time) const;
    WEBCORE_EXPORT double nearest(double time) const;
    double totalDuration() const;

    const PlatformTimeRanges& ranges() const { return m_ranges; }
    PlatformTimeRanges& ranges() { return m_ranges; }

private:
    WEBCORE_EXPORT TimeRanges();
    WEBCORE_EXPORT TimeRanges(double start, double end);
    explicit TimeRanges(const PlatformTimeRanges&);

    PlatformTimeRanges m_ranges;
};

} // namespace WebCore
