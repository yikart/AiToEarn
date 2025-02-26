/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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

#import "DataDetectorType.h"
#import "FloatRect.h"
#import "SimpleRange.h"
#import <wtf/OptionSet.h>

#import <wtf/RetainPtr.h>

#if HAVE(SECURE_ACTION_CONTEXT)
OBJC_CLASS DDSecureActionContext;
using WKDDActionContext = DDSecureActionContext;
#else
OBJC_CLASS DDActionContext;
using WKDDActionContext = DDActionContext;
#endif
OBJC_CLASS NSArray;
OBJC_CLASS NSDictionary;

typedef struct __DDResult *DDResultRef;
typedef struct __DDScanQuery *DDScanQueryRef;
typedef struct __DDScanner *DDScannerRef;

namespace WebCore {

class Document;
class HTMLDivElement;
class HTMLElement;
class HitTestResult;
class QualifiedName;
class LocalFrame;
struct TextRecognitionDataDetector;

struct DetectedItem {
    RetainPtr<WKDDActionContext> actionContext;
    FloatRect boundingBox;
    SimpleRange range;
};

class DataDetection {
public:
#if PLATFORM(MAC)
    WEBCORE_EXPORT static std::optional<DetectedItem> detectItemAroundHitTestResult(const HitTestResult&);
#endif
    WEBCORE_EXPORT static void detectContentInFrame(LocalFrame*, OptionSet<DataDetectorType>, std::optional<double>, CompletionHandler<void(NSArray *)>&&);
    WEBCORE_EXPORT static NSArray * detectContentInRange(const SimpleRange&, OptionSet<DataDetectorType>, std::optional<double> referenceDate);
    WEBCORE_EXPORT static std::optional<double> extractReferenceDate(NSDictionary *);
    WEBCORE_EXPORT static void removeDataDetectedLinksInDocument(Document&);
#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT static bool canBePresentedByDataDetectors(const URL&);
    WEBCORE_EXPORT static bool isDataDetectorLink(Element&);
    WEBCORE_EXPORT static String dataDetectorIdentifier(Element&);
    WEBCORE_EXPORT static bool canPresentDataDetectorsUIForElement(Element&);
    WEBCORE_EXPORT static bool requiresExtendedContext(Element&);
#endif
    WEBCORE_EXPORT static std::optional<std::pair<Ref<HTMLElement>, IntRect>> findDataDetectionResultElementInImageOverlay(const FloatPoint& location, const HTMLElement& imageOverlayHost);

#if ENABLE(IMAGE_ANALYSIS)
    static Ref<HTMLDivElement> createElementForImageOverlay(Document&, const TextRecognitionDataDetector&);
#endif

    static const String& dataDetectorURLProtocol();
    static bool isDataDetectorURL(const URL&);
    static bool isDataDetectorAttribute(const QualifiedName&);
    static bool isDataDetectorElement(const Element&);
};

} // namespace WebCore

#endif
