/*
 * Copyright (C) 2006, 2007, 2008, 2009, 2011 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) Research In Motion Limited 2009. All rights reserved.
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

#include "FrameLoader.h"
#include <wtf/WeakRef.h>

namespace WebCore {

class Document;
class HTMLFrameOwnerElement;
class HTMLMediaElement;
class HTMLPlugInImageElement;
class IntSize;
class LocalFrame;
class Widget;

// This is a slight misnomer. It handles the higher level logic of loading both subframes and plugins.
class FrameLoader::SubframeLoader {
    WTF_MAKE_NONCOPYABLE(SubframeLoader); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    explicit SubframeLoader(LocalFrame&);

    void clear();

    void createFrameIfNecessary(HTMLFrameOwnerElement&, const AtomString& frameName);
    bool requestFrame(HTMLFrameOwnerElement&, const String& url, const AtomString& frameName, LockHistory = LockHistory::Yes, LockBackForwardList = LockBackForwardList::Yes);
    bool requestObject(HTMLPlugInImageElement&, const String& url, const AtomString& frameName,
        const String& serviceType, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues);

    bool containsPlugins() const { return m_containsPlugins; }
    
    bool resourceWillUsePlugin(const String& url, const String& mimeType);

private:
    bool requestPlugin(HTMLPlugInImageElement&, const URL&, const String& serviceType, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues, bool useFallback);
    LocalFrame* loadOrRedirectSubframe(HTMLFrameOwnerElement&, const URL&, const AtomString& frameName, LockHistory, LockBackForwardList);
    RefPtr<LocalFrame> loadSubframe(HTMLFrameOwnerElement&, const URL&, const AtomString& name, const URL& referrer);
    bool loadPlugin(HTMLPlugInImageElement&, const URL&, const String& mimeType, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues, bool useFallback);

    bool shouldUsePlugin(const URL&, const String& mimeType, bool hasFallback, bool& useFallback);
    bool pluginIsLoadable(const URL&, const HTMLPlugInImageElement&, const String& mimeType) const;

    URL completeURL(const String&) const;

    bool shouldConvertInvalidURLsToBlank() const;
    Ref<LocalFrame> protectedFrame() const;

    bool m_containsPlugins { false };
    WeakRef<LocalFrame> m_frame;
};

} // namespace WebCore
