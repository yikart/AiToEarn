/*
 * Copyright (C) 2006 Apple Inc.  All rights reserved.
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

#if ENABLE(CONTEXT_MENUS)

#include <wtf/Forward.h>

namespace WebCore {

class IntPoint;
class IntRect;
class LocalFrame;

#if HAVE(TRANSLATION_UI_SERVICES)
struct TranslationContextMenuInfo;
#endif

class ContextMenuClient {
public:
    virtual ~ContextMenuClient() = default;
    
    virtual void downloadURL(const URL&) = 0;
    virtual void searchWithGoogle(const LocalFrame*) = 0;
    virtual void lookUpInDictionary(LocalFrame*) = 0;
    virtual bool isSpeaking() const = 0;
    virtual void speak(const String&) = 0;
    virtual void stopSpeaking() = 0;

#if ENABLE(IMAGE_ANALYSIS)
    virtual bool supportsLookUpInImages() = 0;
#endif

#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
    virtual bool supportsCopySubject() = 0;
#endif

#if HAVE(TRANSLATION_UI_SERVICES)
    virtual void handleTranslation(const TranslationContextMenuInfo&) = 0;
#endif

#if PLATFORM(GTK)
    virtual void insertEmoji(LocalFrame&) = 0;
#endif

#if USE(ACCESSIBILITY_CONTEXT_MENUS)
    virtual void showContextMenu() = 0;
#endif
};

} // namespace WebCore

#endif // ENABLE(CONTEXT_MENUS)
