/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if HAVE(SHAPE_DETECTION_API_IMPLEMENTATION) && HAVE(VISION)

#include "BarcodeDetectorInterface.h"
#include <wtf/HashFunctions.h>
#include <wtf/HashSet.h>
#include <wtf/HashTraits.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore::ShapeDetection {

struct BarcodeDetectorOptions;

class BarcodeDetectorImpl final : public BarcodeDetector {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(BarcodeDetectorImpl, WEBCORE_EXPORT);
public:
    static Ref<BarcodeDetectorImpl> create(const BarcodeDetectorOptions& barcodeDetectorOptions)
    {
        return adoptRef(*new BarcodeDetectorImpl(barcodeDetectorOptions));
    }

    virtual ~BarcodeDetectorImpl();

    WEBCORE_EXPORT static void getSupportedFormats(CompletionHandler<void(Vector<BarcodeFormat>&&)>&&);

    using BarcodeFormatSet = HashSet<BarcodeFormat, WTF::IntHash<BarcodeFormat>, WTF::StrongEnumHashTraits<BarcodeFormat>>;

private:
    WEBCORE_EXPORT BarcodeDetectorImpl(const BarcodeDetectorOptions&);

    BarcodeDetectorImpl(const BarcodeDetectorImpl&) = delete;
    BarcodeDetectorImpl(BarcodeDetectorImpl&&) = delete;
    BarcodeDetectorImpl& operator=(const BarcodeDetectorImpl&) = delete;
    BarcodeDetectorImpl& operator=(BarcodeDetectorImpl&&) = delete;

    void detect(Ref<ImageBuffer>&&, CompletionHandler<void(Vector<DetectedBarcode>&&)>&&) final;

    std::optional<BarcodeFormatSet> m_requestedBarcodeFormatSet;
};

} // namespace WebCore::ShapeDetection

#endif // HAVE(SHAPE_DETECTION_API_IMPLEMENTATION) && HAVE(VISION)
