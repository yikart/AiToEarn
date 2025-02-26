/*
 * Copyright (C) 2008-2022 Apple Inc. All Rights Reserved.
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

namespace WTF {
class TextStream;
}

namespace WebCore {

// Must follow CSSValueKeywords.in order
enum class StyleAppearance : uint8_t {
    None,
    Auto,
    Base,
    Checkbox,
    Radio,
    PushButton,
    SquareButton,
    Button,
    DefaultButton,
    Listbox,
    Menulist,
    MenulistButton,
    Meter,
    ProgressBar,
    SliderHorizontal,
    SliderVertical,
    SearchField,
#if ENABLE(APPLE_PAY)
    ApplePayButton,
#endif
#if ENABLE(ATTACHMENT_ELEMENT)
    Attachment,
    BorderlessAttachment,
#endif
    TextArea,
    TextField,
    // Internal-only Values
#if ENABLE(INPUT_TYPE_COLOR)
    ColorWell,
#endif
#if ENABLE(SERVICE_CONTROLS)
    ImageControlsButton,
#endif
    InnerSpinButton,
#if ENABLE(DATALIST_ELEMENT)
    ListButton,
#endif
    SearchFieldDecoration,
    SearchFieldResultsDecoration,
    SearchFieldResultsButton,
    SearchFieldCancelButton,
    SliderThumbHorizontal,
    SliderThumbVertical,
    Switch,
    SwitchThumb,
    SwitchTrack
};

WTF::TextStream& operator<<(WTF::TextStream&, StyleAppearance);

} // namespace WebCore
