/*
 * Copyright (C) 2008-2023 Apple Inc. All Rights Reserved.
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

#include "StyleAppearance.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

enum class SelectionPart : bool {
    Background,
    Foreground
};

enum class ThemeFont : uint8_t {
    CaptionFont,
    IconFont,
    MenuFont,
    MessageBoxFont,
    SmallCaptionFont,
    StatusBarFont,
    MiniControlFont,
    SmallControlFont,
    ControlFont
};

enum class ThemeColor : uint8_t {
    ActiveBorderColor,
    ActiveCaptionColor,
    ActiveTextColor,
    AppWorkspaceColor,
    BackgroundColor,
    ButtonFaceColor,
    ButtonHighlightColor,
    ButtonShadowColor,
    ButtonTextColor,
    CanvasColor,
    CanvasTextColor,
    CaptionTextColor,
    FieldColor,
    FieldTextColor,
    GrayTextColor,
    HighlightColor,
    HighlightTextColor,
    InactiveBorderColor,
    InactiveCaptionColor,
    InactiveCaptionTextColor,
    InfoBackgroundColor,
    InfoTextColor,
    LinkTextColor,
    MatchColor,
    MenuTextColor,
    ScrollbarColor,
    ThreeDDarkShadowColor,
    ThreeDFaceColor,
    ThreeDHighlightColor,
    ThreeDLightShadowColor,
    ThreeDShadowColor,
    VisitedTextColor,
    WindowColor,
    WindowFrameColor,
    WindowTextColor,
    FocusRingColor
};

WTF::TextStream& operator<<(WTF::TextStream&, SelectionPart);
WTF::TextStream& operator<<(WTF::TextStream&, ThemeFont);
WTF::TextStream& operator<<(WTF::TextStream&, ThemeColor);

} // namespace WebCore
