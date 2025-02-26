/*
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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

#include "RenderPtr.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

class HTMLPlugInElement;
class RenderElement;
class RenderStyle;
class RenderTreePosition;
class ShadowRoot;

class PluginReplacement : public RefCounted<PluginReplacement> {
public:
    virtual ~PluginReplacement() = default;

    virtual void installReplacement(ShadowRoot&) = 0;

    virtual bool willCreateRenderer() { return false; }
    virtual RenderPtr<RenderElement> createElementRenderer(HTMLPlugInElement&, RenderStyle&&, const RenderTreePosition&) = 0;
};

typedef Ref<PluginReplacement> (*CreatePluginReplacement)(HTMLPlugInElement&, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues);
typedef bool (*PluginReplacementSupportsType)(const String&);
typedef bool (*PluginReplacementSupportsFileExtension)(StringView);
typedef bool (*PluginReplacementSupportsURL)(const URL&);

class ReplacementPlugin {
public:
    ReplacementPlugin(CreatePluginReplacement constructor, PluginReplacementSupportsType supportsType, PluginReplacementSupportsFileExtension supportsFileExtension, PluginReplacementSupportsURL supportsURL)
        : m_constructor(constructor)
        , m_supportsType(supportsType)
        , m_supportsFileExtension(supportsFileExtension)
        , m_supportsURL(supportsURL)
    {
    }

    explicit ReplacementPlugin(const ReplacementPlugin& other)
        : m_constructor(other.m_constructor)
        , m_supportsType(other.m_supportsType)
        , m_supportsFileExtension(other.m_supportsFileExtension)
        , m_supportsURL(other.m_supportsURL)
    {
    }

    Ref<PluginReplacement> create(HTMLPlugInElement& element, const Vector<AtomString>& paramNames, const Vector<AtomString>& paramValues) const { return m_constructor(element, paramNames, paramValues); }
    bool supportsType(const String& mimeType) const { return m_supportsType(mimeType); }
    bool supportsFileExtension(StringView extension) const { return m_supportsFileExtension(extension); }
    bool supportsURL(const URL& url) const { return m_supportsURL(url); }

private:
    CreatePluginReplacement m_constructor;
    PluginReplacementSupportsType m_supportsType;
    PluginReplacementSupportsFileExtension m_supportsFileExtension;
    PluginReplacementSupportsURL m_supportsURL;
};

typedef void (*PluginReplacementRegistrar)(const ReplacementPlugin&);

}
