/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class PasteboardItemPresentationStyle : uint8_t {
    Unspecified,
    Inline,
    Attachment
};

struct PresentationSize {
    std::optional<double> width;
    std::optional<double> height;
};

struct PasteboardItemInfo {
    Vector<String> pathsForFileUpload;
    Vector<String> platformTypesForFileUpload;
    Vector<String> platformTypesByFidelity;
    String suggestedFileName;
    PresentationSize preferredPresentationSize;
    bool isNonTextType { false };
    bool containsFileURLAndFileUploadContent { false };
    Vector<String> webSafeTypesByFidelity;
    PasteboardItemPresentationStyle preferredPresentationStyle { PasteboardItemPresentationStyle::Unspecified };

    String pathForContentType(const String& type) const
    {
        ASSERT(pathsForFileUpload.size() == platformTypesForFileUpload.size());
        auto index = platformTypesForFileUpload.find(type);
        if (index == notFound)
            return { };

        return pathsForFileUpload[index];
    }

    // The preferredPresentationStyle flag is platform API used by drag or copy sources to explicitly indicate
    // that the data being written to the item provider should be treated as an attachment; unfortunately, not
    // all clients attempt to set this flag, so we additionally take having a suggested filename as a strong
    // indicator that the item should be treated as an attachment or file.
    bool canBeTreatedAsAttachmentOrFile() const
    {
        switch (preferredPresentationStyle) {
        case PasteboardItemPresentationStyle::Inline:
            return false;
        case PasteboardItemPresentationStyle::Attachment:
            return true;
        case PasteboardItemPresentationStyle::Unspecified:
            return !suggestedFileName.isEmpty();
        }
        ASSERT_NOT_REACHED();
        return false;
    }

    String contentTypeForHighestFidelityItem() const
    {
        if (platformTypesForFileUpload.isEmpty())
            return { };

        return platformTypesForFileUpload.first();
    }

    String pathForHighestFidelityItem() const
    {
        if (pathsForFileUpload.isEmpty())
            return { };

        return pathsForFileUpload.first();
    }
};

}
