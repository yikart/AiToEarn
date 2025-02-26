/*
 * Copyright (C) 2012 Apple Inc. All Rights Reserved.
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

#include "LocalDOMWindow.h"
#include <wtf/CheckedRef.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class DOMWrapperWorld;
class LocalFrame;

class DOMWindowExtension final : public RefCounted<DOMWindowExtension>, public LocalDOMWindowObserver {
public:
    static Ref<DOMWindowExtension> create(LocalDOMWindow* window, DOMWrapperWorld& world)
    {
        return adoptRef(*new DOMWindowExtension(window, world));
    }

    WEBCORE_EXPORT ~DOMWindowExtension();

    void suspendForBackForwardCache() final;
    void resumeFromBackForwardCache() final;
    void willDestroyGlobalObjectInCachedFrame() final;
    void willDestroyGlobalObjectInFrame() final;
    void willDetachGlobalObjectFromFrame() final;

    WEBCORE_EXPORT LocalFrame* frame() const;
    RefPtr<LocalFrame> protectedFrame() const;
    DOMWrapperWorld& world() const { return m_world; }

private:
    WEBCORE_EXPORT DOMWindowExtension(LocalDOMWindow*, DOMWrapperWorld&);

    WeakPtr<LocalDOMWindow, WeakPtrImplWithEventTargetData> m_window;
    Ref<DOMWrapperWorld> m_world;
    RefPtr<LocalFrame> m_disconnectedFrame;
    bool m_wasDetached;
};

} // namespace WebCore
