/*
 * Copyright (C) 2010-2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSRunLoopTimer.h"
#include "Synchronousness.h"
#include <wtf/RefPtr.h>

namespace JSC {

class FullGCActivityCallback;
class Heap;

class GCActivityCallback : public JSRunLoopTimer {
public:
    using Base = JSRunLoopTimer;

    JS_EXPORT_PRIVATE GCActivityCallback(Heap&, Synchronousness);
    JS_EXPORT_PRIVATE ~GCActivityCallback();

    JS_EXPORT_PRIVATE void doWork(VM&) override;

    virtual void doCollection(VM&) = 0;

    void didAllocate(Heap&, size_t);
    void willCollect();
    JS_EXPORT_PRIVATE void cancel();
    bool isEnabled() const { return m_enabled; }
    void setEnabled(bool enabled) { m_enabled = enabled; }
    bool didGCRecently() const { return m_didGCRecently; }
    void setDidGCRecently(bool didGCRecently) { m_didGCRecently = didGCRecently; }

    static bool s_shouldCreateGCTimer;

protected:
    virtual Seconds lastGCLength(Heap&) = 0;
    virtual double gcTimeSlice(size_t bytes) = 0;
    virtual double deathRate(Heap&) = 0;
    JS_EXPORT_PRIVATE void scheduleTimer(Seconds);

    GCActivityCallback(VM&, Synchronousness);

    Synchronousness m_synchronousness { Synchronousness::Async };
    bool m_enabled { true };
    bool m_didGCRecently { false };
    Seconds m_delay { s_decade };
};

} // namespace JSC
