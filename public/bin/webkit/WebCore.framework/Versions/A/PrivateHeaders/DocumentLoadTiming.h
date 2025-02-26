/*
 * Copyright (C) 2021 Apple Inc.  All rights reserved.
 * Copyright (C) 2010 Google, Inc. All Rights Reserved.
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
 * THIS SOFTWARE IS PROVIDED BY GOOGLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL GOOGLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ResourceLoadTiming.h"

namespace WebCore {

class DocumentLoadTiming : public ResourceLoadTiming {
public:
    // https://www.w3.org/TR/hr-time-2/#dfn-time-origin
    MonotonicTime timeOrigin() const { return startTime(); }

    void markUnloadEventStart() { m_unloadEventStart = MonotonicTime::now(); }
    void markUnloadEventEnd() { m_unloadEventEnd = MonotonicTime::now(); }
    void setLoadEventStart(MonotonicTime time) { m_loadEventStart = time; }
    void setLoadEventEnd(MonotonicTime time) { m_loadEventEnd = time; }

    void setHasSameOriginAsPreviousDocument(bool value) { m_hasSameOriginAsPreviousDocument = value; }

    MonotonicTime unloadEventStart() const { return m_unloadEventStart; }
    MonotonicTime unloadEventEnd() const { return m_unloadEventEnd; }
    MonotonicTime loadEventStart() const { return m_loadEventStart; }
    MonotonicTime loadEventEnd() const { return m_loadEventEnd; }
    bool hasSameOriginAsPreviousDocument() const { return m_hasSameOriginAsPreviousDocument; }

private:
    MonotonicTime m_unloadEventStart;
    MonotonicTime m_unloadEventEnd;
    MonotonicTime m_loadEventStart;
    MonotonicTime m_loadEventEnd;
    bool m_hasSameOriginAsPreviousDocument { false };
};

} // namespace WebCore
