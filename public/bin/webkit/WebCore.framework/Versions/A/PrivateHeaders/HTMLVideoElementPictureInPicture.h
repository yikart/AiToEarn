/*
 * Copyright (C) 2019 Carlos Eduardo Ramalho <cadubentzen@gmail.com>.
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(PICTURE_IN_PICTURE_API)

#include "PictureInPictureObserver.h"
#include "Supplementable.h"
#include <wtf/LoggerHelper.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class DeferredPromise;
class HTMLVideoElement;
class PictureInPictureWindow;

class HTMLVideoElementPictureInPicture
    : public Supplement<HTMLVideoElement>
    , public PictureInPictureObserver
#if !RELEASE_LOG_DISABLED
    , private LoggerHelper
#endif
{
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLVideoElementPictureInPicture);
public:
    HTMLVideoElementPictureInPicture(HTMLVideoElement&);
    static HTMLVideoElementPictureInPicture* from(HTMLVideoElement&);
    static void providePictureInPictureTo(HTMLVideoElement&);
    virtual ~HTMLVideoElementPictureInPicture();

    static void requestPictureInPicture(HTMLVideoElement&, Ref<DeferredPromise>&&);
    static bool autoPictureInPicture(HTMLVideoElement&);
    static void setAutoPictureInPicture(HTMLVideoElement&, bool);
    static bool disablePictureInPicture(HTMLVideoElement&);
    static void setDisablePictureInPicture(HTMLVideoElement&, bool);

    void exitPictureInPicture(Ref<DeferredPromise>&&);

    void didEnterPictureInPicture(const IntSize&);
    void didExitPictureInPicture();
    void pictureInPictureWindowResized(const IntSize&);

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const final { return "HTMLVideoElementPictureInPicture"_s; }
    WTFLogChannel& logChannel() const final;
#endif

private:
    static ASCIILiteral supplementName() { return "HTMLVideoElementPictureInPicture"_s; }

    bool m_autoPictureInPicture { false };
    bool m_disablePictureInPicture { false };

    WeakRef<HTMLVideoElement> m_videoElement;
    RefPtr<PictureInPictureWindow> m_pictureInPictureWindow;
    RefPtr<DeferredPromise> m_enterPictureInPicturePromise;
    RefPtr<DeferredPromise> m_exitPictureInPicturePromise;

#if !RELEASE_LOG_DISABLED
    Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
#endif
};

} // namespace WebCore

#endif // ENABLE(PICTURE_IN_PICTURE_API)
