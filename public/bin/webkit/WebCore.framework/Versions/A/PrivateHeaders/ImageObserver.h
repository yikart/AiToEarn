/*
 * Copyright (C) 2004, 2005, 2006 Apple Inc.  All rights reserved.
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

#include "ImageTypes.h"
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/URL.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Image;
class IntRect;
class Settings;

// Interface for notification about changes to an image, including decoding,
// drawing, and animating.
class ImageObserver : public RefCountedAndCanMakeWeakPtr<ImageObserver> {
public:
    virtual ~ImageObserver() = default;

    virtual URL sourceUrl() const = 0;
    virtual String mimeType() const = 0;
    virtual unsigned numberOfClients() const { return 0; }
    virtual long long expectedContentLength() const = 0;

    virtual void encodedDataStatusChanged(const Image&, EncodedDataStatus) { };
    virtual void decodedSizeChanged(const Image&, long long delta) = 0;

    virtual void didDraw(const Image&) = 0;

    virtual bool canDestroyDecodedData(const Image&) const { return true; }
    virtual void imageFrameAvailable(const Image&, ImageAnimatingState, const IntRect* changeRect = nullptr, DecodingStatus = DecodingStatus::Invalid) = 0;
    virtual void changedInRect(const Image&, const IntRect* changeRect = nullptr) = 0;
    virtual void scheduleRenderingUpdate(const Image&) = 0;

    virtual bool allowsAnimation(const Image&) const { return true; }
    virtual const Settings* settings() { return nullptr; }

protected:
    ImageObserver() = default;
};

}
