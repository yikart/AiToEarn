/*
 * Copyright (C) 2007 Apple Inc. All rights reserved.
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

#include "Timer.h"
#include <JavaScriptCore/DeleteAllCodeEffort.h>
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
class VM;
}

namespace WebCore {

class GCController {
    WTF_MAKE_TZONE_ALLOCATED(GCController);
    WTF_MAKE_NONCOPYABLE(GCController);
    friend class WTF::NeverDestroyed<GCController>;
public:
    WEBCORE_EXPORT static GCController& singleton();
    WEBCORE_EXPORT static void dumpHeapForVM(JSC::VM&);

    // Do nothing since this is a singleton.
    void ref() const { }
    void deref() const { }

    WEBCORE_EXPORT void garbageCollectSoon();
    WEBCORE_EXPORT void garbageCollectNow(); // It's better to call garbageCollectSoon, unless you have a specific reason not to.
    WEBCORE_EXPORT void garbageCollectNowIfNotDoneRecently();
    void garbageCollectOnNextRunLoop();

    WEBCORE_EXPORT void garbageCollectOnAlternateThreadForDebugging(bool waitUntilDone); // Used for stress testing.
    WEBCORE_EXPORT void setJavaScriptGarbageCollectorTimerEnabled(bool);
    WEBCORE_EXPORT void deleteAllCode(JSC::DeleteAllCodeEffort);
    WEBCORE_EXPORT void deleteAllLinkedCode(JSC::DeleteAllCodeEffort);

    WEBCORE_EXPORT void dumpHeap();

private:
    GCController(); // Use singleton() instead.

    void gcTimerFired();
    Timer m_GCTimer;
};

} // namespace WebCore
