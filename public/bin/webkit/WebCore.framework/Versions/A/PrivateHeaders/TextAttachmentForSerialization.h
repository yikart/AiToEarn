/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA)

#include "Image.h"
#include <wtf/RefPtr.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct TextAttachmentMissingImage {
};

struct TextAttachmentFileWrapper {
#if !PLATFORM(IOS_FAMILY)
    bool ignoresOrientation = false;
#endif
    String preferredFilename;
    RetainPtr<CFDataRef> data;
    String accessibilityLabel;
};

#if ENABLE(MULTI_REPRESENTATION_HEIC)

struct MultiRepresentationHEICAttachmentSingleImage {
    RefPtr<Image> image;
    FloatSize size;
};

struct MultiRepresentationHEICAttachmentData {
    String identifier;
    String description;
    String credit;
    String digitalSourceType;
    Vector<MultiRepresentationHEICAttachmentSingleImage> images;

    // Not serialized.
    // FIXME: Remove this once same-process AttributedString to NSAttributeedString conversion
    // is removed. See https://bugs.webkit.org/show_bug.cgi?id=269384.
    RetainPtr<CFDataRef> data { };
};

#endif

} // namespace WebCore

#endif // PLATFORM(COCOA)
