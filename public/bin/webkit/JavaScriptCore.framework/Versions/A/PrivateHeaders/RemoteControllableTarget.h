/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if ENABLE(REMOTE_INSPECTOR)

#include "JSExportMacros.h"
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/TypeCasts.h>
#include <wtf/text/WTFString.h>

#if USE(CF)
#include <CoreFoundation/CFRunLoop.h>
#endif

namespace Inspector {

class FrontendChannel;

using TargetID = unsigned;

class JS_EXPORT_PRIVATE RemoteControllableTarget : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<RemoteControllableTarget> {
public:
    RemoteControllableTarget();
    virtual ~RemoteControllableTarget();

    void init();
    void update();

    virtual void connect(FrontendChannel&, bool isAutomaticConnection = false, bool immediatelyPause = false) = 0;
    virtual void disconnect(FrontendChannel&) = 0;

    TargetID targetIdentifier() const { return m_identifier; }
    void setTargetIdentifier(TargetID identifier) { m_identifier = identifier; }

    enum class Type {
        Automation,
        ITML,
        JavaScript,
        Page,
        ServiceWorker,
        WebPage,
    };
    virtual Type type() const = 0;
    virtual bool remoteControlAllowed() const = 0;
    virtual void dispatchMessageFromRemote(String&& message) = 0;

#if USE(CF)
    // The dispatch block will be scheduled on a global run loop if null is returned.
    virtual CFRunLoopRef targetRunLoop() const { return nullptr; }
#endif

private:
    TargetID m_identifier { 0 };
};

} // namespace Inspector

#define SPECIALIZE_TYPE_TRAITS_CONTROLLABLE_TARGET(ToClassName, ToClassType) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToClassName) \
    static bool isType(const Inspector::RemoteControllableTarget& target) { return target.type() == Inspector::RemoteControllableTarget::Type::ToClassType; } \
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(REMOTE_INSPECTOR)
