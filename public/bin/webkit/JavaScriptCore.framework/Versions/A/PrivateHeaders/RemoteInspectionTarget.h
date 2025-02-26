/*
 * Copyright (C) 2013-2023 Apple Inc. All Rights Reserved.
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

#if ENABLE(REMOTE_INSPECTOR)

#include "JSRemoteInspector.h"
#include "RemoteControllableTarget.h"
#include <wtf/ProcessID.h>
#include <wtf/RetainPtr.h>
#include <wtf/TypeCasts.h>
#include <wtf/text/WTFString.h>

namespace Inspector {

class FrontendChannel;

class RemoteInspectionTarget : public RemoteControllableTarget {
public:
    JS_EXPORT_PRIVATE RemoteInspectionTarget();
    JS_EXPORT_PRIVATE ~RemoteInspectionTarget() override;
    JS_EXPORT_PRIVATE bool inspectable() const;
    JS_EXPORT_PRIVATE void setInspectable(bool);

    bool allowsInspectionByPolicy() const;

#if USE(CF)
    CFRunLoopRef targetRunLoop() const final { return m_runLoop.get(); }
    void setTargetRunLoop(CFRunLoopRef runLoop) { m_runLoop = runLoop; }
#endif

    virtual String name() const { return String(); } // ITML JavaScript Page ServiceWorker WebPage
    virtual String url() const { return String(); } // Page ServiceWorker WebPage
    virtual const String& nameOverride() const { return nullString(); }
    virtual bool hasLocalDebugger() const = 0;

    virtual void setIndicating(bool) { } // Default is to do nothing.

    virtual bool automaticInspectionAllowed() const { return false; }
    JS_EXPORT_PRIVATE virtual void pauseWaitingForAutomaticInspection();
    JS_EXPORT_PRIVATE virtual void unpauseForInitializedInspector();

    // RemoteControllableTarget overrides.
    JS_EXPORT_PRIVATE bool remoteControlAllowed() const final;

    std::optional<ProcessID> presentingApplicationPID() const { return m_presentingApplicationPID; }
    JS_EXPORT_PRIVATE void setPresentingApplicationPID(std::optional<ProcessID>&&);

private:
    enum class Inspectable : uint8_t {
        Yes,
        No,

        // For WebKit internal proxies and wrappers, we want to always disable inspection even when internal policies
        // would otherwise enable inspection.
        NoIgnoringInternalPolicies,
    };
    Inspectable m_inspectable { JSRemoteInspectorGetInspectionFollowsInternalPolicies() ? Inspectable::No : Inspectable::NoIgnoringInternalPolicies };

#if USE(CF)
    RetainPtr<CFRunLoopRef> m_runLoop;
#endif

    std::optional<ProcessID> m_presentingApplicationPID;
};

} // namespace Inspector

SPECIALIZE_TYPE_TRAITS_BEGIN(Inspector::RemoteInspectionTarget)
    static bool isType(const Inspector::RemoteControllableTarget& target)
    {
        return target.type() != Inspector::RemoteControllableTarget::Type::Automation;
    }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(REMOTE_INSPECTOR)
