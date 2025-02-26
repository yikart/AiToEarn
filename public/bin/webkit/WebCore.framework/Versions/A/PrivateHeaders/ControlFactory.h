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

#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ApplePayButtonPart;
class ButtonPart;
class ColorWellPart;
class ImageControlsButtonPart;
class InnerSpinButtonPart;
class MeterPart;
class MenuListButtonPart;
class MenuListPart;
class PlatformControl;
class ProgressBarPart;
class SearchFieldCancelButtonPart;
class SearchFieldPart;
class SearchFieldResultsPart;
class SliderThumbPart;
class SliderTrackPart;
class SwitchThumbPart;
class SwitchTrackPart;
class TextAreaPart;
class TextFieldPart;
class ToggleButtonPart;

class ControlFactory : public RefCounted<ControlFactory> {
    WTF_MAKE_TZONE_ALLOCATED(ControlFactory);
public:
    virtual ~ControlFactory() = default;

    WEBCORE_EXPORT static RefPtr<ControlFactory> create();
    WEBCORE_EXPORT static ControlFactory& shared();

#if ENABLE(APPLE_PAY)
    virtual std::unique_ptr<PlatformControl> createPlatformApplePayButton(ApplePayButtonPart&) = 0;
#endif
    virtual std::unique_ptr<PlatformControl> createPlatformButton(ButtonPart&) = 0;
#if ENABLE(INPUT_TYPE_COLOR)
    virtual std::unique_ptr<PlatformControl> createPlatformColorWell(ColorWellPart&) = 0;
#endif
#if ENABLE(SERVICE_CONTROLS)
    virtual std::unique_ptr<PlatformControl> createPlatformImageControlsButton(ImageControlsButtonPart&) = 0;
#endif
    virtual std::unique_ptr<PlatformControl> createPlatformInnerSpinButton(InnerSpinButtonPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformMenuList(MenuListPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformMenuListButton(MenuListButtonPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformMeter(MeterPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformProgressBar(ProgressBarPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSearchField(SearchFieldPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSearchFieldCancelButton(SearchFieldCancelButtonPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSearchFieldResults(SearchFieldResultsPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSliderThumb(SliderThumbPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSliderTrack(SliderTrackPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSwitchThumb(SwitchThumbPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformSwitchTrack(SwitchTrackPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformTextArea(TextAreaPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformTextField(TextFieldPart&) = 0;
    virtual std::unique_ptr<PlatformControl> createPlatformToggleButton(ToggleButtonPart&) = 0;

protected:
    ControlFactory() = default;
};

} // namespace WebCore
