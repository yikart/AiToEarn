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

#if ENABLE(DATA_DETECTION)

#include "ImageOverlayDataDetectionResultIdentifier.h"
#include <wtf/HashMap.h>
#include <wtf/Noncopyable.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMallocInlines.h>

OBJC_CLASS DDScannerResult;
OBJC_CLASS NSArray;

namespace WebCore {

class DataDetectionResultsStorage {
    WTF_MAKE_NONCOPYABLE(DataDetectionResultsStorage);
    WTF_MAKE_TZONE_ALLOCATED_INLINE(DataDetectionResultsStorage);
public:
    DataDetectionResultsStorage() = default;

    void setDocumentLevelResults(NSArray *results) { m_documentLevelResults = results; }
    NSArray *documentLevelResults() const { return m_documentLevelResults.get(); }

    DDScannerResult *imageOverlayDataDetectionResult(ImageOverlayDataDetectionResultIdentifier identifier) { return m_imageOverlayResults.get(identifier).get(); }
    ImageOverlayDataDetectionResultIdentifier addImageOverlayDataDetectionResult(DDScannerResult *result)
    {
        auto newIdentifier = ImageOverlayDataDetectionResultIdentifier::generate();
        m_imageOverlayResults.set(newIdentifier, result);
        return newIdentifier;
    }

private:
    RetainPtr<NSArray> m_documentLevelResults;
    UncheckedKeyHashMap<ImageOverlayDataDetectionResultIdentifier, RetainPtr<DDScannerResult>> m_imageOverlayResults;
};

} // namespace WebCore

#endif // ENABLE(DATA_DETECTION)
