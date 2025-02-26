/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#if ENABLE(APPLICATION_MANIFEST)

#include "Color.h"
#include "ScreenOrientationLockType.h"
#include <optional>
#include <wtf/URL.h>
#include <wtf/Vector.h>

namespace WebCore {

struct ApplicationManifest {
    enum class Direction : uint8_t {
        Auto,
        LTR, // NOLINT
        RTL, // NOLINT
    };

    enum class Display : uint8_t {
        Browser,
        MinimalUI,
        Standalone,
        Fullscreen,
    };

    struct Icon {
        enum class Purpose : uint8_t {
            Any = 1 << 0,
            Monochrome = 1 << 1,
            Maskable = 1 << 2,
        };

        URL src;
        Vector<String> sizes;
        String type;
        OptionSet<Purpose> purposes;
    };

    struct Shortcut {
        String name;
        URL url;
        Vector<Icon> icons;
    };

    String rawJSON;
    Direction dir;
    String name;
    String shortName;
    String description;
    URL scope;
    bool isDefaultScope { false };
    Display display;
    std::optional<ScreenOrientationLockType> orientation;
    URL manifestURL;
    URL startURL;
    URL id;
    Color backgroundColor;
    Color themeColor;
    Vector<String> categories;
    Vector<Icon> icons;
    Vector<Shortcut> shortcuts;
};

} // namespace WebCore

#endif // ENABLE(APPLICATION_MANIFEST)

