/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "Icon.h"
#include "RenderTheme.h"
#include <wtf/RetainPtr.h>

OBJC_CLASS NSDateComponentsFormatter;
struct AttachmentLayout;

namespace WebCore {

class RenderThemeCocoa : public RenderTheme {
public:
    WEBCORE_EXPORT static RenderThemeCocoa& singleton();

protected:
    virtual Color pictureFrameColor(const RenderObject&);
#if ENABLE(ATTACHMENT_ELEMENT)
    int attachmentBaseline(const RenderAttachment&) const final;
    void paintAttachmentText(GraphicsContext&, AttachmentLayout*) final;
#endif

    Color platformSpellingMarkerColor(OptionSet<StyleColorOptions>) const override;
    Color platformDictationAlternativesMarkerColor(OptionSet<StyleColorOptions>) const override;
    Color platformGrammarMarkerColor(OptionSet<StyleColorOptions>) const override;

private:
    void purgeCaches() override;

    bool shouldHaveCapsLockIndicator(const HTMLInputElement&) const final;

    void paintFileUploadIconDecorations(const RenderObject& inputRenderer, const RenderObject& buttonRenderer, const PaintInfo&, const IntRect&, Icon*, FileUploadDecorations) override;

    Seconds animationRepeatIntervalForProgressBar(const RenderProgress&) const final;

#if ENABLE(APPLE_PAY)
    void adjustApplePayButtonStyle(RenderStyle&, const Element*) const override;
#endif

#if ENABLE(VIDEO) && ENABLE(MODERN_MEDIA_CONTROLS)
    String mediaControlsStyleSheet() override;
    Vector<String, 2> mediaControlsScripts() override;
    String mediaControlsBase64StringForIconNameAndType(const String&, const String&) override;
    String mediaControlsFormattedStringForDuration(double) override;

    String m_mediaControlsLocalizedStringsScript;
    String m_mediaControlsScript;
    String m_mediaControlsStyleSheet;
    RetainPtr<NSDateComponentsFormatter> m_durationFormatter;
#endif // ENABLE(VIDEO) && ENABLE(MODERN_MEDIA_CONTROLS)
};

}
