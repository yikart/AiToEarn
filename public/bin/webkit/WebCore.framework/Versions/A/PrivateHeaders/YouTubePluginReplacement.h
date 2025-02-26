/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "PluginReplacement.h"
#include <wtf/HashMap.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

class WeakPtrImplWithEventTargetData;
class YouTubeEmbedShadowElement;

class YouTubePluginReplacement final : public PluginReplacement {
public:
    static void registerPluginReplacement(PluginReplacementRegistrar);

    WEBCORE_EXPORT static AtomString youTubeURLFromAbsoluteURL(const URL& srcURL, const AtomString& srcString);

private:
    YouTubePluginReplacement(HTMLPlugInElement&, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues);
    virtual ~YouTubePluginReplacement();

    static Ref<PluginReplacement> create(HTMLPlugInElement&, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues);

    static bool supportsMIMEType(const String&);
    static bool supportsFileExtension(StringView);
    static bool supportsURL(const URL&);

    void installReplacement(ShadowRoot&) final;

    AtomString youTubeURL(const AtomString& rawURL);

    bool willCreateRenderer() final { return m_embedShadowElement; }
    RenderPtr<RenderElement> createElementRenderer(HTMLPlugInElement&, RenderStyle&&, const RenderTreePosition&) final;

    WeakPtr<HTMLPlugInElement, WeakPtrImplWithEventTargetData> m_parentElement;
    RefPtr<YouTubeEmbedShadowElement> m_embedShadowElement;
    HashMap<AtomString, AtomString> m_attributes;
};

}
