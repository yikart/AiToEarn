/*
 * Copyright (C) 2021 Metrological Group B.V.
 * Copyright (C) 2021 Igalia S.L.
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CachedFont.h"
#include "CachedFontClient.h"
#include "CachedResourceHandle.h"
#include "FontLoadRequest.h"
#include "FontSelectionAlgorithm.h"
#include "ScriptExecutionContext.h"
#include <wtf/text/MakeString.h>

namespace WebCore {

class FontCreationContext;

class CachedFontLoadRequest final : public FontLoadRequest, public CachedFontClient {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    CachedFontLoadRequest(CachedFont& font, ScriptExecutionContext& context)
        : m_font(&font)
        , m_context(context)
    {
    }

    ~CachedFontLoadRequest()
    {
        if (m_fontLoadRequestClient)
            protectedCachedFont()->removeClient(*this);
    }

    CachedFont& cachedFont() const { return *m_font; }
    CachedResourceHandle<CachedFont> protectedCachedFont() const { return m_font; }

private:
    const URL& url() const final { return m_font->url(); }
    bool isPending() const final { return m_font->status() == CachedResource::Status::Pending; }
    bool isLoading() const final { return m_font->isLoading(); }
    bool errorOccurred() const final { return m_font->errorOccurred(); }

    bool ensureCustomFontData() final
    {
        bool result = m_font->ensureCustomFontData();
        if (!result && m_font->didRefuseToParseCustomFontWithSafeFontParser()) {
            if (RefPtr context = m_context.get()) {
                auto message = makeString("[Lockdown Mode] This font wasn't parsed: "_s, m_font->url().string());
                context->addConsoleMessage(MessageSource::Security, MessageLevel::Info, message);
            }
        }
        return result;
    }

    RefPtr<Font> createFont(const FontDescription& description, bool syntheticBold, bool syntheticItalic, const FontCreationContext& fontCreationContext) final
    {
        return protectedCachedFont()->createFont(description, syntheticBold, syntheticItalic, fontCreationContext);
    }

    void setClient(FontLoadRequestClient* client) final
    {
        WeakPtr oldClient = m_fontLoadRequestClient;
        m_fontLoadRequestClient = client;

        if (!client && oldClient)
            protectedCachedFont()->removeClient(*this);
        else if (client && !oldClient)
            protectedCachedFont()->addClient(*this);
    }

    bool isCachedFontLoadRequest() const final { return true; }

    void fontLoaded(CachedFont& font) final
    {
        if (m_fontLoadedProcessed)
            return;

        m_fontLoadedProcessed = true;
        ASSERT_UNUSED(font, &font == m_font.get());
        if (m_fontLoadRequestClient)
            m_fontLoadRequestClient->fontLoaded(*this); // fontLoaded() might destroy this object. Don't deref its members after it.
    }

    CachedResourceHandle<CachedFont> m_font;
    WeakPtr<FontLoadRequestClient> m_fontLoadRequestClient;
    WeakPtr<ScriptExecutionContext> m_context;
    bool m_fontLoadedProcessed { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FONTLOADREQUEST(WebCore::CachedFontLoadRequest, isCachedFontLoadRequest())
