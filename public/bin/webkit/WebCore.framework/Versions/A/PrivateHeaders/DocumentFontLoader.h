/*
 * Copyright (C) 2021 Metrological Group B.V.
 * Copyright (C) 2021 Igalia S.L.
 * Copyright (C) 2007, 2008, 2011 Apple Inc. All rights reserved.
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

#include "CachedResourceHandle.h"
#include "Document.h"
#include "Timer.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class CachedFont;

class DocumentFontLoader {
    WTF_MAKE_TZONE_ALLOCATED(DocumentFontLoader);
public:
    DocumentFontLoader(Document&);
    ~DocumentFontLoader();

    void ref() const;
    void deref() const;

    CachedFont* cachedFont(URL&&, bool, bool, LoadedFromOpaqueSource);
    void beginLoadingFontSoon(CachedFont&);

    void loadPendingFonts();
    void stopLoadingAndClearFonts();

    void suspendFontLoading();
    void resumeFontLoading();

private:
    void fontLoadingTimerFired();

    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;
    Timer m_fontLoadingTimer;
    Vector<CachedResourceHandle<CachedFont>> m_fontsToBeginLoading;
    bool m_isFontLoadingSuspended { false };
    bool m_isStopped { false };
};

} // namespace WebCore
