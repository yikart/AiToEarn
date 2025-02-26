/*
 * Copyright (C) 2003, 2007, 2010, 2016 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DisabledAdaptations.h"
#include "FloatRect.h"
#include <wtf/Function.h>
#include <wtf/OptionSet.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct WindowFeatures {
    bool hasAdditionalFeatures { false };

    std::optional<float> x;
    std::optional<float> y;
    std::optional<float> width;
    std::optional<float> height;

    std::optional<bool> popup;
    std::optional<bool> menuBarVisible;
    std::optional<bool> statusBarVisible;
    std::optional<bool> toolBarVisible;
    std::optional<bool> locationBarVisible;
    std::optional<bool> scrollbarsVisible;
    std::optional<bool> resizable;

#if PLATFORM(GTK)
    FloatRect oldWindowRect { };
#endif

    std::optional<bool> fullscreen;
    std::optional<bool> dialog;
    std::optional<bool> noopener { std::nullopt };
    std::optional<bool> noreferrer { std::nullopt };

    Vector<String> additionalFeatures { };

    bool wantsNoOpener() const { return (noopener && *noopener) || (noreferrer && *noreferrer); }
    bool wantsNoReferrer() const { return (noreferrer && *noreferrer); }

    // Follow the HTML standard on how to parse the window features indicated here:
    // https://html.spec.whatwg.org/multipage/nav-history-apis.html#apis-for-creating-and-navigating-browsing-contexts-by-name
    bool wantsPopup() const
    {
        // If the WindowFeatures string contains nothing more than noopener and noreferrer we
        // consider the string to be empty and thus return false based on the algorithm above.
        if (!hasAdditionalFeatures
            && !x
            && !y
            && !width
            && !height
            && !popup
            && !menuBarVisible
            && !statusBarVisible
            && !toolBarVisible
            && !locationBarVisible
            && !scrollbarsVisible
            && !resizable)
            return false;

        // If popup is defined, return its value as a boolean.
        if (popup)
            return *popup;

        // If location (default to false) and toolbar (default to false) are false return true.
        if ((!locationBarVisible || !*locationBarVisible) && (!toolBarVisible || !*toolBarVisible))
            return true;

        // If menubar (default to false) is false return true.
        if (!menuBarVisible || !*menuBarVisible)
            return true;

        // If resizable (default to true) is false return true.
        if (resizable && !*resizable)
            return true;

        // If scrollbars (default to false) is false return false.
        if (!scrollbarsVisible || !*scrollbarsVisible)
            return true;

        // If status (default to false) is false return true.
        if (!statusBarVisible || !*statusBarVisible)
            return true;

        return false;
    }
};

WindowFeatures parseWindowFeatures(StringView windowFeaturesString);
WindowFeatures parseDialogFeatures(StringView dialogFeaturesString, const FloatRect& screenAvailableRect);
OptionSet<DisabledAdaptations> parseDisabledAdaptations(StringView);

enum class FeatureMode { Window, Viewport };
void processFeaturesString(StringView features, FeatureMode, const Function<void(StringView type, StringView value)>& callback);

} // namespace WebCore
