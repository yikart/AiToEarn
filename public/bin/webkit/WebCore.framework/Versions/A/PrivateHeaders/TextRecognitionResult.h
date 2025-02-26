/*
 * Copyright (C) 2021 Apple Inc.  All rights reserved.
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

#if ENABLE(IMAGE_ANALYSIS)

#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
OBJC_CLASS NSAttributedString;
OBJC_CLASS NSData;
OBJC_CLASS VKCImageAnalysis;
#endif

#if ENABLE(DATA_DETECTION)
OBJC_CLASS DDScannerResult;
#endif

#include "FloatQuad.h"
#include <wtf/RetainPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct CharacterRange;

struct TextRecognitionWordData {
    TextRecognitionWordData(const String& theText, FloatQuad&& quad, bool leadingWhitespace)
        : text(theText)
        , normalizedQuad(WTFMove(quad))
        , hasLeadingWhitespace(leadingWhitespace)
    {
    }

    String text;
    FloatQuad normalizedQuad;
    bool hasLeadingWhitespace { true };
};

struct TextRecognitionLineData {
    TextRecognitionLineData(FloatQuad&& quad, Vector<TextRecognitionWordData>&& theChildren, bool newline, bool isVertical)
        : normalizedQuad(WTFMove(quad))
        , children(WTFMove(theChildren))
        , hasTrailingNewline(newline)
        , isVertical(isVertical)
    {
    }

    FloatQuad normalizedQuad;
    Vector<TextRecognitionWordData> children;
    bool hasTrailingNewline { true };
    bool isVertical { false };
};

#if ENABLE(DATA_DETECTION)

struct TextRecognitionDataDetector {
    TextRecognitionDataDetector() = default;
    TextRecognitionDataDetector(RetainPtr<DDScannerResult>&& scannerResult, Vector<FloatQuad>&& quads)
        : result(WTFMove(scannerResult))
        , normalizedQuads(WTFMove(quads))
    {
    }

    RetainPtr<DDScannerResult> result;
    Vector<FloatQuad> normalizedQuads;
};

#endif // ENABLE(DATA_DETECTION)

struct TextRecognitionBlockData {
    TextRecognitionBlockData(const String& theText, FloatQuad&& quad)
        : text(theText)
        , normalizedQuad(WTFMove(quad))
    {
    }

    String text;
    FloatQuad normalizedQuad;
};

struct TextRecognitionResult {
    Vector<TextRecognitionLineData> lines;

#if ENABLE(DATA_DETECTION)
    Vector<TextRecognitionDataDetector> dataDetectors;
#endif

    Vector<TextRecognitionBlockData> blocks;

#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
    RetainPtr<NSData> imageAnalysisData;

    WEBCORE_EXPORT static RetainPtr<NSData> encodeVKCImageAnalysis(RetainPtr<VKCImageAnalysis>);
    WEBCORE_EXPORT static RetainPtr<VKCImageAnalysis> decodeVKCImageAnalysis(RetainPtr<NSData>);
#endif

    bool isEmpty() const
    {
        if (!lines.isEmpty())
            return false;

#if ENABLE(DATA_DETECTION)
        if (!dataDetectors.isEmpty())
            return false;
#endif

        if (!blocks.isEmpty())
            return false;

        return true;
    }
};

#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
RetainPtr<NSAttributedString> stringForRange(const TextRecognitionResult&, const CharacterRange&);
#endif

} // namespace WebCore

#endif // ENABLE(IMAGE_ANALYSIS)
