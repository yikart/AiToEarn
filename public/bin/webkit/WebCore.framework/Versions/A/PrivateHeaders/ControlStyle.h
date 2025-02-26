/*
 * Copyright (C) 2022-2023 Apple Inc. All Rights Reserved.
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

#include "Color.h"
#include "LengthBox.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

struct ControlStyle {
    enum class State {
        Hovered             = 1 << 0,
        Pressed             = 1 << 1,
        Focused             = 1 << 2,
        Enabled             = 1 << 3,
        Checked             = 1 << 4,
        Default             = 1 << 5,
        WindowActive        = 1 << 6,
        Indeterminate       = 1 << 7,
        SpinUp              = 1 << 8, // Sub-state for HoverState and PressedState.
        Presenting          = 1 << 9,
        FormSemanticContext = 1 << 10,
        DarkAppearance      = 1 << 11,
        RightToLeft         = 1 << 12,
        LargeControls       = 1 << 13,
        ReadOnly            = 1 << 14,
        ListButton          = 1 << 15,
        ListButtonPressed   = 1 << 16,
        VerticalWritingMode = 1 << 17,
    };
    OptionSet<State> states;
    float fontSize { 12 };
    float zoomFactor { 1 };
    Color accentColor;
    Color textColor;
    FloatBoxExtent borderWidth;
};

WEBCORE_EXPORT TextStream& operator<<(TextStream&, ControlStyle::State);
WEBCORE_EXPORT TextStream& operator<<(TextStream&, const ControlStyle&);

} // namespace WebCore
