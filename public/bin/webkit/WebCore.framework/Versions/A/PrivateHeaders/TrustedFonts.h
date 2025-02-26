/*
* Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/RobinHoodHashSet.h>

namespace WebCore {

// This setting is used to define which types of fonts are trusted to be downloaded and loaded into the system
// using the default, possibly-unsafe font parser.
// Any: any font binary will be downloaded, no checks will be done during load.
// Restricted: any font binary will be downloaded but just binaries listed by WebKit are trusted to load through the system font parser. A not allowed binary will be deleted after the check is done.
// SafeFontParser: any font binary will be downloaded. Binaries listed by WebKit are trusted to load through the safe font parser.
// None: No font binary will be downloaded or loaded.
enum class DownloadableBinaryFontTrustedTypes : uint8_t {
    Any,
    Restricted,
    SafeFontParser,
    None
};

// Identifies the policy to respect for loading font binaries.
// Deny: do not load the font binary.
// LoadWithSystemFontParser: font can be loaded with the possibly-unsafe system font parser.
// LoadWithSafeFontParser: font can be loaded with a safe font parser (with no fallback on the system font parser).
enum class FontParsingPolicy : uint8_t {
    Deny,
    LoadWithSystemFontParser,
    LoadWithSafeFontParser,
};

FontParsingPolicy fontBinaryParsingPolicy(std::span<const uint8_t>, DownloadableBinaryFontTrustedTypes);

} // namespace WebCore
