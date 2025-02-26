/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#include "Image.h"
#include "MediaUniqueIdentifier.h"
#include <wtf/URL.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct NowPlayingInfoArtwork {
    String src;
    String mimeType;
    RefPtr<Image> image;

    bool operator==(const NowPlayingInfoArtwork& other) const
    {
        return src == other.src && mimeType == other.mimeType;
    }
};

struct NowPlayingMetadata {
    String title;
    String artist;
    String album;
    String sourceApplicationIdentifier;
    std::optional<NowPlayingInfoArtwork> artwork;

    friend bool operator==(const NowPlayingMetadata&, const NowPlayingMetadata&) = default;
};

struct NowPlayingInfo {
    NowPlayingMetadata metadata;
    double duration { 0 };
    double currentTime { 0 };
    double rate { 1.0 };
    bool supportsSeeking { false };
    Markable<MediaUniqueIdentifier> uniqueIdentifier;
    bool isPlaying { false };
    bool allowsNowPlayingControlsVisibility { false };
    bool isVideo { false };

    friend bool operator==(const NowPlayingInfo&, const NowPlayingInfo&) = default;
};

} // namespace WebCore
