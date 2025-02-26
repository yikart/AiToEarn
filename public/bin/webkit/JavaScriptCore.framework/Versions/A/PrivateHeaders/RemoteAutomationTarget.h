/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

#include "RemoteControllableTarget.h"
#include <wtf/text/WTFString.h>

namespace Inspector {

class FrontendChannel;

class RemoteAutomationTarget : public RemoteControllableTarget {
public:
    JS_EXPORT_PRIVATE RemoteAutomationTarget();
    JS_EXPORT_PRIVATE ~RemoteAutomationTarget() override;

    bool isPaired() const { return m_paired; }
    JS_EXPORT_PRIVATE void setIsPaired(bool);

    bool isPendingTermination() const { return m_pendingTermination; }
    void setIsPendingTermination() { m_pendingTermination = true; }

    virtual String name() const = 0;
    RemoteControllableTarget::Type type() const override { return RemoteControllableTarget::Type::Automation; }
    bool remoteControlAllowed() const override { return !m_paired; };

private:
    bool m_paired { false };
    bool m_pendingTermination { false };
};

} // namespace Inspector

SPECIALIZE_TYPE_TRAITS_CONTROLLABLE_TARGET(Inspector::RemoteAutomationTarget, Automation)

#endif // ENABLE(REMOTE_INSPECTOR)
