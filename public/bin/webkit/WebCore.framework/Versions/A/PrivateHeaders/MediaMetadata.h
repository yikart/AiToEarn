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

#if ENABLE(MEDIA_SESSION)

#include "CachedImageClient.h"
#include "CachedResourceHandle.h"
#include "MediaMetadataInit.h"
#include "MediaSession.h"
#include <wtf/CheckedRef.h>
#include <wtf/Function.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/URL.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class CachedImage;
class Document;
class Image;
class WeakPtrImplWithEventTargetData;
struct MediaImage;

using MediaSessionMetadata = MediaMetadataInit;

class ArtworkImageLoader final : public CachedImageClient {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ArtworkImageLoader, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ArtworkImageLoader);
public:
    using ArtworkImageLoaderCallback = Function<void(Image*)>;
    // The callback will only be called upon success or explicit failure to retrieve the image. If the operation is interrupted following the
    // destruction of the ArtworkImageLoader, the callback won't be called.
    WEBCORE_EXPORT ArtworkImageLoader(Document&, const String& src, ArtworkImageLoaderCallback&&);
    WEBCORE_EXPORT ~ArtworkImageLoader();

    WEBCORE_EXPORT void requestImageResource();

protected:
    void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) override;

private:
    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;
    const String m_src;
    ArtworkImageLoaderCallback m_callback;
    CachedResourceHandle<CachedImage> m_cachedImage;
};

class MediaMetadata final : public RefCounted<MediaMetadata> {
public:
    static ExceptionOr<Ref<MediaMetadata>> create(ScriptExecutionContext&, std::optional<MediaMetadataInit>&&);
    static Ref<MediaMetadata> create(MediaSession&, Vector<URL>&&);
    ~MediaMetadata();

    void setMediaSession(MediaSession&);
    void resetMediaSession();

    const String& title() const { return m_metadata.title; }
    void setTitle(const String&);

    const String& artist() const { return m_metadata.artist; }
    void setArtist(const String&);

    const String& album() const { return m_metadata.album; }
    void setAlbum(const String&);

    const Vector<MediaImage>& artwork() const { return m_metadata.artwork; }
    ExceptionOr<void> setArtwork(ScriptExecutionContext&, Vector<MediaImage>&&);

    const String& artworkSrc() const { return m_artworkImageSrc; }
    const RefPtr<Image>& artworkImage() const { return m_artworkImage; }

    const MediaSessionMetadata& metadata() const { return m_metadata; }

#if ENABLE(MEDIA_SESSION_PLAYLIST)
    const String& trackIdentifier() const { return m_metadata.trackIdentifier; }
    void setTrackIdentifier(const String&);
#endif

private:
    struct Pair {
        float score;
        String src;
    };

    MediaMetadata();
    void setArtworkImage(Image*);
    void metadataUpdated();
    void refreshArtworkImage();
    void tryNextArtworkImage(uint32_t, Vector<Pair>&&);

    static constexpr int s_minimumSize = 128;
    static constexpr int s_idealSize = 512;

    WeakPtr<MediaSession> m_session;
    MediaSessionMetadata m_metadata;
    std::unique_ptr<ArtworkImageLoader> m_artworkLoader;
    String m_artworkImageSrc;
    RefPtr<Image> m_artworkImage;
    Vector<URL> m_defaultImages;
};

}

#endif
