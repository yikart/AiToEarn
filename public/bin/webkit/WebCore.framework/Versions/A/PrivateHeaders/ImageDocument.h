/*
 * Copyright (C) 2006, 2007, 2008, 2009, 2014 Apple Inc. All rights reserved.
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
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "HTMLDocument.h"

namespace WebCore {

class ImageDocumentElement;
class HTMLImageElement;

class ImageDocument final : public HTMLDocument {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ImageDocument);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ImageDocument);
public:
    static Ref<ImageDocument> create(LocalFrame& frame, const URL& url)
    {
        auto document = adoptRef(*new ImageDocument(frame, url));
        document->addToContextsMap();
        return document;
    }

    WEBCORE_EXPORT HTMLImageElement* imageElement() const;

    void updateDuringParsing();
    void finishedParsing();

    void disconnectImageElement() { m_imageElement = nullptr; }

#if !PLATFORM(IOS_FAMILY)
    void imageClicked(int x, int y);
#endif

private:
    ImageDocument(LocalFrame&, const URL&);

    Ref<DocumentParser> createParser() override;

    LayoutSize imageSize();

    void createDocumentStructure();
#if !PLATFORM(IOS_FAMILY)
    void resizeImageToFit();
    void restoreImageSize();
    bool imageFitsInWindow();
    float scale();
    void didChangeViewSize() final;
#endif

    void imageUpdated();

    WeakPtr<ImageDocumentElement, WeakPtrImplWithEventTargetData> m_imageElement;

    // Whether enough of the image has been loaded to determine its size.
    bool m_imageSizeIsKnown;

#if !PLATFORM(IOS_FAMILY)
    // Whether the image is shrunk to fit or not.
    bool m_didShrinkImage;
#endif

    // Whether the image should be shrunk or not.
    bool m_shouldShrinkImage;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ImageDocument)
    static bool isType(const WebCore::Document& document) { return document.isImageDocument(); }
    static bool isType(const WebCore::Node& node)
    {
        auto* document = dynamicDowncast<WebCore::Document>(node);
        return document && isType(*document);
    }
SPECIALIZE_TYPE_TRAITS_END()
