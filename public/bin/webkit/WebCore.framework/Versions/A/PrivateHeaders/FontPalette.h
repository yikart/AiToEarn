/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include <variant>
#include <wtf/Hasher.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/TextStream.h>

namespace WebCore {

struct FontPalette {
    bool operator==(const FontPalette& other) const
    {
        if (type == Type::Custom)
            return other.type == Type::Custom && identifier == other.identifier;
        return type == other.type;
    }

    enum class Type : uint8_t {
        Normal,
        Light,
        Dark,
        Custom
    } type;

    AtomString identifier;
};

inline void add(Hasher& hasher, const FontPalette& request)
{
    add(hasher, request.type);
    if (request.type == FontPalette::Type::Custom)
        add(hasher, request.identifier);
}

inline TextStream& operator<<(TextStream& ts, const FontPalette& fontPalette)
{
    switch (fontPalette.type) {
    case FontPalette::Type::Normal:
        ts << "normal";
        break;
    case FontPalette::Type::Light:
        ts << "light";
        break;
    case FontPalette::Type::Dark:
        ts << "dark";
        break;
    case FontPalette::Type::Custom:
        ts << "custom: " << fontPalette.identifier;
        break;
    }
    return ts;
}

}
