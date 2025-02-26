/*
 * Copyright (C) 2011 Google, Inc. All Rights Reserved.
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

#include <wtf/CheckedRef.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class FrameDestructionObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::FrameDestructionObserver> : std::true_type { };
}

namespace WebCore {

class LocalFrame;

class FrameDestructionObserver : public CanMakeWeakPtr<FrameDestructionObserver> {
public:
    WEBCORE_EXPORT explicit FrameDestructionObserver(LocalFrame*);

    WEBCORE_EXPORT virtual void frameDestroyed();
    WEBCORE_EXPORT virtual void willDetachPage();

    inline LocalFrame* frame() const; // Defined in FrameDestructionObserverInlines.h.
    inline RefPtr<LocalFrame> protectedFrame() const; // Defined in FrameDestructionObserverInlines.h.

protected:
    WEBCORE_EXPORT virtual ~FrameDestructionObserver();
    WEBCORE_EXPORT void observeFrame(LocalFrame*);

    WeakPtr<LocalFrame> m_frame;
};

} // namespace WebCore
